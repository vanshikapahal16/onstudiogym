import Member from "@/models/Member";
import Payment from "@/models/Payment";
import Notification from "@/models/Notification";
import { connectToDatabase } from "@/lib/db";
import { differenceInDays, subDays } from "date-fns";

let lastRunDate: string | null = null;

export async function runDailyAutomation() {
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Ensure this service only runs once per day in serverless environments
  if (lastRunDate === todayStr) {
    return;
  }

  try {
    await connectToDatabase();
    console.log("⚡ Executing Daily automated operations...");

    const today = new Date();
    
    // Fetch all members to analyze
    const members = await Member.find({});
    
    // 1. Pre-fetch pending payments to avoid N+1 queries in the loop
    const pendingPayments = await Payment.find({ status: "Pending" });
    const paymentsByMember: Record<string, any[]> = {};
    pendingPayments.forEach(p => {
      const mId = p.memberId ? p.memberId.toString() : "";
      if (mId) {
        if (!paymentsByMember[mId]) {
          paymentsByMember[mId] = [];
        }
        paymentsByMember[mId].push(p);
      }
    });

    // 2. Pre-fetch recent "We miss you!" notifications to avoid N+1 queries in the loop
    const recentNotifications = await Notification.find({
      type: "system",
      title: "We miss you!",
      createdAt: { $gte: subDays(today, 7) }
    });
    const notifiedUserIds = new Set(
      recentNotifications.map(n => n.userId ? n.userId.toString() : "")
    );

    // Arrays to collect bulk/batch operations
    const memberUpdates: any[] = [];
    const paymentUpdates: any[] = [];
    const newNotifications: any[] = [];

    for (const member of members) {
      // Skip automated status updates for Pending or Suspended members
      if (member.membershipStatus === "Pending" || member.membershipStatus === "Suspended") {
        continue;
      }

      const expiryDate = member.membershipExpiry || member.membershipEndDate;
      if (!expiryDate) continue;

      const daysLeft = differenceInDays(new Date(expiryDate), today);
      let updatedStatus = "Active";

      if (daysLeft < 0) {
        updatedStatus = "Expired";
      } else if (daysLeft <= 10) {
        updatedStatus = "Expiring Soon";
      }

      // 1. Membership Expiry Automation
      if (member.membershipStatus !== updatedStatus) {
        member.membershipStatus = updatedStatus;
        memberUpdates.push(member);

        // Generate Expiry Notifications
        if (updatedStatus === "Expired") {
          newNotifications.push({
            userId: member._id,
            title: "Membership Expired",
            message: `Hey ${member.fullName || member.name}, your membership expired on ${new Date(expiryDate).toLocaleDateString()}. Please renew!`,
            type: "expiry",
          });
        } else if (updatedStatus === "Expiring Soon") {
          newNotifications.push({
            userId: member._id,
            title: "Membership Expiring Soon",
            message: `Hey ${member.fullName || member.name}, your membership is expiring in ${daysLeft} days. Renew early!`,
            type: "expiry",
          });
        }
      }

      // 2. Overdue Payment Detection
      if (member.remainingAmount > 0) {
        // If payment is pending and membership is expired, mark Payment Overdue
        const memberIdStr = member._id.toString();
        const mPayments = paymentsByMember[memberIdStr] || [];
        const joinDate = member.joinDate || member.membershipStartDate || member.createdAt;
        
        for (const payment of mPayments) {
          if (joinDate && differenceInDays(today, new Date(joinDate)) > 30) {
            payment.status = "Overdue";
            paymentUpdates.push(payment);

            // Create notification for overdue dues
            newNotifications.push({
              userId: member._id,
              title: "Overdue Payment Notice",
              message: `Your payment of $${member.remainingAmount} is currently overdue. Please contact reception.`,
              type: "payment",
            });
          }
        }
      }

      // 3. Inactive Member Retention Alert
      if (member.lastVisit) {
        const daysSinceLastVisit = differenceInDays(today, new Date(member.lastVisit));
        if (daysSinceLastVisit >= 15) {
          const memberIdStr = member._id.toString();
          if (!notifiedUserIds.has(memberIdStr)) {
            newNotifications.push({
              userId: member._id,
              title: "We miss you!",
              message: `It has been ${daysSinceLastVisit} days since your last visit. We'd love to see you back crushing goals!`,
              type: "system",
            });
          }
        }
      }
    }

    // Execute Bulk Writes
    if (newNotifications.length > 0) {
      await Notification.insertMany(newNotifications);
      console.log(`✉️ Inserted ${newNotifications.length} notifications in bulk.`);
    }

    if (paymentUpdates.length > 0) {
      if (global.useMockDatabase) {
        await Promise.all(paymentUpdates.map(p => p.save()));
      } else {
        const bulkOps = paymentUpdates.map(p => ({
          updateOne: {
            filter: { _id: p._id },
            update: { $set: { status: p.status } }
          }
        }));
        await Payment.bulkWrite(bulkOps);
      }
      console.log(`💳 Updated ${paymentUpdates.length} payments in bulk.`);
    }

    if (memberUpdates.length > 0) {
      if (global.useMockDatabase) {
        await Promise.all(memberUpdates.map(m => m.save()));
      } else {
        const bulkOps = memberUpdates.map(m => ({
          updateOne: {
            filter: { _id: m._id },
            update: { $set: { membershipStatus: m.membershipStatus } }
          }
        }));
        await Member.bulkWrite(bulkOps);
      }
      console.log(`👤 Updated ${memberUpdates.length} members in bulk.`);
    }

    lastRunDate = todayStr;
    console.log("⚡ Daily automated check completed successfully.");
  } catch (error) {
    console.error("❌ Daily automation error:", error);
  }
}

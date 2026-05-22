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

    const members = await Member.find({});
    const today = new Date();

    for (const member of members) {
      const daysLeft = differenceInDays(new Date(member.membershipExpiry), today);
      let updatedStatus = "Active";

      if (daysLeft < 0) {
        updatedStatus = "Expired";
      } else if (daysLeft <= 10) {
        updatedStatus = "Expiring Soon";
      }

      // 1. Membership Expiry Automation
      if (member.membershipStatus !== updatedStatus) {
        member.membershipStatus = updatedStatus;
        await member.save();

        // Generate Expiry Notifications
        if (updatedStatus === "Expired") {
          await Notification.create({
            userId: member._id,
            title: "Membership Expired",
            message: `Hey ${member.fullName}, your membership expired on ${new Date(member.membershipExpiry).toLocaleDateString()}. Please renew!`,
            type: "expiry",
          });
        } else if (updatedStatus === "Expiring Soon") {
          await Notification.create({
            userId: member._id,
            title: "Membership Expiring Soon",
            message: `Hey ${member.fullName}, your membership is expiring in ${daysLeft} days. Renew early!`,
            type: "expiry",
          });
        }
      }

      // 2. Overdue Payment Detection
      if (member.remainingAmount > 0) {
        // If payment is pending and membership is expired, mark Payment Overdue
        const payments = await Payment.find({ memberId: member._id });
        for (const payment of payments) {
          if (payment.status === "Pending" && differenceInDays(today, new Date(member.joinDate)) > 30) {
            payment.status = "Overdue";
            await payment.save();

            // Create notification for overdue dues
            await Notification.create({
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
          // Check if notification already sent in the last 7 days
          const recentNotification = await Notification.findOne({
            userId: member._id,
            type: "system",
            title: "We miss you!",
            createdAt: { $gte: subDays(today, 7) }
          });

          if (!recentNotification) {
            await Notification.create({
              userId: member._id,
              title: "We miss you!",
              message: `It has been ${daysSinceLastVisit} days since your last visit. We'd love to see you back crushing goals!`,
              type: "system",
            });
          }
        }
      }
    }

    lastRunDate = todayStr;
    console.log("⚡ Daily automated check completed successfully.");
  } catch (error) {
    console.error("❌ Daily automation error:", error);
  }
}

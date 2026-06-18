import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import Payment from "@/models/Payment";
import { uploadImage } from "@/lib/cloudinary";
import { addMonths } from "date-fns";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { sendSuccess, sendUnauthorized, sendNotFound, sendError } from "@/utils/response";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";

// GET /api/members/:id (Get Single Member)
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await connectToDatabase();
    const member = await Member.findById(params.id).select("-password -hashedPassword");

    if (!member) {
      return sendNotFound("Member not found");
    }

    // 1. Try custom admin JWT first (used by Admin Portal)
    const decoded = verifyAuthToken(req);
    const isCustomAdmin = isAdmin(decoded);
    
    let isUserAdmin = isCustomAdmin;
    let isOwner = false;

    // 2. If not a custom admin, try Clerk auth (used by Member Portal)
    if (!isCustomAdmin) {
      const { userId: clerkUserId } = await auth();
      if (clerkUserId) {
        isOwner = member.clerkId === clerkUserId;
        
        const { sessionClaims } = await auth();
        let emailAddress = (sessionClaims as any)?.email;
        if (!emailAddress) {
          const client = await clerkClient();
          const user = await client.users.getUser(clerkUserId);
          emailAddress = user.emailAddresses[0]?.emailAddress;
        }
        const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim());
        isUserAdmin = !!(emailAddress && adminEmails.includes(emailAddress.toLowerCase()));
      }
    }

    if (!isUserAdmin && !isOwner) {
      return sendUnauthorized("You cannot access another member's profile");
    }

    return sendSuccess("Member details loaded", { member });
  } catch (error) {
    return sendError("Failed to load member", error, 500);
  }
}

// PUT /api/members/:id (Update Member details)
export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const updates = await req.json();

    await connectToDatabase();
    const member = await Member.findById(params.id);

    if (!member) {
      return sendNotFound("Member not found");
    }

    // 1. Try custom admin JWT first (used by Admin Portal)
    const decoded = verifyAuthToken(req);
    const isCustomAdmin = isAdmin(decoded);
    
    let isUserAdmin = isCustomAdmin;
    let isOwner = false;

    // 2. If not a custom admin, try Clerk auth (used by Member Portal)
    if (!isCustomAdmin) {
      const { userId: clerkUserId } = await auth();
      if (clerkUserId) {
        isOwner = member.clerkId === clerkUserId;
        
        const { sessionClaims } = await auth();
        let emailAddress = (sessionClaims as any)?.email;
        if (!emailAddress) {
          const client = await clerkClient();
          const user = await client.users.getUser(clerkUserId);
          emailAddress = user.emailAddresses[0]?.emailAddress;
        }
        const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim());
        isUserAdmin = !!(emailAddress && adminEmails.includes(emailAddress.toLowerCase()));
      }
    }

    if (!isUserAdmin && !isOwner) {
      return sendUnauthorized("Unauthorized modification attempt");
    }

    // Handle Profile Image Upload (from base64 format)
    let profileImageUrl = updates.profileImage;
    if (profileImageUrl && profileImageUrl.startsWith("data:image/")) {
      try {
        const uploadResult = await uploadImage(profileImageUrl);
        profileImageUrl = uploadResult.url;
      } catch (err) {
        console.error("Failed to upload profile image:", err);
      }
    }

    if (!isUserAdmin) {
      // Strict updates for members
      if (updates.phoneNumber || updates.phone) {
        member.phone = updates.phone || updates.phoneNumber;
      }
      if (updates.address) member.address = updates.address;
      if (profileImageUrl) member.profileImage = profileImageUrl;
    } else {
      // Admin fully authorized updates
      if (updates.fullName !== undefined || updates.name !== undefined) {
        member.name = updates.name !== undefined ? updates.name : updates.fullName;
      }
      if (updates.phoneNumber !== undefined || updates.phone !== undefined) {
        member.phone = updates.phone !== undefined ? updates.phone : updates.phoneNumber;
      }
      if (updates.address !== undefined) member.address = updates.address;
      if (updates.email !== undefined) member.email = updates.email.toLowerCase();
      
      // Update approved status if provided
      if (updates.approved !== undefined) {
        member.approved = updates.approved;
        if (updates.approved) {
          member.membershipActive = true;
          member.isActive = true;
          member.membershipStatus = "Active";
          member.membershipStartDate = new Date();
        }
      }

      // Check Active/Suspend toggle
      if (updates.isActive !== undefined) {
        member.isActive = updates.isActive;
        member.membershipActive = updates.isActive;
        if (!updates.isActive) {
          member.membershipStatus = "Suspended";
        } else {
          // Trigger recalculation of status in save hook
          member.membershipStatus = "Active";
        }
      }

      // Process Renewal details if provided
      if (updates.renewMonths) {
        const renewMonths = parseInt(updates.renewMonths);
        const renewFee = parseFloat(updates.renewFee || "0");
        const renewPaid = parseFloat(updates.renewPaid || "0");

        // Reset current plan metrics
        member.membershipDuration = renewMonths;
        if (renewMonths === 1) member.membershipPlan = "Monthly";
        else if (renewMonths === 3) member.membershipPlan = "Quarterly";
        else if (renewMonths === 6) member.membershipPlan = "Half-Yearly";
        else if (renewMonths === 12) member.membershipPlan = "Annual";

        member.totalFee = renewFee;
        member.totalPaid = renewPaid;
        member.remainingAmount = Math.max(0, renewFee - renewPaid);
        member.membershipStartDate = new Date(); // renew from today
        member.membershipEndDate = addMonths(member.membershipStartDate, renewMonths);
        member.membershipStatus = "Active";
        member.isActive = true;
        member.approved = true;
        member.membershipActive = true;

        // Create transaction history entry for this renewal
        if (renewPaid > 0) {
          const paymentStatus = member.remainingAmount === 0 ? "Paid" : "Partially Paid";
          await Payment.create({
            memberId: member._id,
            amount: renewPaid,
            invoiceId: `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            status: paymentStatus,
            date: new Date(),
          });
        }
      } else {
        // Standard admin edits (only if not doing a renewal)
        if (updates.membershipPlan !== undefined) {
          member.membershipPlan = updates.membershipPlan;
          const plan = updates.membershipPlan;
          if (plan === "Monthly") member.membershipDuration = 1;
          else if (plan === "Quarterly") member.membershipDuration = 3;
          else if (plan === "Half-Yearly") member.membershipDuration = 6;
          else if (plan === "Annual") member.membershipDuration = 12;
        }

        if (updates.membershipDuration !== undefined) {
          member.membershipDuration = updates.membershipDuration;
          const dur = updates.membershipDuration;
          if (dur === 1) member.membershipPlan = "Monthly";
          else if (dur === 3) member.membershipPlan = "Quarterly";
          else if (dur === 6) member.membershipPlan = "Half-Yearly";
          else if (dur === 12) member.membershipPlan = "Annual";
        }

        const oldStatus = member.membershipStatus;

        if (updates.totalFee !== undefined) member.totalFee = updates.totalFee;
        
        if (updates.totalPaid !== undefined) {
          const oldPaid = member.totalPaid || 0;
          member.totalPaid = updates.totalPaid;
          
          const newStatus = updates.membershipStatus || member.membershipStatus;
          const isApproving = oldStatus === "Pending" && newStatus === "Active";
          const diff = updates.totalPaid - oldPaid;
          
          if (diff > 0 && (isApproving || oldStatus !== "Pending")) {
            const feeToCheck = updates.totalFee !== undefined ? updates.totalFee : member.totalFee;
            const remaining = Math.max(0, feeToCheck - updates.totalPaid);
            const paymentStatus = remaining === 0 ? "Paid" : "Partially Paid";
            
            await Payment.create({
              memberId: member._id,
              amount: diff,
              invoiceId: `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
              status: paymentStatus,
              date: new Date(),
            });
          }
        }
        
        if (updates.membershipStatus) {
          member.membershipStatus = updates.membershipStatus;
          if (updates.membershipStatus === "Suspended" || updates.membershipStatus === "Pending") {
            member.isActive = false;
            member.membershipActive = false;
          } else {
            member.isActive = true;
            member.membershipActive = true;
            member.approved = true;
          }
        }

        const isApproving = oldStatus === "Pending" && (updates.membershipStatus === "Active" || updates.membershipStatus === "Expiring Soon");
        if (isApproving) {
          member.membershipStartDate = new Date();
          member.approved = true;
          member.membershipActive = true;
          member.isActive = true;
        }
      }

      if (profileImageUrl) member.profileImage = profileImageUrl;
    }

    await member.save();

    return sendSuccess("Member updated successfully", {
      member: {
        id: member._id,
        fullName: member.fullName,
        phoneNumber: member.phoneNumber,
        address: member.address,
        remainingAmount: member.remainingAmount,
        membershipExpiry: member.membershipExpiry,
        membershipStatus: member.membershipStatus,
        isActive: member.isActive,
      },
    });
  } catch (error) {
    console.error("Failed to update member details:", error);
    return sendError("Failed to update member", error, 500);
  }
}

// DELETE /api/members/:id (Admin only deletes member)
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    // 1. Try custom admin JWT first (used by Admin Portal)
    const decoded = verifyAuthToken(req);
    const isCustomAdmin = isAdmin(decoded);
    
    let isUserAdmin = isCustomAdmin;

    // 2. If not a custom admin, try Clerk auth (used by Member Portal or Clerk admins)
    if (!isCustomAdmin) {
      const { userId: clerkUserId } = await auth();
      if (clerkUserId) {
        const { sessionClaims } = await auth();
        let emailAddress = (sessionClaims as any)?.email;
        if (!emailAddress) {
          const client = await clerkClient();
          const user = await client.users.getUser(clerkUserId);
          emailAddress = user.emailAddresses[0]?.emailAddress;
        }
        const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim());
        isUserAdmin = !!(emailAddress && adminEmails.includes(emailAddress.toLowerCase()));
      }
    }

    if (!isUserAdmin) {
      return sendUnauthorized();
    }

    await connectToDatabase();
    const member = await Member.findByIdAndDelete(params.id);

    if (!member) {
      return sendNotFound("Member not found");
    }

    // Clean up associated payment logs, attendance records, and notifications
    await Payment.deleteMany({ memberId: params.id });
    
    try {
      const AttendanceModule = await import("@/models/Attendance");
      const Attendance = mongoose.models.Attendance || AttendanceModule.default || AttendanceModule;
      await Attendance.deleteMany({ memberId: params.id });
    } catch (err) {
      console.error("Failed to delete member attendance logs:", err);
    }

    try {
      const NotificationModule = await import("@/models/Notification");
      const Notification = mongoose.models.Notification || NotificationModule.default || NotificationModule;
      await Notification.deleteMany({ userId: params.id });
    } catch (err) {
      console.error("Failed to delete member notifications:", err);
    }

    return sendSuccess("Member deleted successfully");
  } catch (error) {
    return sendError("Failed to delete member", error, 500);
  }
}

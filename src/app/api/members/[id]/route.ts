import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import Payment from "@/models/Payment";
import { uploadImage } from "@/lib/cloudinary";
import { addMonths } from "date-fns";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendNotFound, sendError } from "@/utils/response";

// GET /api/members/:id (Get Single Member)
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return sendUnauthorized();
    }

    // Block members from viewing other member profiles
    if (decoded.role === "member" && decoded.id !== params.id) {
      return sendUnauthorized("You cannot access another member's profile");
    }

    await connectToDatabase();
    const member = await Member.findById(params.id).select("-password -hashedPassword");

    if (!member) {
      return sendNotFound("Member not found");
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
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return sendUnauthorized();
    }

    const updates = await req.json();

    await connectToDatabase();
    const member = await Member.findById(params.id);

    if (!member) {
      return sendNotFound("Member not found");
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

    if (decoded.role === "member") {
      if (decoded.id !== params.id) {
        return sendUnauthorized("Unauthorized modification attempt");
      }
      
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
      
      // Password reset functionality
      if (updates.password) {
        member.password = updates.password;
        member.mustChangePassword = true; // reset forces password change on next login
      }

      // Check Active/Suspend toggle
      if (updates.isActive !== undefined) {
        member.isActive = updates.isActive;
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

        if (updates.totalFee !== undefined) member.totalFee = updates.totalFee;
        if (updates.totalPaid !== undefined) member.totalPaid = updates.totalPaid;
        
        if (updates.membershipStatus) {
          member.membershipStatus = updates.membershipStatus;
          if (updates.membershipStatus === "Suspended") {
            member.isActive = false;
          } else {
            member.isActive = true;
          }
        }
      }

      if (profileImageUrl) member.profileImage = profileImageUrl;
    }

    await member.save(); // Save hook re-calculates dues and expiry!

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
    return sendError("Failed to update member", error, 500);
  }
}

// DELETE /api/members/:id (Admin only deletes member)
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const decoded = verifyAuthToken(req);
    if (!decoded || !isAdmin(decoded)) {
      return sendUnauthorized();
    }

    await connectToDatabase();
    const member = await Member.findByIdAndDelete(params.id);

    if (!member) {
      return sendNotFound("Member not found");
    }

    return sendSuccess("Member deleted successfully");
  } catch (error) {
    return sendError("Failed to delete member", error, 500);
  }
}

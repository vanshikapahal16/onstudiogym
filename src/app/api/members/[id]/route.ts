import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import Payment from "@/models/Payment";
import { uploadImage } from "@/lib/cloudinary";
import { addMonths } from "date-fns";
import { verifyAuthToken } from "@/middleware/auth";
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
    const member = await Member.findById(params.id).select("-password");

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
      if (updates.phoneNumber) member.phoneNumber = updates.phoneNumber;
      if (updates.address) member.address = updates.address;
      if (profileImageUrl) member.profileImage = profileImageUrl;
    } else {
      // Admin fully authorized updates
      if (updates.fullName) member.fullName = updates.fullName;
      if (updates.phoneNumber) member.phoneNumber = updates.phoneNumber;
      if (updates.address) member.address = updates.address;
      if (updates.email) member.email = updates.email;
      
      // Process Renewal details if provided
      if (updates.renewMonths) {
        const renewMonths = parseInt(updates.renewMonths);
        const renewFee = parseFloat(updates.renewFee || "0");
        const renewPaid = parseFloat(updates.renewPaid || "0");

        // Reset current plan metrics
        member.membershipDuration = renewMonths;
        member.totalFee = renewFee;
        member.totalPaid = renewPaid;
        member.remainingAmount = Math.max(0, renewFee - renewPaid);
        member.joinDate = new Date();

        // Calculate and set new expiry from now
        member.membershipExpiry = addMonths(member.joinDate, renewMonths);
        member.membershipStatus = "Active";

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
        if (updates.totalFee !== undefined) member.totalFee = updates.totalFee;
        if (updates.totalPaid !== undefined) member.totalPaid = updates.totalPaid;
        if (updates.membershipDuration !== undefined) member.membershipDuration = updates.membershipDuration;
        
        // Note: membershipExpiry recalculation is triggered in Member pre("save") hook
        // but we can manually override it if duration is changed.
        if (updates.membershipStatus) {
          member.membershipStatus = updates.membershipStatus;
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
    if (!decoded || decoded.role !== "admin") {
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

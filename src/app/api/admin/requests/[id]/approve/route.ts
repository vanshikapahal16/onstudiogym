import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import { sendSuccess, sendError } from "@/utils/response";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return sendError("Unauthorized", null, 401);
    }
    if (!isAdmin(decoded)) {
      return sendError("Forbidden: Admin credentials required", null, 403);
    }

    await connectToDatabase();
    const params = await props.params;
    const memberId = params.id;

    const member = await Member.findById(memberId);
    if (!member) {
      return sendError("Member request not found", null, 404);
    }

    if (member.approved) {
      return sendError("Member is already approved", null, 400);
    }

    const body = await req.json().catch(() => ({}));
    const totalFee = body.totalFee || 0;
    const membershipDuration = body.membershipDuration || 1; // 1 month default
    const address = body.address || member.address || "N/A";

    member.approved = true;
    member.membershipActive = true;
    member.isActive = true;
    member.membershipStatus = "Active";
    member.membershipStartDate = new Date();
    
    // Set plan options if provided at approval
    if (totalFee) member.totalFee = totalFee;
    if (membershipDuration) {
      member.membershipDuration = membershipDuration;
      if (membershipDuration === 1) member.membershipPlan = "Monthly";
      else if (membershipDuration === 3) member.membershipPlan = "Quarterly";
      else if (membershipDuration === 6) member.membershipPlan = "Half-Yearly";
      else if (membershipDuration === 12) member.membershipPlan = "Annual";
    }
    if (address) member.address = address;

    await member.save();

    return sendSuccess("Member approved successfully", {
      memberId: member._id,
    });
  } catch (error) {
    console.error("Approve member error:", error);
    return sendError("Failed to approve member", error, 500);
  }
}

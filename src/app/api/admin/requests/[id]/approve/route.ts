import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import PendingMember from "@/models/PendingMember";
import Member from "@/models/Member";
import { sendSuccess, sendError } from "@/utils/response";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const requestId = params.id;

    const request = await PendingMember.findById(requestId);
    if (!request) {
      return sendError("Request not found", null, 404);
    }

    if (request.status === "Approved") {
      return sendError("Request is already approved", null, 400);
    }

    // Generate a random 4-digit passkey
    const passkey = Math.floor(1000 + Math.random() * 9000).toString();

    // The frontend/admin is expected to define the membership duration and fees at approval, or use defaults
    const body = await req.json().catch(() => ({}));
    const totalFee = body.totalFee || 0;
    const membershipDuration = body.membershipDuration || 1; // 1 month default
    const address = body.address || "N/A"; // Or capture in signup if needed

    // Check if member already exists just in case
    const existingMember = await Member.findOne({
      $or: [{ phoneNumber: request.phoneNumber }, { email: request.email }],
    });
    
    if (existingMember) {
      return sendError("Member with this phone or email already exists", null, 400);
    }

    const member = await Member.create({
      fullName: request.fullName,
      phoneNumber: request.phoneNumber,
      email: request.email,
      address,
      password: passkey, // Pre-save hook hashes it
      totalFee,
      membershipDuration,
      mustChangePassword: true,
    });

    request.status = "Approved";
    await request.save();

    return sendSuccess("Request approved and member created successfully", {
      memberId: member._id,
      passkey, // Sending it back to the admin so they can share it
    });
  } catch (error) {
    console.error("Approve request error:", error);
    return sendError("Failed to approve request", error, 500);
  }
}

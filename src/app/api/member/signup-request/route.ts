import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import PendingMember from "@/models/PendingMember";
import Member from "@/models/Member";
import { sendSuccess, sendError } from "@/utils/response";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { fullName, phoneNumber, email } = await req.json();

    if (!fullName || !phoneNumber || !email) {
      return sendError("Please provide all required fields", null, 400);
    }

    // Check if member already exists
    const existingMember = await Member.findOne({ $or: [{ phoneNumber }, { email }] });
    if (existingMember) {
      return sendError("An active member with this phone or email already exists", null, 400);
    }

    // Check if a pending request already exists
    const existingRequest = await PendingMember.findOne({ $or: [{ phoneNumber }, { email }] });
    if (existingRequest) {
      if (existingRequest.status === "Pending") {
        return sendError("A sign-up request is already pending for this phone or email", null, 400);
      } else if (existingRequest.status === "Approved") {
        return sendError("This request is already approved. Please sign in.", null, 400);
      }
    }

    const pendingRequest = await PendingMember.create({
      fullName,
      phoneNumber,
      email,
      status: "Pending",
    });

    return sendSuccess("Sign-up request submitted successfully. Please wait for admin approval.", {
      requestId: pendingRequest._id,
    }, 201);
  } catch (error) {
    console.error("Sign-up request error:", error);
    return sendError("Failed to submit request", error, 500);
  }
}

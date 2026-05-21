import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError, sendNotFound } from "@/utils/response";

export async function POST(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || decoded.role !== "member") {
      return sendUnauthorized();
    }

    const { newPassword } = await req.json();
    if (!newPassword || newPassword.length < 6) {
      return sendError("Password must be at least 6 characters long", null, 400);
    }

    await connectToDatabase();
    const member = await Member.findById(decoded.id);

    if (!member) {
      return sendNotFound("Member not found");
    }

    member.password = newPassword; // Save hook hashes this
    member.mustChangePassword = false; // Complete onboarding password reset
    await member.save();

    return sendSuccess("Password changed successfully. Onboarding completed!");
  } catch (error) {
    return sendError("Failed to change password", error, 500);
  }
}

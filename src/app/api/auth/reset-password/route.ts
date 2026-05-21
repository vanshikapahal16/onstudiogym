import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Admin from "@/models/Admin";
import Member from "@/models/Member";
import { sendSuccess, sendError } from "@/utils/response";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const { token, password, role } = await req.json();

    if (!token || !password) {
      return sendError("Token and password are required", null, 400);
    }

    let user: any = null;

    // Look for the user with the matching active reset token
    if (role === "admin") {
      user = await Admin.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });
    } else if (role === "member") {
      user = await Member.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });
    } else {
      // Auto-detect by searching both
      user = await Admin.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        user = await Member.findOne({
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: new Date() },
        });
      }
    }

    if (!user) {
      return sendError("Password reset token is invalid or has expired.", null, 400);
    }

    // Set the new password (pre-save hook hashes it automatically)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // If it's a member, we can also mark mustChangePassword to false since they just set their password
    if (user.role === "member") {
      user.mustChangePassword = false;
    }

    await user.save();

    return sendSuccess("Password has been successfully reset. You can now login with your new password.");
  } catch (error) {
    return sendError("Failed to reset password", error, 500);
  }
}

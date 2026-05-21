import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import { setAuthCookie } from "@/middleware/auth";
import { sendSuccess, sendError } from "@/utils/response";
import { runDailyAutomation } from "@/services/cron";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Auto-run daily checks
    await runDailyAutomation();

    const { loginId, password } = await req.json(); // loginId can be phone number or email

    if (!loginId || !password) {
      return sendError("Please provide phone/email and password", null, 400);
    }

    // Auto-seed default member if member count is 0
    const memberCount = await Member.countDocuments();
    if (memberCount === 0) {
      await Member.create({
        fullName: "Gym Member",
        phoneNumber: "9876543210",
        email: "member@gym.com",
        address: "123 Fitness Street",
        password: "Member@123", // This will be hashed automatically by the save hook
        membershipDuration: 12,
        totalFee: 500,
        totalPaid: 500,
        mustChangePassword: false,
        role: "member",
      });
    }

    // Try finding by email or phone
    const member = await Member.findOne({
      $or: [{ email: loginId.toLowerCase() }, { phoneNumber: loginId }],
    });

    if (!member) {
      return sendError("Invalid phone number or email. Account not found.", null, 401);
    }

    const isMatch = await member.comparePassword(password);
    if (!isMatch) {
      return sendError("Incorrect password. Please try again.", null, 401);
    }

    let response = sendSuccess("Login successful", {
      member: {
        id: member._id,
        fullName: member.fullName,
        phoneNumber: member.phoneNumber,
        email: member.email,
        mustChangePassword: member.mustChangePassword,
        role: member.role,
      },
    });

    // Attach HttpOnly cookie
    response = setAuthCookie(response, { id: member._id, role: "member" });
    return response;
  } catch (error) {
    return sendError("Internal server error during login", error, 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Admin from "@/models/Admin";
import { setAuthCookie } from "@/middleware/auth";
import { sendSuccess, sendError } from "@/utils/response";
import { runDailyAutomation } from "@/services/cron";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Auto-run daily cron trigger when login is requested
    await runDailyAutomation();

    const { email, identifier: bodyIdentifier, password } = await req.json();
    const identifier = (email || bodyIdentifier || "").trim();

    if (!identifier || !password) {
      return sendError("Please provide email or phone number and password", null, 400);
    }

    const admin = await Admin.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });

    if (!admin) {
      return sendError("Invalid credentials. Admin account not found.", null, 401);
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return sendError("Incorrect password. Please try again.", null, 401);
    }

    if (!admin.isActive) {
      return sendError("Your account has been deactivated. Please contact the owner.", null, 403);
    }

    let response = sendSuccess("Login successful", {
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      },
    });

    // Attach HttpOnly cookie with their actual role (superadmin or admin)
    response = setAuthCookie(response, { id: admin._id.toString(), role: admin.role });
    return response;
  } catch (error) {
    return sendError("Internal server error during login", error, 500);
  }
}

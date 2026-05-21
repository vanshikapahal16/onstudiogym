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

    const { email, password } = await req.json();

    if (!email || !password) {
      return sendError("Please provide email and password", null, 400);
    }

    // Check if any admin exists. If not, seed a default admin for ease of setup!
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await Admin.create({
        fullName: "Super Admin",
        email: "admin@gym.com",
        password: "Admin@123", // This will be hashed automatically by the save hook
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return sendError("Invalid email address. Admin account not found.", null, 401);
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return sendError("Incorrect password. Please try again.", null, 401);
    }

    let response = sendSuccess("Login successful", {
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      },
    });

    // Attach HttpOnly cookie
    response = setAuthCookie(response, { id: admin._id, role: "admin" });
    return response;
  } catch (error) {
    return sendError("Internal server error during login", error, 500);
  }
}

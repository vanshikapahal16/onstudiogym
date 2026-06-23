import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Attendance from "@/models/Attendance";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const decoded = verifyAuthToken(req);
    if (!decoded || decoded.role !== "member") {
      return sendUnauthorized("You must be logged in as a member to view your history.");
    }

    await connectToDatabase();

    // 2. Fetch history
    const history = await Attendance.find({ userId: decoded.id })
      .sort({ date: -1, time: -1 });

    return sendSuccess("Attendance history retrieved successfully", { history });
  } catch (error) {
    console.error("Failed to fetch my attendance history:", error);
    return sendError("An internal error occurred while fetching your history.", error, 500);
  }
}

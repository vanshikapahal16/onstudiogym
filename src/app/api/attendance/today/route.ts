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
      return sendUnauthorized("You must be logged in as a member to check today's status.");
    }

    await connectToDatabase();

    // 2. Format today's date in IST/Local system timezone
    const istOffset = 5.5 * 60 * 60 * 1000;
    const dateObj = new Date(Date.now() + istOffset);
    const dateStr = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD

    // 3. Find attendance
    const attendance = await Attendance.findOne({
      userId: decoded.id,
      date: dateStr,
    });

    return sendSuccess("Checked today's attendance status successfully", {
      marked: !!attendance,
      attendance: attendance || null,
    });
  } catch (error) {
    console.error("Failed to check today's attendance:", error);
    return sendError("An internal error occurred while checking today's attendance.", error, 500);
  }
}

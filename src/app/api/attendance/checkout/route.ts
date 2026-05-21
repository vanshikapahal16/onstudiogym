import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Attendance from "@/models/Attendance";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError, sendNotFound } from "@/utils/response";
import { differenceInMinutes } from "date-fns";

// POST /api/attendance/checkout (Admin checks out a member)
export async function POST(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || decoded.role !== "admin") {
      return sendUnauthorized("Only admin/reception can perform check-out");
    }

    await connectToDatabase();
    const { memberId } = await req.json();

    if (!memberId) {
      return sendError("Please provide memberId", null, 400);
    }

    // Find active session (where checkOut is null)
    const activeSession = await Attendance.findOne({ memberId, checkOut: null });
    if (!activeSession) {
      return sendError("No active check-in session found for this member", null, 400);
    }

    // Perform Check-out
    activeSession.checkOut = new Date();
    activeSession.duration = differenceInMinutes(activeSession.checkOut, activeSession.checkIn);
    await activeSession.save();

    return sendSuccess("Checked out successfully", { session: activeSession });
  } catch (error) {
    return sendError("Check-out failed", error, 500);
  }
}

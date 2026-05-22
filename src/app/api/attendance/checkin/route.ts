import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Attendance from "@/models/Attendance";
import Member from "@/models/Member";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError, sendNotFound } from "@/utils/response";

// POST /api/attendance/checkin (Admin checks in a member)
export async function POST(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || !isAdmin(decoded)) {
      return sendUnauthorized("Only admin/reception can perform check-in");
    }

    await connectToDatabase();
    const { memberId } = await req.json();

    if (!memberId) {
      return sendError("Please provide memberId", null, 400);
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return sendNotFound("Member not found");
    }

    // Check if member is active and not suspended/expired
    if (!member.isActive || member.membershipStatus === "Suspended" || member.membershipStatus === "Expired") {
      return sendError(`Access Denied: Member is inactive, suspended, or expired (Status: ${member.membershipStatus || "Inactive"})`, null, 403);
    }

    // Prevent duplicate check-ins on the same day
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const checkInToday = await Attendance.findOne({
      memberId,
      checkIn: { $gte: startOfToday, $lte: endOfToday }
    });
    if (checkInToday) {
      return sendError("Member has already checked in today", null, 400);
    }

    // Check if already checked in (active session where checkOut is null)
    const activeSession = await Attendance.findOne({ memberId, checkOut: null });
    if (activeSession) {
      return sendError("Member is already checked in", null, 400);
    }

    // Perform Check-in
    const session = await Attendance.create({
      memberId,
      checkIn: new Date(),
    });

    // Update Member stats
    member.lastVisit = new Date();
    member.attendanceCount = (member.attendanceCount || 0) + 1;
    await member.save();

    return sendSuccess("Checked in successfully", { session });
  } catch (error) {
    return sendError("Check-in failed", error, 500);
  }
}

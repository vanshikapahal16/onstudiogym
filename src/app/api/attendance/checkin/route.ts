import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Attendance from "@/models/Attendance";
import Member from "@/models/Member";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError, sendNotFound } from "@/utils/response";

// POST /api/attendance/checkin (Admin checks in a member)
export async function POST(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || decoded.role !== "admin") {
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

    // Check if membership is expired
    if (member.membershipStatus === "Expired") {
      return sendError("Access Denied: Membership has expired", null, 403);
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

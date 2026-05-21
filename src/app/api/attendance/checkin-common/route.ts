import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { verifyAuthToken } from "@/middleware/auth";
import Member from "@/models/Member";
import Attendance from "@/models/Attendance";
import { sendSuccess, sendError } from "@/utils/response";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    // 1. Verify User Authentication
    const decoded = verifyAuthToken(req);
    if (!decoded || decoded.role !== "member") {
      return sendError("Unauthorized: Please log in to complete check-in.", null, 401);
    }

    // 2. Find Member in Database
    const member = await Member.findById(decoded.id);
    if (!member) {
      return sendError("Member record not found.", null, 404);
    }

    // 3. Expiry and Suspension Validations
    if (member.membershipStatus === "Suspended") {
      return sendError("Your membership is currently suspended. Please contact the gym administration.", null, 403);
    }

    const today = new Date();
    const expiryDate = member.membershipExpiry ? new Date(member.membershipExpiry) : null;

    if (member.membershipStatus === "Expired" || (expiryDate && expiryDate < today)) {
      return sendError("Your membership has expired. Please contact the administrator to renew.", null, 403);
    }

    // 4. Duplicate Check-in Prevention (Same Calendar Day)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await Attendance.findOne({
      memberId: member._id,
      checkIn: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingAttendance) {
      const timeStr = new Date(existingAttendance.checkIn).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      return sendError(`You have already checked in today at ${timeStr}.`, null, 400);
    }

    // 5. Log Attendance and Update Member Stats
    const newAttendance = await Attendance.create({
      memberId: member._id,
      checkIn: new Date(),
    });

    member.lastVisit = new Date();
    member.attendanceCount = (member.attendanceCount || 0) + 1;
    await member.save();

    return sendSuccess("Check-in successful! Have a great workout.", {
      checkInTime: newAttendance.checkIn,
      member: {
        fullName: member.fullName,
        attendanceCount: member.attendanceCount,
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return sendError("An internal error occurred during check-in.", error, 500);
  }
}

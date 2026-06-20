import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import Attendance from "@/models/Attendance";
import { sendSuccess, sendError, sendNotFound } from "@/utils/response";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { email, identifier } = await req.json();
    const searchVal = identifier || email;

    if (!searchVal) {
      return sendError("Email or Member ID is required for check-in.", null, 400);
    }

    // Check if searchVal is a valid Mongoose ObjectId (24 hex chars)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(searchVal);
    const query = isObjectId ? { _id: searchVal } : { email: searchVal.toLowerCase() };

    // Find the member by email or ID
    console.log("--> checkin-by-email searchVal:", searchVal, "query:", query);
    const member = await Member.findOne(query);
    console.log("--> checkin-by-email found member:", member);
    if (!member) {
      return sendNotFound("No active member found with this email address.");
    }

    // Expiry and Suspension Validations
    if (!member.isActive || member.membershipStatus === "Suspended") {
      return sendError("Your membership is currently suspended. Please contact gym administration.", null, 403);
    }

    const today = new Date();
    const expiryDate = member.membershipExpiry ? new Date(member.membershipExpiry) : null;

    if (member.membershipStatus === "Expired" || (expiryDate && expiryDate < today)) {
      return sendError("Your membership has expired. Please contact the administrator to renew.", null, 403);
    }

    // Duplicate Check-in Prevention (Same Calendar Day)
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

    // Log Attendance and Update Member Stats
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
        email: member.email,
      },
    });
  } catch (error) {
    console.error("Check-in by email error:", error);
    return sendError("An internal error occurred during check-in.", error, 500);
  }
}

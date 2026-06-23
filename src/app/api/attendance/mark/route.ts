import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import Attendance from "@/models/Attendance";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError, sendNotFound } from "@/utils/response";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const decoded = verifyAuthToken(req);
    if (!decoded || decoded.role !== "member") {
      return sendUnauthorized("You must be logged in as a member to mark attendance.");
    }

    await connectToDatabase();

    // 2. Fetch member profile
    const member = await Member.findById(decoded.id);
    if (!member) {
      return sendNotFound("Member account not found.");
    }

    // 3. Status and Expiration validations
    if (!member.isActive || member.membershipStatus === "Suspended") {
      return sendError("Your membership is suspended. Please contact gym administration.", null, 403);
    }

    const today = new Date();
    const expiryDate = member.membershipExpiry || member.membershipEndDate ? new Date(member.membershipExpiry || member.membershipEndDate) : null;
    if (member.membershipStatus === "Expired" || (expiryDate && expiryDate < today)) {
      return sendError("Your membership is expired. Please contact administration to renew.", null, 403);
    }

    // 4. Duplicate Check-in validation (One check-in per day)
    // Extract date in YYYY-MM-DD format (incorporating user's local timezone offset or IST offset if needed, here we use local date string)
    // To ensure consistency, we format as YYYY-MM-DD using Indian Standard Time (IST) offset or system date
    // IST is UTC+5:30. Let's format it in IST/Local system time
    const istOffset = 5.5 * 60 * 60 * 1000;
    const dateObj = new Date(Date.now() + istOffset);
    const dateStr = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD

    const existingAttendance = await Attendance.findOne({
      userId: member._id,
      date: dateStr,
    });

    if (existingAttendance) {
      return sendError("Attendance already marked today.", null, 400);
    }

    const timeStr = dateObj.toISOString().split("T")[1].substring(0, 8); // HH:MM:SS

    // 5. Create Attendance Record
    const newAttendance = await Attendance.create({
      userId: member._id,
      name: member.fullName || member.name,
      email: member.email,
      date: dateStr,
      time: timeStr,
      status: "Present",
    });

    // 6. Update Member stats
    member.lastVisit = new Date();
    member.attendanceCount = (member.attendanceCount || 0) + 1;
    await member.save();

    return sendSuccess("Attendance Marked Successfully ✅", {
      attendance: newAttendance,
    });
  } catch (error) {
    console.error("Failed to mark attendance:", error);
    return sendError("An internal error occurred while marking attendance.", error, 500);
  }
}

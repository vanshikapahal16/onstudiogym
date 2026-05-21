import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Attendance from "@/models/Attendance";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";

// GET /api/attendance (Admin gets all attendance logs)
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || decoded.role !== "admin") {
      return sendUnauthorized();
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const total = await Attendance.countDocuments({});
    const logs = await Attendance.find({})
      .populate("memberId", "fullName phoneNumber profileImage")
      .sort({ checkIn: -1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess("Attendance history loaded", {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError("Failed to fetch attendance logs", error, 500);
  }
}

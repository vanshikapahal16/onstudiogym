import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Attendance from "@/models/Attendance";
import Member from "@/models/Member";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";

// GET /api/attendance/history - Paginated, filterable attendance history list
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || !isAdmin(decoded)) {
      return sendUnauthorized("Only administrators can retrieve attendance history");
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const search = searchParams.get("search") || "";
    const source = searchParams.get("source") || "";

    const query: any = {};

    // Date range filter
    if (startDateStr || endDateStr) {
      query.checkIn = {};
      if (startDateStr) {
        const start = new Date(startDateStr);
        start.setHours(0, 0, 0, 0);
        query.checkIn.$gte = start;
      }
      if (endDateStr) {
        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);
        query.checkIn.$lte = end;
      }
    }

    // Source filter (e.g. 'QR Scan' or 'Manual')
    if (source) {
      query.checkInSource = source;
    }

    // Name search filter
    if (search) {
      const matchedMembers = await Member.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const memberIds = matchedMembers.map((m) => m._id);
      query.memberId = { $in: memberIds };
    }

    const total = await Attendance.countDocuments(query);
    const logs = await Attendance.find(query)
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
    console.error("❌ Failed to fetch attendance history:", error);
    return sendError("Failed to fetch attendance logs", error, 500);
  }
}

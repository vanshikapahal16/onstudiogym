import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Attendance from "@/models/Attendance";
import Member from "@/models/Member";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user as Admin
    const decoded = verifyAuthToken(req);
    if (!decoded || !isAdmin(decoded)) {
      return sendUnauthorized("Only administrators can access this data.");
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || "";
    const memberId = searchParams.get("memberId") || "";
    const email = searchParams.get("email") || "";
    const exportData = searchParams.get("export") === "true";

    const query: any = {};

    // Apply filters
    if (date) {
      query.date = date;
    }
    if (memberId) {
      query.userId = memberId;
    }
    if (email) {
      query.email = { $regex: email, $options: "i" };
    }

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    let logs;
    let total = 0;

    if (exportData) {
      // Return all filtered records for CSV export without pagination limit
      logs = await Attendance.find(query).sort({ date: -1, time: -1 });
      total = logs.length;
    } else {
      total = await Attendance.countDocuments(query);
      logs = await Attendance.find(query)
        .sort({ date: -1, time: -1 })
        .skip(skip)
        .limit(limit);
    }

    // 2. Daily Statistics
    const istOffset = 5.5 * 60 * 60 * 1000;
    const todayDateStr = new Date(Date.now() + istOffset).toISOString().split("T")[0]; // YYYY-MM-DD
    
    const todayCount = await Attendance.countDocuments({ date: todayDateStr });
    const totalActiveMembers = await Member.countDocuments({ 
      isActive: true, 
      membershipStatus: { $ne: "Suspended" } 
    });

    // 3. Monthly Reports
    // Get check-ins grouped by month for the last 6 months
    const monthlyStats = await Attendance.aggregate([
      {
        $project: {
          month: { $substr: ["$date", 0, 7] } // YYYY-MM
        }
      },
      {
        $group: {
          _id: "$month",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $limit: 6
      }
    ]);

    // Format monthly report list
    const monthlyReport = monthlyStats.map(stat => ({
      month: stat._id,
      count: stat.count
    }));

    // Get daily stats for the current month to build charts
    const currentMonthStr = todayDateStr.substring(0, 7); // YYYY-MM
    const currentMonthDailyStats = await Attendance.aggregate([
      {
        $match: {
          date: { $regex: `^${currentMonthStr}` }
        }
      },
      {
        $group: {
          _id: "$date",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const dailyReport = currentMonthDailyStats.map(stat => ({
      date: stat._id,
      count: stat.count
    }));

    return sendSuccess("Admin attendance data loaded successfully", {
      logs,
      pagination: exportData ? null : {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      stats: {
        todayDate: todayDateStr,
        todayCount,
        totalActiveMembers,
        attendanceRate: totalActiveMembers > 0 ? parseFloat(((todayCount / totalActiveMembers) * 100).toFixed(1)) : 0
      },
      reports: {
        monthlyReport,
        dailyReport
      }
    });

  } catch (error) {
    console.error("Failed to fetch admin attendance data:", error);
    return sendError("An internal error occurred while fetching admin attendance data.", error, 500);
  }
}

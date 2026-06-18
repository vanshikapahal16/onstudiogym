import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Attendance from "@/models/Attendance";
import AttendanceLogs from "@/models/AttendanceLogs";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";

// GET /api/attendance/reports - Aggregates attendance statistics for admin charts
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || !isAdmin(decoded)) {
      return sendUnauthorized("Only administrators can retrieve attendance reports");
    }

    await connectToDatabase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Fetch attendance from last 30 days
    const recentLogs = await Attendance.find({
      checkIn: { $gte: thirtyDaysAgo },
    });

    const totalScans = recentLogs.length;

    // Filters for today
    const logsToday = recentLogs.filter((log) => new Date(log.checkIn) >= today);
    const checksTodayCount = logsToday.length;
    const currentlyInsideCount = logsToday.filter((log) => !log.checkOut).length;

    // Source splits (last 30 days)
    const qrScansCount = recentLogs.filter((log) => log.checkInSource === "QR Scan").length;
    const manualChecksCount = recentLogs.filter((log) => log.checkInSource !== "QR Scan").length;

    // Peak hours distribution (last 30 days)
    const hourlyDistribution = Array(24).fill(0);
    recentLogs.forEach((log) => {
      const hour = new Date(log.checkIn).getHours();
      hourlyDistribution[hour]++;
    });

    // Check-ins over last 7 days trend
    const dailyTrend: { [key: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      dailyTrend[dateString] = 0;
    }
    recentLogs.forEach((log) => {
      const dateString = new Date(log.checkIn).toISOString().split("T")[0];
      if (dailyTrend[dateString] !== undefined) {
        dailyTrend[dateString]++;
      }
    });

    // Audit logs for scan success rates (last 30 days)
    const logsAudit = await AttendanceLogs.find({
      timestamp: { $gte: thirtyDaysAgo },
    });
    const successfulScans = logsAudit.filter((l) => l.status === "Success").length;
    const failedScans = logsAudit.filter((l) => l.status !== "Success").length;

    return sendSuccess("Attendance reports aggregated", {
      summary: {
        checksToday: checksTodayCount,
        currentlyInside: currentlyInsideCount,
        totalScans30Days: totalScans,
        qrScans30Days: qrScansCount,
        manualChecks30Days: manualChecksCount,
        successScans30Days: successfulScans,
        failedScans30Days: failedScans,
      },
      peakHours: hourlyDistribution,
      dailyTrend,
    });
  } catch (error) {
    console.error("❌ Failed to compile attendance reports:", error);
    return sendError("Failed to compile attendance reports", error, 500);
  }
}

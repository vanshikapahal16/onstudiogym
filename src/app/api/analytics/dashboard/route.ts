import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import Attendance from "@/models/Attendance";
import Payment from "@/models/Payment";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";
import { subDays, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || !isAdmin(decoded)) {
      return sendUnauthorized();
    }

    await connectToDatabase();

    const today = new Date();
    const startOfToday = startOfDay(today);

    // 1. Members Count
    const totalMembers = await Member.countDocuments({});
    const activeMembers = await Member.countDocuments({ membershipStatus: "Active" });
    const expiringMembers = await Member.countDocuments({ membershipStatus: "Expiring Soon" });
    const expiredMembers = await Member.countDocuments({ membershipStatus: "Expired" });
    const pendingMembers = await Member.countDocuments({ membershipStatus: "Pending" });

    // 2. Real-Time Occupancy & Attendance
    const currentOccupancy = await Attendance.countDocuments({ checkOut: null });
    const todayCheckins = await Attendance.countDocuments({ checkIn: { $gte: startOfToday } });

    // 3. Financial calculations
    let totalRevenue = 0;
    let pendingDues = 0;

    if (global.useMockDatabase) {
      const membersList = await Member.find({}, "totalFee totalPaid remainingAmount");
      membersList.forEach((m) => {
        totalRevenue += m.totalPaid || 0;
        pendingDues += m.remainingAmount || 0;
      });
    } else {
      const financialStats = await Member.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPaid" },
            pendingDues: { $sum: "$remainingAmount" }
          }
        }
      ]);
      if (financialStats.length > 0) {
        totalRevenue = financialStats[0].totalRevenue || 0;
        pendingDues = financialStats[0].pendingDues || 0;
      }
    }

    // 4. Inactive members (no visit in last 15 days)
    const fifteenDaysAgo = subDays(today, 15);
    const inactiveMembersCount = await Member.countDocuments({
      $or: [
        { lastVisit: { $lt: fifteenDaysAgo } },
        { lastVisit: null },
      ],
    });

    // 5. Live Occupancy List (Retrieve details of checked-in members)
    let liveOccupancy = [];
    if (global.useMockDatabase) {
      const activeSessions = await Attendance.find({ checkOut: null });
      const members = await Member.find({});
      liveOccupancy = activeSessions.map((session: any) => {
        const mId = session.memberId ? session.memberId.toString() : "";
        const member = members.find((m: any) => m._id.toString() === mId);
        return {
          memberId: mId,
          fullName: member?.fullName || member?.name || "Unknown Member",
          profileImage: member?.profileImage,
          checkIn: session.checkIn,
        };
      });
    } else {
      const activeSessions = await Attendance.find({ checkOut: null })
        .populate("memberId", "fullName phoneNumber profileImage")
        .select("checkIn");

      liveOccupancy = activeSessions.map((session: any) => ({
        memberId: session.memberId?._id?.toString() || "",
        fullName: session.memberId?.fullName || session.memberId?.name || "Unknown Member",
        profileImage: session.memberId?.profileImage,
        checkIn: session.checkIn,
      }));
    }

    return sendSuccess("Dashboard statistics loaded", {
      statistics: {
        totalMembers,
        activeMembers,
        expiringMembers,
        expiredMembers,
        currentOccupancy,
        todayCheckins,
        totalRevenue,
        pendingDues,
        inactiveMembersCount,
        pendingMembers,
      },
      liveOccupancy,
    });
  } catch (error) {
    return sendError("Failed to fetch dashboard statistics", error, 500);
  }
}

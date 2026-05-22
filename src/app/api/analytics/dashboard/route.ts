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

    // 2. Real-Time Occupancy & Attendance
    const currentOccupancy = await Attendance.countDocuments({ checkOut: null });
    const todayCheckins = await Attendance.countDocuments({ checkIn: { $gte: startOfToday } });

    // 3. Financial calculations
    const membersList = await Member.find({}, "totalFee totalPaid remainingAmount");
    let totalRevenue = 0;
    let pendingDues = 0;

    membersList.forEach((m) => {
      totalRevenue += m.totalPaid || 0;
      pendingDues += m.remainingAmount || 0;
    });

    // 4. Inactive members (no visit in last 15 days)
    const fifteenDaysAgo = subDays(today, 15);
    const inactiveMembersCount = await Member.countDocuments({
      $or: [
        { lastVisit: { $lt: fifteenDaysAgo } },
        { lastVisit: null },
      ],
    });

    // 5. Live Occupancy List (Retrieve details of checked-in members)
    const activeSessions = await Attendance.find({ checkOut: null })
      .populate("memberId", "fullName phoneNumber profileImage")
      .select("checkIn");

    const liveOccupancy = activeSessions.map((session: any) => ({
      memberId: session.memberId?._id,
      fullName: session.memberId?.fullName,
      profileImage: session.memberId?.profileImage,
      checkIn: session.checkIn,
    }));

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
      },
      liveOccupancy,
    });
  } catch (error) {
    return sendError("Failed to fetch dashboard statistics", error, 500);
  }
}

import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Attendance from "@/models/Attendance";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";

export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return sendUnauthorized("You must be logged in.");
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    
    // If not an admin, they can only view their own history.
    const isUserAdmin = isAdmin(decoded);
    const userIdFilter = searchParams.get("userId") || searchParams.get("memberId");
    
    const query: any = {};
    if (!isUserAdmin) {
      query.userId = decoded.id;
    } else if (userIdFilter) {
      query.userId = userIdFilter;
    }

    const search = searchParams.get("search") || "";
    const email = searchParams.get("email") || "";
    const date = searchParams.get("date") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    
    if (isUserAdmin) {
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ];
      }
      if (email) {
        query.email = { $regex: email, $options: "i" };
      }
    }

    if (date) {
      query.date = date;
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const total = await Attendance.countDocuments(query);
    const logs = await Attendance.find(query)
      .sort({ date: -1, time: -1 })
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

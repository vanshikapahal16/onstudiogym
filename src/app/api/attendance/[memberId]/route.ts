import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Attendance from "@/models/Attendance";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";

// GET /api/attendance/:memberId (Get attendance logs for specific member)
export async function GET(req: NextRequest, props: { params: Promise<{ memberId: string }> }) {
  try {
    const params = await props.params;
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return sendUnauthorized();
    }

    // Members can only view their own attendance
    if (decoded.role === "member" && decoded.id !== params.memberId) {
      return sendUnauthorized("You cannot access another member's logs");
    }

    await connectToDatabase();

    const logs = await Attendance.find({ memberId: params.memberId })
      .sort({ checkIn: -1 });

    return sendSuccess("Member attendance loaded", { logs });
  } catch (error) {
    return sendError("Failed to load member attendance logs", error, 500);
  }
}

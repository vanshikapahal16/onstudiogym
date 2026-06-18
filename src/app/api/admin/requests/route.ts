import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import { sendSuccess, sendError } from "@/utils/response";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";

export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return sendError("Unauthorized", null, 401);
    }
    if (!isAdmin(decoded)) {
      return sendError("Forbidden: Admin credentials required", null, 403);
    }

    await connectToDatabase();
    
    // Fetch all members waiting for approval
    const requests = await Member.find({ approved: false }).sort({ createdAt: -1 });

    // Map them to the pending structure expected by the frontend
    const mappedRequests = requests.map(m => ({
      _id: m._id,
      fullName: m.name,
      phoneNumber: m.phone || "Google Sign Up",
      email: m.email,
      status: "Pending",
      createdAt: m.createdAt
    }));

    return sendSuccess("Sign up requests retrieved successfully", {
      requests: mappedRequests,
    });
  } catch (error) {
    console.error("Fetch requests error:", error);
    return sendError("Failed to fetch sign up requests", error, 500);
  }
}

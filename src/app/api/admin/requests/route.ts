import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import PendingMember from "@/models/PendingMember";
import { sendSuccess, sendError } from "@/utils/response";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Admin route, usually needs authentication check.
    // Assuming middleware or the caller handles basic auth checks like other admin routes.

    const requests = await PendingMember.find().sort({ createdAt: -1 });

    return sendSuccess("Sign up requests retrieved successfully", {
      requests,
    });
  } catch (error) {
    console.error("Fetch requests error:", error);
    return sendError("Failed to fetch sign up requests", error, 500);
  }
}

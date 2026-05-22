import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendNotFound, sendError } from "@/utils/response";

export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || decoded.role !== "member") {
      return sendUnauthorized();
    }

    await connectToDatabase();
    const member = await Member.findById(decoded.id).select("-password -hashedPassword");

    if (!member) {
      return sendNotFound("Member not found");
    }

    return sendSuccess("Member profile loaded", { member });
  } catch (error) {
    return sendError("Failed to fetch member profile", error, 500);
  }
}

import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Admin from "@/models/Admin";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendNotFound, sendError } from "@/utils/response";

export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || decoded.role !== "admin") {
      return sendUnauthorized();
    }

    await connectToDatabase();
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return sendNotFound("Admin not found");
    }

    return sendSuccess("Admin profile loaded", { admin });
  } catch (error) {
    return sendError("Failed to fetch admin profile", error, 500);
  }
}

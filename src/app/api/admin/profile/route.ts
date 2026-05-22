import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Admin from "@/models/Admin";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendNotFound, sendError } from "@/utils/response";

export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || !isAdmin(decoded)) {
      return sendUnauthorized();
    }

    await connectToDatabase();
    const admin = await Admin.findById(decoded.id).select("-hashedPassword -password");

    if (!admin) {
      return sendNotFound("Admin not found");
    }

    return sendSuccess("Admin profile loaded", { admin });
  } catch (error) {
    return sendError("Failed to fetch admin profile", error, 500);
  }
}

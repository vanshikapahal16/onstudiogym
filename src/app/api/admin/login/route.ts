import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Admin from "@/models/Admin";
import { setAuthCookie } from "@/middleware/auth";
import { sendSuccess, sendError } from "@/utils/response";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { unique_id, passkey } = await req.json();

    if (!unique_id || !passkey) {
      return sendError("Unique ID and Passkey are required", null, 400);
    }

    // Support logging in via uniqueId, email, or phone
    const admin = await Admin.findOne({
      $or: [
        { uniqueId: unique_id },
        { email: unique_id.toLowerCase() },
        { phone: unique_id }
      ]
    });

    if (!admin) {
      return sendError("Invalid credentials", null, 401);
    }

    const isMatch = await admin.comparePassword(passkey);
    if (!isMatch) {
      return sendError("Invalid credentials", null, 401);
    }

    if (!admin.isActive) {
      return sendError("Administrator account is suspended", null, 403);
    }

    const payload = {
      id: admin._id.toString(),
      role: admin.role,
    };

    const response = sendSuccess("Login successful", {
      admin: {
        id: admin._id,
        name: admin.name,
        uniqueId: admin.uniqueId,
        role: admin.role,
      }
    });

    setAuthCookie(response, payload);
    return response;
  } catch (error) {
    return sendError("Authentication failed", error, 500);
  }
}

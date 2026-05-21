import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Notification from "@/models/Notification";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";

// GET /api/notifications (Fetch all notifications for logged-in user, or all for admin)
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return sendUnauthorized();
    }

    await connectToDatabase();

    const query: any = {};
    if (decoded.role === "member") {
      query.userId = decoded.id; // Only show their personal notifications
    } else {
      // Admin sees general system/onboarding/inquiry alerts, plus their own
      query.$or = [{ userId: null }, { userId: decoded.id }];
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    return sendSuccess("Notifications loaded", { notifications });
  } catch (error) {
    return sendError("Failed to fetch notifications", error, 500);
  }
}

// PUT /api/notifications (Mark all as read)
export async function PUT(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return sendUnauthorized();
    }

    await connectToDatabase();

    const query: any = {};
    if (decoded.role === "member") {
      query.userId = decoded.id;
    } else {
      query.$or = [{ userId: null }, { userId: decoded.id }];
    }

    await Notification.updateMany(query, { unread: false });
    return sendSuccess("All notifications marked as read");
  } catch (error) {
    return sendError("Failed to update notifications", error, 500);
  }
}

import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Inquiry from "@/models/Inquiry";
import Notification from "@/models/Notification";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";

// GET /api/inquiries (Admin views all website inquiries)
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || !isAdmin(decoded)) {
      return sendUnauthorized();
    }

    await connectToDatabase();
    const inquiries = await Inquiry.find({}).sort({ createdAt: -1 });

    return sendSuccess("Inquiries list loaded", { inquiries });
  } catch (error) {
    return sendError("Failed to fetch inquiries", error, 500);
  }
}

// POST /api/inquiries (Public landing page lead submission)
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { name, phoneNumber, fitnessGoal } = await req.json();

    if (!name || !phoneNumber || !fitnessGoal) {
      return sendError("Please fill out all fields on the inquiry form", null, 400);
    }

    const inquiry = await Inquiry.create({
      name,
      phoneNumber,
      fitnessGoal,
    });

    // Create system alert notification for admins
    await Notification.create({
      title: "New Website Lead",
      message: `New inquiry received from ${name} (${phoneNumber}) interested in ${fitnessGoal}.`,
      type: "system",
    });

    return sendSuccess("Inquiry submitted successfully! We will contact you soon.", { inquiry }, 201);
  } catch (error) {
    return sendError("Failed to submit inquiry", error, 500);
  }
}

import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Payment from "@/models/Payment";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";

// GET /api/payments/:memberId (Get payments for a specific member)
export async function GET(req: NextRequest, props: { params: Promise<{ memberId: string }> }) {
  try {
    const params = await props.params;
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return sendUnauthorized();
    }

    // Members can only view their own payment logs
    if (decoded.role === "member" && decoded.id !== params.memberId) {
      return sendUnauthorized("You cannot access another member's invoices");
    }

    await connectToDatabase();

    const payments = await Payment.find({ memberId: params.memberId })
      .sort({ date: -1 });

    return sendSuccess("Member billing history loaded", { payments });
  } catch (error) {
    return sendError("Failed to load member payment logs", error, 500);
  }
}

import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Payment from "@/models/Payment";
import Member from "@/models/Member";
import Notification from "@/models/Notification";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError, sendNotFound } from "@/utils/response";

// GET /api/payments (Admin gets all payments list)
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!isAdmin(decoded)) {
      return sendUnauthorized();
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const total = await Payment.countDocuments({});
    const payments = await Payment.find({})
      .populate("memberId", "fullName phoneNumber profileImage remainingAmount totalFee totalPaid")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess("Payments history loaded", {
      payments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError("Failed to fetch payments logs", error, 500);
  }
}

// POST /api/payments (Admin records a payment)
export async function POST(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!isAdmin(decoded)) {
      return sendUnauthorized();
    }

    await connectToDatabase();
    const { memberId, amount } = await req.json();

    if (!memberId || amount === undefined || amount <= 0) {
      return sendError("Please provide memberId and a positive payment amount", null, 400);
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return sendNotFound("Member not found");
    }

    if (member.remainingAmount <= 0) {
      return sendError("This member has already paid all dues!", null, 400);
    }

    const actualPayAmount = Math.min(amount, member.remainingAmount);
    
    // Update Member totalPaid
    member.totalPaid = (member.totalPaid || 0) + actualPayAmount;
    await member.save(); // pre("save") hook recalculates remainingAmount and status!

    // Determine invoice status
    const paymentStatus = member.remainingAmount === 0 ? "Paid" : "Partially Paid";

    // Record Payment
    const payment = await Payment.create({
      memberId,
      amount: actualPayAmount,
      invoiceId: `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      status: paymentStatus,
      date: new Date(),
    });

    // Create Notification alert
    await Notification.create({
      userId: memberId,
      title: "Payment Received",
      message: `We've successfully processed your payment of $${actualPayAmount}. Remaining dues: $${member.remainingAmount}.`,
      type: "payment",
    });

    return sendSuccess("Payment recorded successfully", {
      payment,
      remainingAmount: member.remainingAmount,
    }, 201);
  } catch (error) {
    return sendError("Failed to record payment", error, 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import Payment from "@/models/Payment";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // 1. Fetch all members currently in the DB
    const members = await Member.find({});
    
    // 2. Try inserting a test member to capture the database/validation error
    let testInsertResult = null;
    try {
      // Clear any previous test member to avoid duplicate key errors on subsequent runs
      await Member.deleteOne({ email: "testnew@gmail.com" });
      await Payment.deleteOne({ invoiceId: { $regex: "^INV-TEST-" } });

      const testMember = await Member.create({
        name: "Test User",
        phone: "9988776655",
        email: "testnew@gmail.com",
        address: "Test Address",
        membershipPlan: "Quarterly",
        membershipDuration: 3,
        totalFee: 500,
        totalPaid: 200,
        approved: true,
        membershipActive: true,
        isActive: true,
        membershipStatus: "Active",
        mustChangePassword: false,
      });

      // Also simulate payment creation
      let paymentResult = null;
      if (testMember.totalPaid && testMember.totalPaid > 0) {
        const paymentStatus = testMember.remainingAmount === 0 ? "Paid" : "Partially Paid";
        const payment = await Payment.create({
          memberId: testMember._id,
          amount: testMember.totalPaid,
          invoiceId: `INV-TEST-${Date.now()}`,
          status: paymentStatus,
          date: new Date(),
        });
        paymentResult = { success: true, id: payment._id };
      }

      testInsertResult = { success: true, memberId: testMember._id, paymentResult };
      
      // Clean up after test
      await Member.deleteOne({ _id: testMember._id });
      if (paymentResult && paymentResult.id) {
        await Payment.deleteOne({ _id: paymentResult.id });
      }
    } catch (err: any) {
      testInsertResult = {
        success: false,
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack,
      };
    }

    return NextResponse.json({
      success: true,
      members: members.map(m => ({
        id: m._id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        approved: m.approved,
      })),
      testInsertResult
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

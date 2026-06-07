import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // 1. Fetch all members currently in the DB
    const members = await Member.find({});
    
    // 2. Try inserting a test member to capture the database/validation error
    let testInsertResult = null;
    try {
      const testMember = await Member.create({
        name: "Akash Test Diagnostics",
        phone: "9467658854",
        email: "akash_test_diag@onfitness.com",
        address: "Khaspur",
        approved: true,
        membershipActive: true,
        isActive: true,
      });
      testInsertResult = { success: true, id: testMember._id };
      // Clean up
      await Member.deleteOne({ _id: testMember._id });
    } catch (err: any) {
      testInsertResult = {
        success: false,
        name: err.name,
        message: err.message,
        code: err.code,
        keyPattern: err.keyPattern,
        keyValue: err.keyValue,
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

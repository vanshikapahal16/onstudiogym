import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import { sendSuccess, sendError } from "@/utils/response";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { fullName, phoneNumber, address, email, totalFee, membershipDuration } = await req.json();

    if (!fullName || !phoneNumber || !address || !totalFee || !membershipDuration) {
      return sendError("Please provide all required fields", null, 400);
    }

    const existingMember = await Member.findOne({ phoneNumber });
    if (existingMember) {
      return sendError("Member with this phone number already exists", null, 400);
    }

    // On registration, automatically generate a temporary password
    const tempPassword = `ON-${phoneNumber.slice(-4)}`;

    const member = await Member.create({
      fullName,
      phoneNumber,
      email: email || `${phoneNumber}@onfitness.com`,
      address,
      password: tempPassword, // Mongoose pre-save hook hashes this!
      totalFee,
      membershipDuration,
      mustChangePassword: true, // Force password reset
    });

    return sendSuccess("Member registered successfully", {
      member: {
        id: member._id,
        fullName: member.fullName,
        phoneNumber: member.phoneNumber,
        tempPassword, // Return so admin/reception can hand it over to member
      },
    }, 210);
  } catch (error) {
    return sendError("Registration failed", error, 500);
  }
}

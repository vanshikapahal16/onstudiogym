import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import { sendSuccess, sendError } from "@/utils/response";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { name, phone, email, address } = await req.json();

    if (!name || !phone || !email || !address) {
      return sendError("Please provide all required fields (Name, Phone, Email, Address)", null, 400);
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate phone or email in Member database
    const existingMember = await Member.findOne({
      $or: [
        { phone: cleanPhone },
        { phoneNumber: cleanPhone },
        { email: cleanEmail }
      ]
    });

    if (existingMember) {
      if (existingMember.email === cleanEmail) {
        return sendError("Email address is already registered", null, 400);
      }
      return sendError("Phone number is already registered", null, 400);
    }

    // Set a random password placeholder for now (will be overridden on approval by admin)
    const randomPlaceholderPassword = Math.random().toString(36).substring(2, 10);

    const newMember = await Member.create({
      name,
      phone: cleanPhone,
      email: cleanEmail,
      address,
      password: randomPlaceholderPassword,
      membershipStatus: "Pending",
      isActive: false,
      totalFee: 0,
      totalPaid: 0,
      membershipPlan: "Monthly",
      membershipDuration: 1,
      mustChangePassword: true,
    });

    return sendSuccess("Signup request submitted successfully", {
      member: {
        id: newMember._id,
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
      }
    }, 201);
  } catch (error) {
    return sendError("Failed to submit signup request", error, 500);
  }
}

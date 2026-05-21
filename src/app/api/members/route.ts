import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import Payment from "@/models/Payment";
import { uploadImage } from "@/lib/cloudinary";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";

// GET /api/members (All members with search, filters, and pagination)
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || decoded.role !== "admin") {
      return sendUnauthorized();
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Fast indexed query
    const query: any = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.membershipStatus = status;
    }

    const total = await Member.countDocuments(query);
    const members = await Member.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-password");

    return sendSuccess("Members list retrieved", {
      members,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError("Failed to fetch members", error, 500);
  }
}

// POST /api/members (Admin adds a member - generates password automatically)
export async function POST(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || decoded.role !== "admin") {
      return sendUnauthorized();
    }

    await connectToDatabase();
    const { fullName, phoneNumber, address, email, totalFee, membershipDuration, totalPaid, profileImage } = await req.json();

    if (!fullName || !phoneNumber || !address || !totalFee || !membershipDuration) {
      return sendError("All fields are required", null, 400);
    }

    const existingMember = await Member.findOne({ phoneNumber });
    if (existingMember) {
      return sendError("Phone number is already registered", null, 400);
    }

    // Auto-generate temp password based on phone number
    const tempPassword = `ON-${phoneNumber.slice(-4)}`;

    // Handle Profile Image Upload (from base64 format)
    let profileImageUrl = "https://ui-avatars.com/api/?name=Gym+Member&background=random";
    if (profileImage && profileImage.startsWith("data:image/")) {
      try {
        const uploadResult = await uploadImage(profileImage);
        profileImageUrl = uploadResult.url;
      } catch (err) {
        console.error("Failed to upload profile image:", err);
      }
    } else if (profileImage) {
      profileImageUrl = profileImage;
    }

    const member = await Member.create({
      fullName,
      phoneNumber,
      email: email || `${phoneNumber}@onfitness.com`,
      address,
      password: tempPassword, // save hook handles hashing
      profileImage: profileImageUrl,
      totalFee,
      membershipDuration,
      totalPaid: totalPaid || 0,
      mustChangePassword: true, // Force onboarding password reset on login
    });

    // Create payment entry if totalPaid is greater than 0
    if (totalPaid && totalPaid > 0) {
      const paymentStatus = member.remainingAmount === 0 ? "Paid" : "Partially Paid";
      await Payment.create({
        memberId: member._id,
        amount: totalPaid,
        invoiceId: `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        status: paymentStatus,
        date: new Date(),
      });
    }

    return sendSuccess("Member created successfully", {
      member: {
        id: member._id,
        fullName: member.fullName,
        phoneNumber: member.phoneNumber,
        tempPassword,
      },
    }, 201);
  } catch (error) {
    return sendError("Failed to create member", error, 500);
  }
}

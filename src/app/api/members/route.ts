import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import Payment from "@/models/Payment";
import { uploadImage } from "@/lib/cloudinary";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";

// GET /api/members (All members with search, filters, and pagination)
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || !isAdmin(decoded)) {
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
        { name: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
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
      .select("-password -hashedPassword");

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

// POST /api/members (Admin adds a member)
export async function POST(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || !isAdmin(decoded)) {
      return sendUnauthorized();
    }

    await connectToDatabase();
    const { 
      fullName, name, 
      phoneNumber, phone, 
      address, email, 
      password, membershipPlan,
      totalFee, membershipDuration, 
      totalPaid, profileImage 
    } = await req.json();

    const mName = name || fullName;
    const mPhone = phone || phoneNumber;

    if (!mName || !mPhone || !address || !totalFee || !email) {
      return sendError("All fields (Name, Phone, Email, Address, Fee) are required", null, 400);
    }

    // Check duplicate phone or email
    const existingMember = await Member.findOne({
      $or: [
        { phone: mPhone },
        { phoneNumber: mPhone },
        { email: email.toLowerCase() }
      ]
    });

    if (existingMember) {
      if (existingMember.email === email.toLowerCase()) {
        return sendError("Email address is already registered", null, 400);
      }
      return sendError("Phone number is already registered", null, 400);
    }

    // Generate password or use custom
    const finalPassword = password || `ON-${mPhone.slice(-4)}`;

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
      name: mName,
      phone: mPhone,
      email: email.toLowerCase(),
      address,
      password: finalPassword, // pre-save hook handles hashing
      profileImage: profileImageUrl,
      membershipPlan: membershipPlan || "Monthly",
      membershipDuration: membershipDuration || 1,
      totalFee,
      totalPaid: totalPaid || 0,
      isActive: true,
      createdByAdmin: decoded.id,
      mustChangePassword: password ? false : true,
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
        email: member.email,
        tempPassword: password ? null : finalPassword,
      },
    }, 201);
  } catch (error) {
    return sendError("Failed to create member", error, 500);
  }
}

import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import Payment from "@/models/Payment";
import { uploadImage } from "@/lib/cloudinary";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";

// GET /api/members (All members with search, filters, and pagination)
export async function GET(req: NextRequest) {
  try {
    // 1. Try custom admin JWT first (used by Admin Portal)
    const decoded = verifyAuthToken(req);
    const isCustomAdmin = isAdmin(decoded);
    
    let isUserAdmin = isCustomAdmin;
    let hasAccess = isCustomAdmin;

    // 2. If not a custom admin, try Clerk auth (used by Member Portal or Clerk admins)
    if (!hasAccess) {
      const { userId } = await auth();
      if (userId) {
        const { sessionClaims } = await auth();
        let emailAddress = (sessionClaims as any)?.email;
        if (!emailAddress) {
          const client = await clerkClient();
          const user = await client.users.getUser(userId);
          emailAddress = user.emailAddresses[0]?.emailAddress;
        }
        const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim());
        isUserAdmin = !!(emailAddress && adminEmails.includes(emailAddress.toLowerCase()));
        hasAccess = isUserAdmin;
      }
    }

    if (!hasAccess) {
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
      if (/^[0-9a-fA-F]{24}$/.test(search)) {
        query.$or.push({ _id: search });
      }
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

// POST /api/members (Admin adds a member manually)
export async function POST(req: NextRequest) {
  try {
    // 1. Try custom admin JWT first (used by Admin Portal)
    const decoded = verifyAuthToken(req);
    const isCustomAdmin = isAdmin(decoded);
    
    let isUserAdmin = isCustomAdmin;
    let hasAccess = isCustomAdmin;

    // 2. If not a custom admin, try Clerk auth (used by Member Portal or Clerk admins)
    if (!hasAccess) {
      const { userId } = await auth();
      if (userId) {
        const { sessionClaims } = await auth();
        let emailAddress = (sessionClaims as any)?.email;
        if (!emailAddress) {
          const client = await clerkClient();
          const user = await client.users.getUser(userId);
          emailAddress = user.emailAddresses[0]?.emailAddress;
        }
        const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim());
        isUserAdmin = !!(emailAddress && adminEmails.includes(emailAddress.toLowerCase()));
        hasAccess = isUserAdmin;
      }
    }

    if (!hasAccess) {
      return sendUnauthorized();
    }

    await connectToDatabase();
    const { 
      fullName, name, 
      phoneNumber, phone, 
      address, email, 
      membershipPlan,
      totalFee, membershipDuration, 
      totalPaid, profileImage 
    } = await req.json();

    const mName = name || fullName;
    const mPhone = phone || phoneNumber;

    if (!mName || !address || !email) {
      return sendError("All fields (Name, Email, Address) are required", null, 400);
    }

    // Check duplicate email
    const existingMember = await Member.findOne({ email: email.toLowerCase() });
    if (existingMember) {
      return sendError("Email address is already registered", null, 400);
    }

    // Handle Profile Image Upload (from base64 format)
    let profileImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(mName)}&background=random`;
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
      phone: mPhone || undefined,
      email: email.toLowerCase(),
      address,
      profileImage: profileImageUrl,
      membershipPlan: membershipPlan || "Monthly",
      membershipDuration: membershipDuration || 1,
      totalFee: totalFee || 0,
      totalPaid: totalPaid || 0,
      approved: true,            // Pre-approved!
      membershipActive: true,    // Pre-activated!
      isActive: true,
      membershipStatus: "Active",
      mustChangePassword: false,
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
        tempPassword: null,
      },
    }, 201);
  } catch (error) {
    console.error("Failed to create member:", error);
    return sendError("Failed to create member", error, 500);
  }
}

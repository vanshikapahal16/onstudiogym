import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendNotFound, sendError } from "@/utils/response";
import { uploadImage } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    console.log("🔍 PROFILE GET - Cookie token:", token);
    const decoded = verifyAuthToken(req);
    console.log("🔍 PROFILE GET - Decoded token:", decoded);
    if (!decoded || decoded.role !== "member") {
      return sendUnauthorized();
    }

    await connectToDatabase();
    const member = await Member.findById(decoded.id).select("-password -hashedPassword");

    if (!member) {
      return sendNotFound("Member not found");
    }

    return sendSuccess("Member profile loaded", { member });
  } catch (error) {
    return sendError("Failed to fetch member profile", error, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || decoded.role !== "member") {
      return sendUnauthorized();
    }

    const { name, email, phone, address, profileImage } = await req.json();

    if (!name) {
      return sendError("Name is required", null, 400);
    }

    await connectToDatabase();
    const member = await Member.findById(decoded.id);

    if (!member) {
      return sendNotFound("Member not found");
    }

    // Check if phone number is already taken by another member
    if (phone && phone !== member.phone) {
      const existingPhone = await Member.findOne({ phone, _id: { $ne: member._id } });
      if (existingPhone) {
        return sendError("Phone number is already in use by another member", null, 400);
      }
    }

    // Check if email is already taken by another member
    if (email && email.toLowerCase() !== member.email.toLowerCase()) {
      const existingEmail = await Member.findOne({ email: email.toLowerCase(), _id: { $ne: member._id } });
      if (existingEmail) {
        return sendError("Email address is already in use by another member", null, 400);
      }
      member.email = email.toLowerCase();
    }

    member.name = name;
    if (phone) member.phone = phone;
    member.address = address || "";

    // Handle base64 image upload to Cloudinary (or mock fallback)
    if (profileImage) {
      if (profileImage.startsWith("data:image/")) {
        const uploadRes = await uploadImage(profileImage);
        member.profileImage = uploadRes.url;
      } else {
        member.profileImage = profileImage;
      }
    }

    await member.save();

    // Remove sensitive data before returning
    const updatedMember = member.toObject();
    delete updatedMember.password;
    delete updatedMember.hashedPassword;

    return sendSuccess("Profile updated successfully", { member: updatedMember });
  } catch (error) {
    return sendError("Failed to update member profile", error, 500);
  }
}

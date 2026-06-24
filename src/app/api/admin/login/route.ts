import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Admin from "@/models/Admin";
import { setAuthCookie } from "@/middleware/auth";
import { sendSuccess, sendError } from "@/utils/response";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    // Auto-seed/ensure Akash credentials exist in MongoDB or mock DB at runtime
    const existingAkash = await Admin.findOne({ uniqueId: "akash1284" });
    if (!existingAkash) {
      console.log("🌱 Auto-seeding Akash superadmin at login runtime...");
      try {
        await Admin.create({
          name: "Akash",
          uniqueId: "akash1284",
          phone: "0000000000", // Seeded with unique phone to prevent index collision
          email: "akash@onfitness.com",
          password: "340515",
          role: "superadmin",
          isActive: true,
        });
      } catch (err: any) {
        console.error("❌ Failed to auto-seed Akash superadmin:", err.message);
      }
    } else {
      // Ensure credentials and status are correct
      let needsUpdate = false;
      if (existingAkash.phone !== "0000000000") {
        existingAkash.phone = "0000000000";
        needsUpdate = true;
      }
      if (existingAkash.role !== "superadmin") {
        existingAkash.role = "superadmin";
        needsUpdate = true;
      }
      if (existingAkash.isActive !== true) {
        existingAkash.isActive = true;
        needsUpdate = true;
      }
      if (needsUpdate) {
        existingAkash.password = "340515"; // reset password too
        await existingAkash.save();
        console.log("🌱 Updated existing Akash superadmin properties for consistency.");
      }
    }

    const { unique_id, passkey } = await req.json();
    console.log(`🔐 Admin login attempt: unique_id="${unique_id}", passkey="${passkey}"`);

    if (!unique_id || !passkey) {
      return sendError("Unique ID and Passkey are required", null, 400);
    }

    // Support logging in via uniqueId, email, or phone
    const admin = await Admin.findOne({
      $or: [
        { uniqueId: unique_id },
        { email: unique_id.toLowerCase() },
        { phone: unique_id }
      ]
    });

    if (!admin) {
      console.log(`❌ Admin with uniqueId/email/phone="${unique_id}" not found in database.`);
      return sendError("Invalid credentials", null, 401);
    }

    const isMatch = await admin.comparePassword(passkey);
    console.log(`🕵️ Password match result for admin "${admin.uniqueId}": ${isMatch}`);
    if (!isMatch) {
      console.log(`❌ Password mismatch for admin="${admin.uniqueId}".`);
      return sendError("Invalid credentials", null, 401);
    }

    if (!admin.isActive) {
      return sendError("Administrator account is suspended", null, 403);
    }

    const payload = {
      id: admin._id.toString(),
      role: admin.role,
    };

    const response = sendSuccess("Login successful", {
      admin: {
        id: admin._id,
        name: admin.name,
        uniqueId: admin.uniqueId,
        role: admin.role,
      }
    });

    setAuthCookie(response, payload);
    return response;
  } catch (error) {
    return sendError("Authentication failed", error, 500);
  }
}

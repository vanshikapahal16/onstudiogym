import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import QRCodeTokens from "@/models/QRCodeTokens";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendNotFound, sendError } from "@/utils/response";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import QRCode from "qrcode";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing.");
}
const JWT_SECRET = process.env.JWT_SECRET;

// GET /api/member/qrcode - Generates signed short-lived JWT dynamic QR codes
export async function GET(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || decoded.role !== "member") {
      return sendUnauthorized("Unauthorized member access");
    }

    await connectToDatabase();
    const member = await Member.findById(decoded.id);

    if (!member) {
      return sendNotFound("Member not found");
    }

    // Ensure member is active
    if (!member.isActive || member.membershipStatus === "Suspended" || member.membershipStatus === "Expired") {
      return sendError(`Account status is not active (Current status: ${member.membershipStatus || "Inactive"})`, null, 403);
    }

    // Ensure qrIdentifier exists (safety fallback)
    if (!member.qrIdentifier) {
      member.qrIdentifier = "qr_" + crypto.randomUUID().replace(/-/g, "");
      member.qrCreatedAt = new Date();
      await member.save();
    }

    // Generate unique session token ID (jti) for replay attack protection
    const jti = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store token in database
    await QRCodeTokens.create({
      memberId: member._id,
      token: jti,
      expiresAt,
      used: false,
    });

    // Sign a short-lived JWT containing memberId, qrIdentifier, and jti
    const signedJwt = jwt.sign(
      {
        memberId: member._id.toString(),
        qrIdentifier: member.qrIdentifier,
        jti,
      },
      JWT_SECRET,
      { expiresIn: "5m" }
    );

    // Generate PNG and SVG representations of the signed JWT
    const qrPngDataUrl = await QRCode.toDataURL(signedJwt, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    const qrSvgString = await QRCode.toString(signedJwt, {
      type: "svg",
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    const qrSvgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(qrSvgString)}`;

    return sendSuccess("QR code generated successfully", {
      qrPng: qrPngDataUrl,
      qrSvg: qrSvgDataUrl,
      qrIdentifier: member.qrIdentifier,
      expiresAt: expiresAt.toISOString(),
      expiresInSeconds: 300,
    });
  } catch (error) {
    console.error("❌ QR Generation failed:", error);
    return sendError("Failed to generate QR code", error, 500);
  }
}

import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import Attendance from "@/models/Attendance";
import QRCodeTokens from "@/models/QRCodeTokens";
import AttendanceLogs from "@/models/AttendanceLogs";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendNotFound, sendError } from "@/utils/response";
import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing.");
}
const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/attendance/scan - Process scanned member QR code
export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "Unknown Browser";

  try {
    // 1. Authenticate the admin/reception scanning device (only admin/reception or scanner kiosk can scan)
    const adminDecoded = verifyAuthToken(req);
    if (!adminDecoded || !isAdmin(adminDecoded)) {
      return sendUnauthorized("Only administrator/scanner kiosks can process check-in scans");
    }

    await connectToDatabase();

    const { qrToken, deviceInfo } = await req.json();

    if (!qrToken) {
      return sendError("QR Token is missing", null, 400);
    }

    // 2. Rate Limiting: Max 15 scans per minute per IP to prevent DOS/brute-force attacks
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentScansCount = await AttendanceLogs.countDocuments({
      ipAddress,
      timestamp: { $gte: oneMinuteAgo },
    });

    if (recentScansCount >= 15) {
      return sendError("Rate limit exceeded. Please wait a moment before scanning again.", null, 429);
    }

    // 3. Verify signed JWT token
    let payload: any;
    try {
      payload = jwt.verify(qrToken, JWT_SECRET);
    } catch (err: any) {
      // Log failed audit log
      await AttendanceLogs.create({
        qrData: qrToken.substring(0, 100), // log truncated token for security
        ipAddress,
        userAgent,
        status: "Failed",
        reason: `JWT verification failed: ${err.message || "Invalid signature"}`,
      });
      return sendError("Invalid, expired, or forged QR Code", null, 400);
    }

    const { memberId, qrIdentifier, jti } = payload;

    if (!memberId || !qrIdentifier || !jti) {
      await AttendanceLogs.create({
        qrData: qrToken.substring(0, 100),
        ipAddress,
        userAgent,
        status: "Failed",
        reason: "Missing token payload claims",
      });
      return sendError("Malformed QR Code token", null, 400);
    }

    // 4. Verify token reuse and expiration from QRCodeTokens DB (Replay Attack Prevention)
    const tokenRecord = await QRCodeTokens.findOne({ token: jti });

    if (!tokenRecord) {
      await AttendanceLogs.create({
        memberId,
        qrData: jti,
        ipAddress,
        userAgent,
        status: "Failed",
        reason: "QR Token session not found in registry",
      });
      return sendError("QR Code session not recognized", null, 400);
    }

    if (tokenRecord.used) {
      await AttendanceLogs.create({
        memberId,
        qrData: jti,
        ipAddress,
        userAgent,
        status: "Failed",
        reason: "Replay attack detected: QR Code already used",
      });
      return sendError("This QR Code has already been scanned", null, 400);
    }

    if (new Date() > new Date(tokenRecord.expiresAt)) {
      await AttendanceLogs.create({
        memberId,
        qrData: jti,
        ipAddress,
        userAgent,
        status: "Failed",
        reason: "QR Code expired",
      });
      return sendError("This QR Code has expired. Please refresh your screen.", null, 400);
    }

    // 5. Fetch member details and validate active status
    const member = await Member.findById(memberId);

    if (!member) {
      await AttendanceLogs.create({
        qrData: jti,
        ipAddress,
        userAgent,
        status: "Failed",
        reason: "Associated member record not found",
      });
      return sendNotFound("Associated member not found");
    }

    // Verify qrIdentifier matches to prevent identity fraud
    if (member.qrIdentifier !== qrIdentifier) {
      await AttendanceLogs.create({
        memberId: member._id,
        qrData: jti,
        ipAddress,
        userAgent,
        status: "Failed",
        reason: "QR identity token mismatch",
      });
      return sendError("QR identity mismatch", null, 400);
    }

    // Verify member active and not suspended/expired
    if (!member.isActive || member.membershipStatus === "Suspended" || member.membershipStatus === "Expired") {
      await AttendanceLogs.create({
        memberId: member._id,
        qrData: jti,
        ipAddress,
        userAgent,
        status: "Failed",
        reason: `Member inactive/expired/suspended (Status: ${member.membershipStatus || "Inactive"})`,
      });
      return sendError(`Member check-in rejected: Status is ${member.membershipStatus || "Inactive"}`, null, 403);
    }

    // 6. Duplicate Scan prevention: Wait 5 minutes between check-ins
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentDuplicate = await Attendance.findOne({
      memberId: member._id,
      checkIn: { $gte: fiveMinutesAgo },
    });

    if (recentDuplicate) {
      await AttendanceLogs.create({
        memberId: member._id,
        qrData: jti,
        ipAddress,
        userAgent,
        status: "Failed",
        reason: "Duplicate check-in scan within 5 minutes limit",
      });
      return sendError("Duplicate check-in detected. Please wait 5 minutes before scanning again.", null, 400);
    }

    // Verify if already checked in today (optional check, but we let multiple per day as long as 5m limit is respected)
    const activeSession = await Attendance.findOne({ memberId: member._id, checkOut: null });
    if (activeSession) {
      await AttendanceLogs.create({
        memberId: member._id,
        qrData: jti,
        ipAddress,
        userAgent,
        status: "Failed",
        reason: "Member is already checked in (active session)",
      });
      return sendError("Member is already checked in", null, 400);
    }

    // 7. Mark token as used
    tokenRecord.used = true;
    await tokenRecord.save();

    // 8. Create Attendance check-in session
    const attendance = await Attendance.create({
      memberId: member._id,
      checkIn: new Date(),
      checkInSource: "QR Scan",
      deviceInfo: deviceInfo || "Unknown Scanner",
    });

    // 9. Update Member stats
    member.lastVisit = new Date();
    member.attendanceCount = (member.attendanceCount || 0) + 1;
    await member.save();

    // 10. Audit Log success
    await AttendanceLogs.create({
      memberId: member._id,
      qrData: jti,
      ipAddress,
      userAgent,
      status: "Success",
      reason: "Successfully checked in using QR Scan",
    });

    return sendSuccess(`Attendance marked successfully for ${member.name}!`, {
      attendance,
      memberName: member.name,
      membershipStatus: member.membershipStatus,
    });
  } catch (error) {
    console.error("❌ Attendance QR scan failed:", error);
    return sendError("Failed to process check-in scan", error, 500);
  }
}

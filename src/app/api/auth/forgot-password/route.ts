import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Admin from "@/models/Admin";
import Member from "@/models/Member";
import { sendEmail } from "@/services/email";
import { sendSuccess, sendError } from "@/utils/response";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const { email, role } = await req.json();

    if (!email) {
      return sendError("Please provide an email address", null, 400);
    }

    let user: any = null;
    let userRole: "admin" | "member" = "member";

    // If role is explicitly provided, check that collection first
    if (role === "admin") {
      user = await Admin.findOne({ email: email.toLowerCase().trim() });
      userRole = "admin";
    } else if (role === "member") {
      user = await Member.findOne({ email: email.toLowerCase().trim() });
      userRole = "member";
    } else {
      // Auto-detect: check admin first, then member
      user = await Admin.findOne({ email: email.toLowerCase().trim() });
      if (user) {
        userRole = "admin";
      } else {
        user = await Member.findOne({ email: email.toLowerCase().trim() });
        if (user) {
          userRole = "member";
        }
      }
    }

    if (!user) {
      // For security, we can return success but mention email sent if exists, or return not found.
      // In a gym admin portal context, returning a clear error is much better for user experience.
      return sendError("No account found with this email address", null, 404);
    }

    // Generate random token and expiry (1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    const origin = req.nextUrl.origin;
    const resetUrl = `${origin}/reset-password?token=${token}&role=${userRole}`;

    const mailOptions = {
      to: user.email,
      subject: "Password Reset Request - ON FITNESS STUDIO",
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n` +
            `Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n` +
            `${resetUrl}\n\n` +
            `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #1a202c; border-radius: 8px; background-color: #0b0f19; color: #ffffff;">
          <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">Password Reset Request</h2>
          <p style="font-size: 16px; line-height: 1.5;">You are receiving this because you (or someone else) requested a password reset for your account on <strong>ON FITNESS STUDIO</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #9ca3af;">Or copy and paste this URL into your browser:</p>
          <p style="font-size: 14px; word-break: break-all; color: #ef4444;">${resetUrl}</p>
          <p style="font-size: 14px; line-height: 1.5; color: #9ca3af; margin-top: 30px; border-top: 1px solid #1f2937; padding-top: 15px;">
            Note: This link will expire in 1 hour. If you did not request this, please ignore this email.
          </p>
        </div>
      `,
    };

    await sendEmail(mailOptions);

    return sendSuccess("Password reset link has been generated and sent to your email.");
  } catch (error) {
    return sendError("Failed to initiate password reset", error, 500);
  }
}

import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import { setAuthCookie } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return sendUnauthorized("No active Clerk session found");
    }

    await connectToDatabase();
    let member = await Member.findOne({ clerkId: userId });

    if (!member) {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return sendError("Failed to retrieve Clerk user details", null, 400);
      }

      const email = clerkUser.emailAddresses[0]?.emailAddress || "";
      const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Gym Member";
      const profileImage = clerkUser.imageUrl || "";

      // 1. Try finding existing member by email to link (for manual admin onboarding)
      member = await Member.findOne({ email: email.toLowerCase() });

      if (member) {
        // Link the account! Since admin manually added them, they are pre-approved
        member.clerkId = userId;
        member.profileImage = profileImage || member.profileImage;
        member.approved = true;
        member.membershipActive = true;
        member.isActive = true;
        member.membershipStatus = "Active";
        await member.save();
      } else {
        // 2. Register new member (waiting for approval)
        member = await Member.create({
          clerkId: userId,
          email: email.toLowerCase(),
          name,
          profileImage,
          role: "member",
          approved: false,
          membershipActive: false,
          isActive: false,
          membershipStatus: "Pending",
          phone: `google_${userId}`, // placeholder phone
          address: "Google OAuth Sign Up",
          membershipPlan: "Monthly",
          membershipDuration: 1,
          totalFee: 0,
          totalPaid: 0,
        });
      }
    }

    const payload = {
      id: member._id.toString(),
      role: "member" as const,
    };

    const response = sendSuccess("Session synced successfully", {
      member: {
        id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        approved: member.approved,
        isActive: member.isActive,
      }
    });

    setAuthCookie(response, payload);
    return response;
  } catch (error) {
    return sendError("Failed to sync member session", error, 500);
  }
}

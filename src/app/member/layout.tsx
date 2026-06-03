import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";
import MemberClientLayout from "./MemberClientLayout";
import { cookies } from "next/headers";
import MemberSessionSyncer from "@/components/member/MemberSessionSyncer";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (userId) {
    // Automatic registration and linking flow
    await connectToDatabase();
    let member = await Member.findOne({ clerkId: userId });

    if (!member) {
      const clerkUser = await currentUser();
      if (clerkUser) {
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
    }

    // Enforce Status Guards (only if member record was found/created)
    if (member) {
      if (member.approved === false) {
        redirect("/waiting-approval");
      }

      if (member.membershipActive === false || member.isActive === false) {
        redirect("/inactive");
      }
    }
  }
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  return (
    <>
      {!token && userId && <MemberSessionSyncer />}
      <MemberClientLayout>{children}</MemberClientLayout>
    </>
  );
}

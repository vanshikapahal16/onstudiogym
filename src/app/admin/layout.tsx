import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminClientLayout from "./AdminClientLayout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (userId) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim());

    if (!email || !adminEmails.includes(email.toLowerCase())) {
      // Authenticated but not an admin! Force redirect to login with error
      redirect("/admin/login?error=unauthorized");
    }
  }

  return <AdminClientLayout>{children}</AdminClientLayout>;
}

import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Member from "@/models/Member";

const isMemberPageRoute = createRouteMatcher(["/member(.*)"]);
const isMemberApiRoute = createRouteMatcher(["/api/member(.*)", "/api/attendance(.*)"]);

export const proxy = clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // 1. Exclude public and auth assets
  if (
    pathname === "/member/login" ||
    pathname === "/admin/login" ||
    pathname === "/waiting-approval" ||
    pathname === "/inactive" ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // 2. Member Route Protection (Page & API)
  if (isMemberPageRoute(req) || isMemberApiRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      if (isMemberApiRoute(req)) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
      }
      return NextResponse.redirect(new URL("/member/login", req.url));
    }

    // Connect to database to validate status
    await connectToDatabase();
    const member = await Member.findOne({ clerkId: userId });

    // Note: If no member record exists yet, we let page routes proceed to `/member` 
    // where our Layout Server Component will automatically register them.
    // However, if a record DOES exist, we enforce status checks.
    if (member) {
      if (!member.approved) {
        if (isMemberApiRoute(req)) {
          return new Response(JSON.stringify({ success: false, error: "Waiting for admin approval" }), { status: 403 });
        }
        return NextResponse.redirect(new URL("/waiting-approval", req.url));
      }
      if (!member.membershipActive) {
        if (isMemberApiRoute(req)) {
          return new Response(JSON.stringify({ success: false, error: "Membership suspended" }), { status: 403 });
        }
        return NextResponse.redirect(new URL("/inactive", req.url));
      }
    } else {
      // If no member record exists and they call a member API, reject it
      if (isMemberApiRoute(req)) {
        return new Response(JSON.stringify({ success: false, error: "Account not registered" }), { status: 403 });
      }
    }
  }

  // 3. Admin Route Protection
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin") || pathname.startsWith("/api/analytics")) {
    const { userId } = await auth();
    if (!userId) {
      if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/analytics")) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // Enforce email check using Clerk
    const { sessionClaims } = await auth();
    let email = (sessionClaims as any)?.email;

    if (!email) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        email = user.emailAddresses[0]?.emailAddress;
      } catch (err) {
        console.error("Failed to fetch Clerk user details in proxy:", err);
      }
    }

    const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map(e => e.trim());

    if (!email || !adminEmails.includes(email.toLowerCase())) {
      if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/analytics")) {
        return new Response(JSON.stringify({ success: false, error: "Forbidden: Admins only" }), { status: 403 });
      }
      return NextResponse.redirect(new URL("/admin/login?error=unauthorized", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip static files, images, etc.
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};

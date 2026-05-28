import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isMemberPageRoute = createRouteMatcher(["/member(.*)"]);
const isMemberApiRoute = createRouteMatcher(["/api/member(.*)", "/api/attendance(.*)"]);

export default clerkMiddleware(async (auth, req) => {
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

    // Note: To avoid importing Node.js-only modules (like mongoose or fs)
    // inside the Edge-runtime proxy, we delegate the member database status checks
    // (approved/active) to the Page Layout Server Component (src/app/member/layout.tsx)
    // and the respective serverless API routes.
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

import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { verifyAuthTokenEdge, isAdmin } from "@/middleware/auth-edge";

const isMemberPageRoute = createRouteMatcher(["/member(.*)"]);
const isMemberApiRoute = createRouteMatcher(["/api/member(.*)", "/api/attendance(.*)"]);

const hasValidClerk = 
  process.env.CLERK_SECRET_KEY && 
  !process.env.CLERK_SECRET_KEY.startsWith("sk_test_placeholder");

// Custom fallback middleware when Clerk keys are missing or placeholders
const fallbackMiddleware = async (req: any) => {
  const { pathname } = req.nextUrl;

  // 1. Exclude public and auth assets
  if (
    pathname === "/member/login" ||
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/waiting-approval" ||
    pathname === "/inactive" ||
    pathname === "/" ||
    pathname === "/checkin" ||
    pathname.startsWith("/api/attendance/checkin-by-email") ||
    pathname.startsWith("/sso-callback") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // 2. Member Route Protection (Page & API)
  if (isMemberPageRoute(req) || isMemberApiRoute(req)) {
    const decoded = await verifyAuthTokenEdge(req);
    if (!decoded) {
      if (isMemberApiRoute(req)) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
      }
      return NextResponse.redirect(new URL("/member/login", req.url));
    }
  }

  // 3. Admin Route Protection
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin") || pathname.startsWith("/api/analytics")) {
    const decoded = await verifyAuthTokenEdge(req);
    if (!decoded || !isAdmin(decoded)) {
      if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/analytics")) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
};

export default hasValidClerk
  ? clerkMiddleware(async (auth, req) => {
      const { pathname } = req.nextUrl;

      // 1. Exclude public and auth assets
      if (
        pathname === "/member/login" ||
        pathname === "/admin/login" ||
        pathname === "/api/admin/login" ||
        pathname === "/waiting-approval" ||
        pathname === "/inactive" ||
        pathname === "/" ||
        pathname === "/checkin" ||
        pathname.startsWith("/api/attendance/checkin-by-email") ||
        pathname.startsWith("/sso-callback") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/health") ||
        pathname.startsWith("/images")
      ) {
        return NextResponse.next();
      }

      // 2. Member Route Protection (Page & API)
      if (isMemberPageRoute(req) || isMemberApiRoute(req)) {
        const decoded = await verifyAuthTokenEdge(req);
        if (!decoded) {
          const { userId } = await auth();
          if (!userId) {
            if (isMemberApiRoute(req)) {
              return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
            }
            return NextResponse.redirect(new URL("/member/login", req.url));
          }
        }
      }

      // 3. Admin Route Protection
      if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin") || pathname.startsWith("/api/analytics")) {
        const decoded = await verifyAuthTokenEdge(req);
        if (!decoded || !isAdmin(decoded)) {
          if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/analytics")) {
            return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
          }
          return NextResponse.redirect(new URL("/admin/login", req.url));
        }
      }

      return NextResponse.next();
    })
  : fallbackMiddleware;

export const config = {
  runtime: "nodejs",
  matcher: [
    // Skip static files, images, etc.
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};


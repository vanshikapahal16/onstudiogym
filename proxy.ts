import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Decodes a JWT token safely in Next.js Edge/Proxy runtime without external dependencies.
 * Extracts and parses the JSON payload part of the token.
 * 
 * @param token - The raw JWT string (e.g. from cookies)
 * @returns The decoded payload object, or null if decoding fails
 */
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // The second part of a JWT is the Base64Url-encoded JSON payload
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    
    // Decode Base64 to Unicode string
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    // Return null if token is malformed or invalid
    return null;
  }
}

/**
 * Next.js 16 Proxy Convention
 * Acts as the centralized routing controller to protect admin and member dashboards.
 */
export function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    
    // 1. Fetch and decode authentication cookie
    const token = request.cookies.get("token")?.value;
    const payload = token ? decodeJwtPayload(token) : null;

    // ==========================================
    // ADMIN PORTAL ROUTE PROTECTION
    // ==========================================
    if (pathname.startsWith("/admin")) {
      const isAdminUser = payload && (payload.role === "admin" || payload.role === "superadmin");

      // Case A: User goes to /admin/login
      if (pathname === "/admin/login") {
        if (isAdminUser) {
          // If already logged in as admin, redirect to main admin dashboard
          return NextResponse.redirect(new URL("/admin", request.url));
        }
        // Allow unauthenticated user to visit the login page
        return NextResponse.next();
      }

      // Case B: User tries to access any other /admin/* dashboard page
      if (!isAdminUser) {
        // Redirect unauthorized users to login page
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }

    // ==========================================
    // MEMBER PORTAL ROUTE PROTECTION
    // ==========================================
    if (pathname.startsWith("/member")) {
      const isMemberUser = payload && payload.role === "member";

      // Case A: User goes to /member/login
      if (pathname === "/member/login") {
        if (isMemberUser) {
          // If already logged in as member, redirect to main member dashboard
          return NextResponse.redirect(new URL("/member", request.url));
        }
        // Allow unauthenticated user to visit the login page
        return NextResponse.next();
      }

      // Case B: User tries to access any other /member/* dashboard page
      if (!isMemberUser) {
        // Redirect unauthorized users to login page
        return NextResponse.redirect(new URL("/member/login", request.url));
      }
    }

    // Allow all other public pages (e.g. landing page, assets, public routes)
    return NextResponse.next();
  } catch (error) {
    // Robust stable fallback to prevent site crashes even if parsing/redirecting fails
    console.error("Proxy runtime critical fallback error:", error);
    return NextResponse.next();
  }
}

// Specify which pathnames this proxy will run on
export const config = {
  matcher: ["/admin/:path*", "/member/:path*"],
};

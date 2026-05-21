import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    const { pathname } = request.nextUrl;

    let payload: any = null;
    if (token) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          payload = JSON.parse(jsonPayload);
        }
      } catch (e) {
        // Invalid token payload, ignore and keep null
      }
    }

    // Protect Admin Routes
    if (pathname.startsWith("/admin")) {
      if (pathname === "/admin/login") {
        if (payload && payload.role === "admin") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
        return NextResponse.next();
      }

      if (!payload || payload.role !== "admin") {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }

    // Protect Member Routes
    if (pathname.startsWith("/member")) {
      if (pathname === "/member/login") {
        if (payload && payload.role === "member") {
          return NextResponse.redirect(new URL("/member", request.url));
        }
        return NextResponse.next();
      }

      if (!payload || payload.role !== "member") {
        return NextResponse.redirect(new URL("/member/login", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Robust stable fallback to prevent proxy crashes even if parsing/redirecting fails
    console.error("Proxy runtime fallback error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/admin/:path*", "/member/:path*"],
};

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing.");
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface DecodedToken {
  id: string;
  role: "superadmin" | "admin" | "member";
}

// Helper to check if a decoded token is an administrator role
export function isAdmin(decoded: DecodedToken | null): boolean {
  return !!decoded && (decoded.role === "admin" || decoded.role === "superadmin");
}

// Generate JWT token and set in cookie
export function setAuthCookie<T = any>(res: NextResponse<T>, payload: DecodedToken): NextResponse<T> {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  
  res.cookies.set({
    name: "token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return res;
}

// Clear JWT auth cookie
export function clearAuthCookie<T = any>(res: NextResponse<T>): NextResponse<T> {
  res.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return res;
}

// Verify auth token from request
export function verifyAuthToken(req: NextRequest): DecodedToken | null {
  const token = req.cookies.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    console.error("🔍 JWT Verification failed:", error);
    return null;
  }
}

// Edge-compatible verification of auth token from request using Web Crypto API
export async function verifyAuthTokenEdge(req: NextRequest): Promise<DecodedToken | null> {
  const token = req.cookies.get("token")?.value;

  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerPart, payloadPart, signaturePart] = parts;
    const dataToVerify = `${headerPart}.${payloadPart}`;

    // Base64url decode signature
    let base64 = signaturePart.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const signatureBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      signatureBytes[i] = binary.charCodeAt(i);
    }

    // Import key using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(JWT_SECRET);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Verify signature
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(dataToVerify)
    );

    if (!isValid) return null;

    // Decode and parse payload
    let payloadBase64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    while (payloadBase64.length % 4) {
      payloadBase64 += "=";
    }
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    return payload as DecodedToken;
  } catch (error) {
    return null;
  }
}

// Helper to verify administrator authentication in Next.js Server Actions
export async function verifyAdminServerAction(): Promise<boolean> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return false;
    
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return isAdmin(decoded);
  } catch {
    return false;
  }
}


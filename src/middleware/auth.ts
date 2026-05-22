import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "on_fitness_secret_key";

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
    return null;
  }
}

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { parse, serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "on_fitness_secret_key";

export interface DecodedToken {
  id: string;
  role: "admin" | "member";
}

// Generate JWT token and set in cookie
export function setAuthCookie<T = any>(res: NextResponse<T>, payload: DecodedToken): NextResponse<T> {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  
  const serialized = serialize("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  res.headers.append("Set-Cookie", serialized);
  return res;
}

// Clear JWT auth cookie
export function clearAuthCookie<T = any>(res: NextResponse<T>): NextResponse<T> {
  const serialized = serialize("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  res.headers.append("Set-Cookie", serialized);
  return res;
}

// Verify auth token from request
export function verifyAuthToken(req: NextRequest): DecodedToken | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  const token = cookies.token;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    return null;
  }
}

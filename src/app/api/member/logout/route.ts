import { NextRequest } from "next/server";
import { clearAuthCookie } from "@/middleware/auth";
import { sendSuccess } from "@/utils/response";

export async function POST(req: NextRequest) {
  const response = sendSuccess("Logged out successfully");
  clearAuthCookie(response);
  return response;
}

import { NextRequest } from "next/server";
import { clearAuthCookie } from "@/middleware/auth";
import { sendSuccess } from "@/utils/response";

export async function POST(req: NextRequest) {
  let response = sendSuccess("Logged out successfully");
  response = clearAuthCookie(response);
  return response;
}

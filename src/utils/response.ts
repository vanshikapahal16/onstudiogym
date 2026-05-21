import { NextResponse } from "next/server";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export function sendSuccess<T = any>(message: string, data?: T, status = 200) {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return NextResponse.json(response, { status });
}

export function sendError(message: string, error?: any, status = 400) {
  const response: ApiResponse = {
    success: false,
    message,
    error: error instanceof Error ? error.message : error,
  };
  return NextResponse.json(response, { status });
}

export function sendUnauthorized(message = "Unauthorized access") {
  return sendError(message, null, 401);
}

export function sendForbidden(message = "Access forbidden") {
  return sendError(message, null, 403);
}

export function sendNotFound(message = "Resource not found") {
  return sendError(message, null, 404);
}

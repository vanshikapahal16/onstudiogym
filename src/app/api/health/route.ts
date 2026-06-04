import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { sendSuccess, sendError } from "@/utils/response";

// GET /api/health - Diagnostic route to verify database connection and variables in Vercel
export async function GET(req: NextRequest) {
  const rawUri = process.env.MONGODB_URI || "";
  let maskedUri = "not defined";
  if (rawUri) {
    maskedUri = rawUri.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, (match, user, pass) => {
      const maskedUser = user.length > 6 ? user.slice(0, 3) + "***" + user.slice(-3) : "***";
      const maskedPass = pass.length > 4 ? pass.slice(0, 2) + "***" + pass.slice(-2) : "***";
      return `mongodb+srv://${maskedUser}:${maskedPass}@`;
    });
  }

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: {
      MONGODB_URI_DEFINED: !!process.env.MONGODB_URI,
      MONGODB_URI_MASKED: maskedUri,
      JWT_SECRET_DEFINED: !!process.env.JWT_SECRET,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEFINED: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !!process.env.CLERK_PUBLISHABLE_KEY,
      CLERK_SECRET_KEY_DEFINED: !!process.env.CLERK_SECRET_KEY,
      NODE_ENV: process.env.NODE_ENV,
    },
    database: {
      connected: false,
      readyState: mongoose.connection.readyState,
      connectionName: mongoose.connection.name,
      usingMock: !!global.useMockDatabase,
      error: null,
    }
  };

  try {
    const conn = await connectToDatabase();
    diagnostics.database.readyState = mongoose.connection.readyState;
    diagnostics.database.connected = mongoose.connection.readyState === 1;
    diagnostics.database.usingMock = !!global.useMockDatabase;
    diagnostics.database.connectionName = mongoose.connection.name;
    diagnostics.database.error = global.databaseConnectionError || null;
    
    if (diagnostics.database.connected && !global.useMockDatabase && mongoose.connection.db) {
      // Try a simple database operation
      await mongoose.connection.db.admin().ping();
      diagnostics.database.ping = "pong";
    }
    
    return NextResponse.json({ success: true, diagnostics });
  } catch (err: any) {
    diagnostics.database.error = err.message || err;
    return NextResponse.json({ success: false, diagnostics, error: err.message }, { status: 500 });
  }
}

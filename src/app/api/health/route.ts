import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { sendSuccess, sendError } from "@/utils/response";

export async function GET(req: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: {
      MONGODB_URI_DEFINED: !!process.env.MONGODB_URI,
      JWT_SECRET_DEFINED: !!process.env.JWT_SECRET,
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

import { connectToDatabase } from "../lib/db";
import Member from "../models/Member";
import Attendance from "../models/Attendance";
import QRCodeTokens from "../models/QRCodeTokens";
import AttendanceLogs from "../models/AttendanceLogs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "test";

async function runTests() {
  console.log("🚀 STARTING QR ATTENDANCE SYSTEM INTEGRATION TESTS...");

  // 1. Connect to database
  await connectToDatabase();
  console.log("🔌 Connected to database wrapper.");

  // Clean up existing test members
  await Member.deleteMany({ email: { $in: ["qr_test_active@onfitness.com", "qr_test_suspended@onfitness.com", "qr_test_migrate@onfitness.com"] } });
  await Attendance.deleteMany({});
  await QRCodeTokens.deleteMany({});
  await AttendanceLogs.deleteMany({});

  console.log("🧹 Test database tables cleaned.");

  // Test 1: Automatic QR Creation on Member.create
  console.log("\n🧪 TEST 1: Automatic QR Creation on Creation...");
  const activeMember = await Member.create({
    name: "Active QR Tester",
    email: "qr_test_active@onfitness.com",
    phone: "9900112233",
    address: "Active St",
    membershipPlan: "Monthly",
    membershipDuration: 1,
    totalFee: 1000,
    totalPaid: 1000,
    approved: true,
    membershipActive: true,
    isActive: true,
    membershipStatus: "Active",
  });

  if (!activeMember.qrIdentifier || !activeMember.qrCreatedAt) {
    throw new Error("❌ FAIL: Member created without qrIdentifier or qrCreatedAt!");
  }
  console.log(`✅ PASS: Auto-generated qrIdentifier: ${activeMember.qrIdentifier}`);
  console.log(`         Auto-generated qrCreatedAt: ${activeMember.qrCreatedAt}`);

  // Test 2: Migration logic for existing members without QR identifier
  console.log("\n🧪 TEST 2: Existing Member Migration...");
  // Create a member bypassing validation/pre-hooks if possible, or edit database directly
  const migrateMember = await Member.create({
    name: "Migrate Tester",
    email: "qr_test_migrate@onfitness.com",
    phone: "9900112244",
    address: "Migrate St",
    approved: true,
    membershipActive: true,
    isActive: true,
  });

  // Manually remove their qrIdentifier to simulate pre-existing member
  // (In mock DB we do update directly, in Mongoose we do updateOne on collection)
  if ((global as any).useMockDatabase) {
    const fs = await import("fs");
    const path = await import("path");
    const dbPath = path.join(process.cwd(), "src", "data", "db.json");
    const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    const memberIdx = data.members.findIndex((m: any) => m._id === migrateMember._id.toString());
    if (memberIdx >= 0) {
      delete data.members[memberIdx].qrIdentifier;
      delete data.members[memberIdx].qrCreatedAt;
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
    }
  } else {
    // Bypass mongoose middleware to unset fields in MongoDB
    await Member.collection.updateOne(
      { _id: migrateMember._id },
      { $unset: { qrIdentifier: "", qrCreatedAt: "" } }
    );
  }
  
  // Re-verify that raw DB has no QR identifier (avoiding auto-generator)
  let hasQrInRawDb = false;
  if ((global as any).useMockDatabase) {
    const fs = await import("fs");
    const path = await import("path");
    const dbPath = path.join(process.cwd(), "src", "data", "db.json");
    const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    const rawM = data.members.find((m: any) => m._id === migrateMember._id.toString());
    hasQrInRawDb = !!rawM?.qrIdentifier;
  } else {
    const rawM = await Member.collection.findOne({ _id: migrateMember._id });
    hasQrInRawDb = !!rawM?.qrIdentifier;
  }

  if (hasQrInRawDb) {
    throw new Error("❌ FAIL: Could not unset qrIdentifier in raw database for migration test!");
  }
  console.log("✅ Successfully unset QR fields in raw database to simulate pre-migration state.");

  // Now trigger the migration manually (similar to startup connect/seed logic)
  if ((global as any).useMockDatabase) {
    const fs = await import("fs");
    const path = await import("path");
    const dbPath = path.join(process.cwd(), "src", "data", "db.json");
    const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    let migratedCount = 0;
    for (const m of data.members) {
      if (!m.qrIdentifier) {
        m.qrIdentifier = "qr_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        m.qrCreatedAt = new Date().toISOString();
        migratedCount++;
      }
    }
    if (migratedCount > 0) {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
    }
  } else {
    const membersWithoutQr = await Member.find({
      $or: [{ qrIdentifier: { $exists: false } }, { qrIdentifier: null }]
    });
    for (const m of membersWithoutQr) {
      m.qrIdentifier = "qr_" + crypto.randomUUID().replace(/-/g, "");
      m.qrCreatedAt = new Date();
      await m.save();
    }
  }

  // Check if raw DB record has been updated with qrIdentifier
  let isMigratedInRawDb = false;
  let migratedQrIdentifier = "";
  if ((global as any).useMockDatabase) {
    const fs = await import("fs");
    const path = await import("path");
    const dbPath = path.join(process.cwd(), "src", "data", "db.json");
    const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    const rawM = data.members.find((m: any) => m._id === migrateMember._id.toString());
    isMigratedInRawDb = !!rawM?.qrIdentifier;
    migratedQrIdentifier = rawM?.qrIdentifier || "";
  } else {
    const rawM = await Member.collection.findOne({ _id: migrateMember._id });
    isMigratedInRawDb = !!rawM?.qrIdentifier;
    migratedQrIdentifier = rawM?.qrIdentifier || "";
  }

  if (!isMigratedInRawDb) {
    throw new Error("❌ FAIL: Member was not migrated in the raw database!");
  }
  console.log(`✅ PASS: Existing member migrated successfully with QR: ${migratedQrIdentifier}`);

  // Test 3: Generate secure dynamic temporary token (GET /api/member/qrcode logic)
  console.log("\n🧪 TEST 3: Dynamic Temporary Token Generation...");
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  await QRCodeTokens.create({
    memberId: activeMember._id,
    token: jti,
    expiresAt,
    used: false,
  });

  const signedToken = jwt.sign(
    {
      memberId: activeMember._id.toString(),
      qrIdentifier: activeMember.qrIdentifier,
      jti,
    },
    JWT_SECRET,
    { expiresIn: "5m" }
  );

  console.log("✅ PASS: Temporary JWT token signed successfully.");

  // Setup client request parameters (Simulating scanner calling POST /api/attendance/scan)
  const PORT = 3000;
  const BASE_URL = `http://localhost:${PORT}`;
  
  // Authenticate request as Admin (Akash superadmin cookie)
  const adminToken = jwt.sign({ id: "admin_test", role: "superadmin" }, JWT_SECRET);
  const scanHeaders = {
    "Content-Type": "application/json",
    "Cookie": `token=${adminToken}`,
  };

  // Test 4: Verify check-in scan
  console.log("\n🧪 TEST 4: Verification of Scan Check-In...");
  const scanRes = await fetch(`${BASE_URL}/api/attendance/scan`, {
    method: "POST",
    headers: scanHeaders,
    body: JSON.stringify({
      qrToken: signedToken,
      deviceInfo: "Scanner Test Rig",
    }),
  });

  const scanJson = await scanRes.json();
  if (!scanRes.ok || !scanJson.success) {
    throw new Error(`❌ FAIL: Check-in scan rejected: ${JSON.stringify(scanJson)}`);
  }
  console.log(`✅ PASS: Scan accepted! Check-in message: "${scanJson.message}"`);

  // Verify DB updates
  const checkedInAttendance = await Attendance.findOne({ memberId: activeMember._id });
  if (!checkedInAttendance || checkedInAttendance.checkInSource !== "QR Scan") {
    throw new Error("❌ FAIL: Attendance record not saved or source is not 'QR Scan'!");
  }
  console.log(`✅ PASS: Attendance saved in DB with source: "${checkedInAttendance.checkInSource}"`);

  const auditLog = await AttendanceLogs.findOne({ memberId: activeMember._id, status: "Success" });
  if (!auditLog) {
    throw new Error("❌ FAIL: Success audit log not written to AttendanceLogs!");
  }
  console.log(`✅ PASS: Audit log created in DB: "${auditLog.reason}"`);

  // Test 5: Replay attack prevention (using the same token twice)
  console.log("\n🧪 TEST 5: Replay Attack Prevention...");
  const replayRes = await fetch(`${BASE_URL}/api/attendance/scan`, {
    method: "POST",
    headers: scanHeaders,
    body: JSON.stringify({
      qrToken: signedToken,
      deviceInfo: "Scanner Test Rig",
    }),
  });

  const replayJson = await replayRes.json();
  if (replayRes.ok || replayJson.success) {
    throw new Error("❌ FAIL: Replay attack check-in was accepted!");
  }
  console.log(`✅ PASS: Replay scan blocked. Message: "${replayJson.message}"`);

  // Test 6: Duplicate scan within 5 minutes (using a NEW token for the same checked-in member)
  console.log("\n🧪 TEST 6: Duplicate Scan Prevention (5-minute limits)...");
  const jti2 = crypto.randomUUID();
  await QRCodeTokens.create({
    memberId: activeMember._id,
    token: jti2,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    used: false,
  });

  const signedToken2 = jwt.sign(
    {
      memberId: activeMember._id.toString(),
      qrIdentifier: activeMember.qrIdentifier,
      jti: jti2,
    },
    JWT_SECRET,
    { expiresIn: "5m" }
  );

  const duplicateRes = await fetch(`${BASE_URL}/api/attendance/scan`, {
    method: "POST",
    headers: scanHeaders,
    body: JSON.stringify({
      qrToken: signedToken2,
      deviceInfo: "Scanner Test Rig",
    }),
  });

  const duplicateJson = await duplicateRes.json();
  if (duplicateRes.ok || duplicateJson.success) {
    throw new Error("❌ FAIL: Duplicate scan within 5 minutes was accepted!");
  }
  console.log(`✅ PASS: Duplicate scan within 5 minutes blocked. Message: "${duplicateJson.message}"`);

  // Test 7: Suspended/Expired member scan rejection
  console.log("\n🧪 TEST 7: Suspended/Expired Member Rejection...");
  const suspendedMember = await Member.create({
    name: "Suspended QR Tester",
    email: "qr_test_suspended@onfitness.com",
    phone: "9900112255",
    approved: true,
    membershipActive: false, // suspended
    isActive: false,
    membershipStatus: "Suspended",
  });

  const jti3 = crypto.randomUUID();
  await QRCodeTokens.create({
    memberId: suspendedMember._id,
    token: jti3,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    used: false,
  });

  const signedToken3 = jwt.sign(
    {
      memberId: suspendedMember._id.toString(),
      qrIdentifier: suspendedMember.qrIdentifier,
      jti: jti3,
    },
    JWT_SECRET,
    { expiresIn: "5m" }
  );

  const suspendedRes = await fetch(`${BASE_URL}/api/attendance/scan`, {
    method: "POST",
    headers: scanHeaders,
    body: JSON.stringify({
      qrToken: signedToken3,
      deviceInfo: "Scanner Test Rig",
    }),
  });

  const suspendedJson = await suspendedRes.json();
  if (suspendedRes.ok || suspendedJson.success) {
    throw new Error("❌ FAIL: Suspended member was checked in!");
  }
  console.log(`✅ PASS: Suspended member blocked. Message: "${suspendedJson.message}"`);

  console.log("\n🎉 ALL QR ATTENDANCE SYSTEM INTEGRATION TESTS PASSED!");
}

runTests().catch((err) => {
  console.error("\n❌ TEST SUITE RUN ENCOUNTERED FAILURE:");
  console.error(err.message || err);
  process.exit(1);
});

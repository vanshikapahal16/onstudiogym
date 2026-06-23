import { connectToDatabase } from "../lib/db";
import Member from "../models/Member";
import Attendance from "../models/Attendance";
import Notification from "../models/Notification";
import jwt from "jsonwebtoken";

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || "test";

async function runE2E() {
  console.log("🚀 STARTING MEMBER PORTAL E2E INTEGRATION TESTING...");

  // 1. Database Connection
  await connectToDatabase();
  console.log("🔌 Connected to database.");

  // 2. Setup clean test member
  await Member.deleteMany({ email: "e2etest@onfitness.com" });
  
  console.log("👤 Creating test member...");
  const member = await Member.create({
    name: "E2E Test Member",
    email: "e2etest@onfitness.com",
    phone: "9988776655",
    address: "E2E Test Lane",
    membershipPlan: "Monthly",
    membershipDuration: 1,
    totalFee: 1200,
    totalPaid: 0,
    remainingAmount: 1200,
    approved: true,
    membershipActive: true,
    isActive: true,
    membershipStatus: "Active",
    paymentStatus: "Unpaid",
  });
  const memberId = member._id.toString();
  console.log(`✅ Test member created with ID: ${memberId}`);

  // 3. Generate auth cookie token
  const token = jwt.sign({ id: memberId, role: "member" }, JWT_SECRET, { expiresIn: "1h" });
  const headers = {
    "Content-Type": "application/json",
    "Cookie": `token=${token}`,
  };

  try {
    // 4. Test View Profile API
    console.log("➡️ Testing GET /api/member/profile...");
    const profileRes = await fetch(`${BASE_URL}/api/member/profile`, { headers });
    const profileJson = await profileRes.json() as any;
    
    if (!profileRes.ok || !profileJson.success) {
      throw new Error(`Profile load failed: ${JSON.stringify(profileJson)}`);
    }
    console.log("✅ Profile loaded successfully.");
    const fetchedMember = profileJson.data.member;
    if (fetchedMember.name !== "E2E Test Member" || fetchedMember.email !== "e2etest@onfitness.com") {
      throw new Error("Profile fields mismatch.");
    }

    // 5. Test Edit Profile & Image Upload (base64)
    console.log("➡️ Testing PUT /api/member/profile (base64 image upload)...");
    const editRes = await fetch(`${BASE_URL}/api/member/profile`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        name: "E2E Updated Name",
        email: "e2etest_updated@onfitness.com", // update email
        phone: "9988776644", // update phone
        address: "E2E New Address",
        profileImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", // 1x1 mock PNG
      }),
    });
    const editJson = await editRes.json() as any;
    if (!editRes.ok || !editJson.success) {
      throw new Error(`Profile edit failed: ${JSON.stringify(editJson)}`);
    }
    console.log("✅ Profile details and image updated successfully.");
    const updatedMember = editJson.data.member;
    if (updatedMember.name !== "E2E Updated Name" || updatedMember.email !== "e2etest_updated@onfitness.com" || !updatedMember.profileImage) {
      throw new Error("Updated profile verification failed.");
    }
    console.log(`🖼️ Profile image URL: ${updatedMember.profileImage}`);

    // Update email in state for cleanup
    const finalEmail = "e2etest_updated@onfitness.com";

    // 6. Test Member Gym Check-In
    console.log("➡️ Testing POST /api/attendance/mark...");
    const checkinRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: "POST",
      headers,
    });
    const checkinJson = await checkinRes.json() as any;
    if (!checkinRes.ok || !checkinJson.success) {
      throw new Error(`Check-in failed: ${JSON.stringify(checkinJson)}`);
    }
    console.log("✅ Check-in successful.");
    
    // Verify attendanceCount in member profile
    const profileVerifyRes = await fetch(`${BASE_URL}/api/member/profile`, { headers });
    const profileVerifyJson = await profileVerifyRes.json() as any;
    if (profileVerifyJson.data.member.attendanceCount !== 1) {
      throw new Error("Attendance count should be 1.");
    }

    // 7. Test Duplicate Check-in Prevention
    console.log("➡️ Testing duplicate check-in protection...");
    const dupCheckinRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: "POST",
      headers,
    });
    const dupCheckinJson = await dupCheckinRes.json() as any;
    if (dupCheckinRes.ok || dupCheckinJson.success) {
      throw new Error("Duplicate check-in should have failed!");
    }
    console.log("✅ Duplicate check-in blocked correctly.");
    console.log(`   Response Message: "${dupCheckinJson.message}"`);

    // 8. Test Notifications System
    console.log("➡️ Testing Notifications system...");
    // Pre-create some test notifications
    const n1 = await Notification.create({
      userId: memberId,
      title: "Streak Achieved!",
      message: "You logged 1 visit today. Keep it up!",
      type: "milestone",
      unread: true,
    });
    const n2 = await Notification.create({
      userId: memberId,
      title: "Invoice Generated",
      message: "An invoice of ₹1,200 has been created.",
      type: "payment",
      unread: true,
    });

    // Fetch notifications
    const getNotifRes = await fetch(`${BASE_URL}/api/notifications`, { headers });
    const getNotifJson = await getNotifRes.json() as any;
    if (!getNotifRes.ok || !getNotifJson.success) {
      throw new Error(`Fetch notifications failed: ${JSON.stringify(getNotifJson)}`);
    }
    console.log("✅ Notifications fetched successfully.");
    const notifs = getNotifJson.data.notifications;
    if (notifs.length < 2) {
      throw new Error("Notifications count mismatch.");
    }

    // Mark all as read
    console.log("➡️ Testing PUT /api/notifications (mark all as read)...");
    const readNotifRes = await fetch(`${BASE_URL}/api/notifications`, {
      method: "PUT",
      headers,
    });
    const readNotifJson = await readNotifRes.json() as any;
    if (!readNotifRes.ok || !readNotifJson.success) {
      throw new Error(`Mark all read failed: ${JSON.stringify(readNotifJson)}`);
    }
    console.log("✅ All notifications marked as read.");

    // Delete single notification
    console.log(`➡️ Testing DELETE /api/notifications?id=${n1._id} (delete single)...`);
    const delSingleRes = await fetch(`${BASE_URL}/api/notifications?id=${n1._id}`, {
      method: "DELETE",
      headers,
    });
    const delSingleJson = await delSingleRes.json() as any;
    if (!delSingleRes.ok || !delSingleJson.success) {
      throw new Error(`Delete single failed: ${JSON.stringify(delSingleJson)}`);
    }
    console.log("✅ Single notification deleted successfully.");

    // Clear all notifications
    console.log("➡️ Testing DELETE /api/notifications (clear all)...");
    const clearAllRes = await fetch(`${BASE_URL}/api/notifications`, {
      method: "DELETE",
      headers,
    });
    const clearAllJson = await clearAllRes.json() as any;
    if (!clearAllRes.ok || !clearAllJson.success) {
      throw new Error(`Clear all failed: ${JSON.stringify(clearAllJson)}`);
    }
    console.log("✅ All notifications cleared successfully.");

    // Verify notifications are empty now
    const verifyNotifRes = await fetch(`${BASE_URL}/api/notifications`, { headers });
    const verifyNotifJson = await verifyNotifRes.json() as any;
    if (verifyNotifJson.data.notifications.length !== 0) {
      throw new Error("Notifications were not cleared.");
    }
    console.log("✅ Notifications database verification passed.");

    // 9. Test Exercise Library API
    console.log("➡️ Testing GET /api/exercises...");
    const execRes = await fetch(`${BASE_URL}/api/exercises`);
    const execJson = await execRes.json() as any;
    if (!execRes.ok || !execJson.success) {
      throw new Error(`Fetch exercises failed: ${JSON.stringify(execJson)}`);
    }
    console.log("✅ Exercises loaded successfully.");
    const seededExercises = execJson.data.exercises;
    console.log(`   Found ${seededExercises.length} seeded exercises in database.`);
    if (seededExercises.length === 0) {
      throw new Error("Exercise seeder failed to seed database.");
    }

    // 10. Test Payments API
    console.log(`➡️ Testing GET /api/payments/${memberId}...`);
    const payRes = await fetch(`${BASE_URL}/api/payments/${memberId}`, { headers });
    const payJson = await payRes.json() as any;
    if (!payRes.ok || !payJson.success) {
      throw new Error(`Fetch payments failed: ${JSON.stringify(payJson)}`);
    }
    console.log("✅ Payments fetched successfully.");

    // Clean up database records
    console.log("🧹 Cleaning up database test records... (E2E Test Member)");
    await Attendance.deleteMany({ userId: memberId });
    await Notification.deleteMany({ userId: memberId });
    await Member.deleteMany({ _id: memberId });
    await Member.deleteMany({ email: finalEmail });
    console.log("✅ Database test records cleaned up.");

    console.log("🎉 SUCCESS! MEMBER PORTAL E2E INTEGRATION TESTING PASSED SUCCESSFULLY!");
    process.exit(0);

  } catch (error) {
    console.error("❌ E2E integration test failed with error:", error);
    
    // Cleanup on error
    try {
      await Attendance.deleteMany({ userId: memberId });
      await Notification.deleteMany({ userId: memberId });
      await Member.deleteMany({ _id: memberId });
      await Member.deleteMany({ email: "e2etest@onfitness.com" });
      await Member.deleteMany({ email: "e2etest_updated@onfitness.com" });
    } catch (cleanupErr) {
      console.error("Cleanup failed:", cleanupErr);
    }
    
    process.exit(1);
  }
}

runE2E();

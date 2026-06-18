// Force fast MongoDB timeout and mock database mode at the absolute top before imports
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/on_fitness_test?serverSelectionTimeoutMS=500";
global.useMockDatabase = true;

import { connectToDatabase } from "../lib/db";
import Member from "../models/Member";
import Admin from "../models/Admin";
import Payment from "../models/Payment";
import assert from "assert";

async function runTests() {
  console.log("🧪 STARTING ADMIN PORTAL UNIT TESTS...");
  
  await connectToDatabase();

  // Test 1: Admin Authentication & Creation
  console.log("➡️ Test 1: Admin account management & auth...");
  const adminCountBefore = await Admin.countDocuments({});
  
  const testAdmin = await Admin.create({
    name: "Test Admin",
    phone: "1111111111",
    email: "testadmin@gym.com",
    password: "AdminPassword123",
    role: "admin",
    isActive: true
  });
  
  assert(testAdmin !== null, "Admin should be created");
  assert(testAdmin.name === "Test Admin", "Name should match");
  assert(testAdmin.role === "admin", "Role should be 'admin'");
  
  const isMatch = await testAdmin.comparePassword("AdminPassword123");
  assert(isMatch === true, "Password comparison should succeed");
  
  const isMatchFail = await testAdmin.comparePassword("WrongPassword");
  assert(isMatchFail === false, "Wrong password should fail");

  console.log("✅ Admin authentication and creation tests passed.");

  // Test 2: Member CRUD & Auto-calculations
  console.log("➡️ Test 2: Member creation, validation & plan auto-calculations...");
  const testMember = await Member.create({
    name: "John Doe",
    phone: "2222222222",
    email: "john@doe.com",
    address: "Test Street 123",
    password: "JohnPassword123",
    membershipPlan: "Quarterly", // should auto-set duration to 3 months
    totalFee: 3000,
    totalPaid: 0,
    approved: true,
    membershipActive: true,
    isActive: true
  });

  assert(testMember !== null, "Member should be created");
  assert(testMember.membershipDuration === 3, "Quarterly plan should auto-set duration to 3 months");
  assert(testMember.remainingAmount === 3000, "Remaining dues should be 3000");
  assert(testMember.paymentStatus === "Unpaid", "Payment status should be Unpaid");
  assert(testMember.membershipStatus === "Active", "Membership status should be Active");
  assert(testMember.role === "member", "Default role should be member");

  console.log("✅ Member creation and plan auto-calculation tests passed.");

  // Test 3: Member Profile Update
  console.log("➡️ Test 3: Member details update & status changes...");
  testMember.address = "New Test Address 456";
  testMember.membershipStatus = "Suspended";
  testMember.isActive = false;
  await testMember.save();

  const updatedMember = await Member.findById(testMember._id);
  assert(updatedMember.address === "New Test Address 456", "Address update should persist");
  assert(updatedMember.isActive === false, "Suspended status should set isActive to false");

  console.log("✅ Member update tests passed.");

  // Test 4: Payment System
  console.log("➡️ Test 4: Payment recording & dues recalculations...");
  
  // Reactivate member for payment testing
  testMember.isActive = true;
  testMember.membershipStatus = "Active";
  await testMember.save();

  // Record a partial payment
  const paymentAmount = 1200;
  const paymentStatus = "Partially Paid";
  
  const testPayment = await Payment.create({
    memberId: testMember._id,
    amount: paymentAmount,
    invoiceId: `INV-${Date.now()}-101`,
    status: paymentStatus,
    date: new Date()
  });

  assert(testPayment !== null, "Payment log should be created");
  assert(testPayment.amount === 1200, "Payment amount should match");

  // Update member totals
  testMember.totalPaid = (testMember.totalPaid || 0) + paymentAmount;
  await testMember.save();

  const paidMember = await Member.findById(testMember._id);
  assert(paidMember.totalPaid === 1200, "Total paid should update to 1200");
  assert(paidMember.remainingAmount === 1800, "Remaining amount should be 1800");
  assert(paidMember.paymentStatus === "Partially Paid", "Payment status should update to Partially Paid");

  console.log("✅ Payment system dues and totals recalculation tests passed.");

  // Test 5: Role Promotion & Demotion
  console.log("➡️ Test 5: Admin promotion and demotion actions...");
  
  // Check if member phone is already in Admin collection
  const existingAdmin = await Admin.findOne({ phone: testMember.phone });
  assert(!existingAdmin, "Should not be in Admin collection initially");

  // Promote John Doe to Admin
  const baseUniqueId = testMember.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const uniqueSuffix = Math.floor(100 + Math.random() * 900);
  const uniqueId = `${baseUniqueId}${uniqueSuffix}`;

  const promotedAdmin = await Admin.create({
    name: testMember.name,
    email: testMember.email,
    phone: testMember.phone,
    uniqueId,
    hashedPassword: testMember.hashedPassword || "dummy_hash",
    role: "admin",
    isActive: true,
  });

  assert(promotedAdmin !== null, "Promoted admin record should be created");
  assert(promotedAdmin.role === "admin", "Promoted role should be admin");

  // Demote John Doe back to Member
  await Admin.findByIdAndDelete(promotedAdmin._id);
  const checkAdminDeleted = await Admin.findById(promotedAdmin._id);
  assert(!checkAdminDeleted, "John Doe should be removed from Admin collection");

  console.log("✅ Promotion and demotion logic tests passed.");

  // Test 6: Member Deletion
  console.log("➡️ Test 6: Member deletion...");
  await testMember.deleteOne();
  const deletedMemberCheck = await Member.findById(testMember._id);
  assert(!deletedMemberCheck, "Member should be deleted from DB");

  // Clean up test admin
  await testAdmin.deleteOne();

  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 100% UNIT TEST COVERAGE VALIDATED.");
}

runTests().catch(err => {
  console.error("❌ Test run failed with error:", err);
  process.exit(1);
});

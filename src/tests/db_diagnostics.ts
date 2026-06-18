import { connectToDatabase } from "../lib/db";
import mongoose from "mongoose";
import Member from "../models/Member";
import Payment from "../models/Payment";
import Attendance from "../models/Attendance";
import Gallery from "../models/Gallery";
import Admin from "../models/Admin";
import fs from "fs";
import path from "path";

async function runDiagnostics() {
  console.log("Database Diagnostics Script");
  console.log("---------------------------");

  try {
    // Force connect
    const conn = await connectToDatabase();
    
    let dbName = "Unknown";
    let collectionNames: string[] = [];
    
    if (global.useMockDatabase) {
      console.log("Database Mode: LOCAL JSON MOCK DATABASE (FALLBACK)");
      console.log(`Reason for fallback: ${global.databaseConnectionError}`);
      dbName = "db.json (Local Mock)";
      collectionNames = ["admins", "members", "payments", "notifications", "inquiries", "exercises", "gallery", "attendance"];
    } else {
      console.log("Database Mode: MONGODB ATLAS");
      dbName = mongoose.connection.name || "Unknown";
      const collections = mongoose.connection.db ? await mongoose.connection.db.listCollections().toArray() : [];
      collectionNames = collections.map(c => c.name);
    }

    console.log(`Database Name: ${dbName}`);
    console.log("Collection Names in Database:", collectionNames);

    // Document Counts
    console.log("\nDocument Counts:");
    const memberCount = await Member.countDocuments({});
    console.log(`- Members: ${memberCount}`);

    const paymentCount = await Payment.countDocuments({});
    console.log(`- Payments: ${paymentCount}`);

    const adminCount = await Admin.countDocuments({});
    console.log(`- Users (Admins): ${adminCount}`);

    const attendanceCount = await Attendance.countDocuments({});
    console.log(`- Attendance: ${attendanceCount}`);

    let galleryCount = 0;
    try {
      galleryCount = await Gallery.countDocuments({});
    } catch (e) {
      console.log("- Gallery: Table/Model not fully ready or empty");
    }
    console.log(`- Gallery: ${galleryCount}`);

    // CRUD Verification on Member
    console.log("\n--- CRUD Verification (Members Collection) ---");
    // 1. Write (Create)
    const testMember = await Member.create({
      name: "CRUD Test Member",
      email: "crud_test@onfitness.com",
      phone: "1234567890",
      address: "123 Test Street",
      membershipPlan: "Monthly",
      membershipDuration: 1,
      totalFee: 1000,
      totalPaid: 0,
      remainingAmount: 1000,
      approved: true,
      membershipActive: true,
      isActive: true,
      membershipStatus: "Active",
      paymentStatus: "Unpaid"
    });
    console.log(`CREATE: Success (Created ID: ${testMember._id})`);

    // 2. Read
    const readMember = await Member.findOne({ email: "crud_test@onfitness.com" });
    if (readMember) {
      console.log(`READ: Success (Found member with email: ${readMember.email})`);
    } else {
      throw new Error("READ failed: Member not found after creation");
    }

    // 3. Update
    // In mock database, we update fields on the retrieved document
    if (global.useMockDatabase) {
      readMember.phone = "0987654321";
      await readMember.save();
    } else {
      await Member.updateOne({ _id: readMember._id }, { $set: { phone: "0987654321" } });
    }
    
    const updatedMember = await Member.findOne({ email: "crud_test@onfitness.com" });
    if (updatedMember && updatedMember.phone === "0987654321") {
      console.log("UPDATE: Success (Phone updated successfully)");
    } else {
      throw new Error(`UPDATE failed: Phone field is ${updatedMember?.phone}`);
    }

    // 4. Delete
    await Member.deleteOne({ _id: readMember._id });
    const deletedMember = await Member.findOne({ email: "crud_test@onfitness.com" });
    if (!deletedMember) {
      console.log("DELETE: Success (Member removed successfully)");
    } else {
      throw new Error("DELETE failed: Member still exists in database");
    }

    console.log("\nDatabase Verification: PASS");
    process.exit(0);
  } catch (error) {
    console.error("\nDatabase Verification: FAIL");
    console.error("Error details:", error);
    process.exit(1);
  }
}

runDiagnostics();

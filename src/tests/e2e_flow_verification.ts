import { connectToDatabase } from "../lib/db";
import Member from "../models/Member";
import Payment from "../models/Payment";
import Notification from "../models/Notification";
import jwt from "jsonwebtoken";

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || "test";

async function runE2EFlow() {
  console.log("E2E FLOW VERIFICATION TESTING");
  console.log("----------------------------");

  // 1. Connect to Database directly to check records
  await connectToDatabase();
  console.log("Database Connected.");

  // Generate Admin custom token to bypass Clerk protection
  const adminToken = jwt.sign({ id: "admin_test", role: "superadmin" }, JWT_SECRET, { expiresIn: "1h" });
  const headers = {
    "Content-Type": "application/json",
    "Cookie": `token=${adminToken}`
  };

  // Clean up any existing records from previous runs
  await Member.deleteMany({ email: "flowtest@onfitness.com" });

  let createdMemberId = "";

  try {
    // ==========================================
    // STEP 5: CREATE MEMBER FLOW
    // ==========================================
    console.log("\n[STEP 5] Testing Create Member...");
    const createPayload = {
      name: "Flow Test Member",
      email: "flowtest@onfitness.com",
      phone: "9876500000",
      address: "Flow Lane",
      membershipPlan: "Monthly",
      totalFee: 1500,
      membershipDuration: 1,
      totalPaid: 500, // Part payment
      profileImage: "https://ui-avatars.com/api/?name=Flow+Test+Member"
    };

    const createRes = await fetch(`${BASE_URL}/api/members`, {
      method: "POST",
      headers,
      body: JSON.stringify(createPayload)
    });
    const createJson = await createRes.json();

    if (createRes.status !== 201 || !createJson.success) {
      throw new Error(`Create Member API failed with status ${createRes.status}: ${JSON.stringify(createJson)}`);
    }

    createdMemberId = createJson.data.member.id;
    console.log(`- API called successfully. Status Code: ${createRes.status}`);
    console.log(`- Member ID created: ${createdMemberId}`);

    // Verify MongoDB document was created
    const dbMember = await Member.findById(createdMemberId);
    if (!dbMember) {
      throw new Error("MongoDB document was NOT created for the member!");
    }
    console.log("- MongoDB document verified successfully in database.");
    console.log(`  Name: ${dbMember.name}, Email: ${dbMember.email}, Total Fee: ${dbMember.totalFee}, Remaining: ${dbMember.remainingAmount}`);

    // Verify initial partial payment record exists in database
    const dbPayment = await Payment.findOne({ memberId: createdMemberId });
    if (!dbPayment) {
      throw new Error("Initial Payment record was NOT created in database!");
    }
    console.log(`- Initial payment invoice verified in database: ${dbPayment.invoiceId} (Amount: ${dbPayment.amount}, Status: ${dbPayment.status})`);

    // ==========================================
    // STEP 6: SEARCH TESTING
    // ==========================================
    console.log("\n[STEP 6] Testing Search...");

    const searchCriteria = [
      { type: "Name", query: "Flow Test" },
      { type: "Phone", query: "9876500" },
      { type: "Email", query: "flowtest@" },
      { type: "Member ID", query: createdMemberId }
    ];

    for (const criteria of searchCriteria) {
      const searchRes = await fetch(`${BASE_URL}/api/members?search=${encodeURIComponent(criteria.query)}`, { headers });
      const searchJson = await searchRes.json();
      
      if (searchRes.status !== 200 || !searchJson.success) {
        throw new Error(`Search by ${criteria.type} failed: ${JSON.stringify(searchJson)}`);
      }
      
      const found = searchJson.data.members.some((m: any) => m._id === createdMemberId);
      if (!found) {
        throw new Error(`Member not found when searching by ${criteria.type} with query: "${criteria.query}"`);
      }
      console.log(`- Search by ${criteria.type}: SUCCESS. Query: "${criteria.query}" returned matches containing the member.`);
    }

    // ==========================================
    // STEP 7: PAYMENT TESTING
    // ==========================================
    console.log("\n[STEP 7] Testing Record Payment...");
    const payPayload = {
      memberId: createdMemberId,
      amount: 1000 // Paying the rest of the 1000 dues
    };

    const payRes = await fetch(`${BASE_URL}/api/payments`, {
      method: "POST",
      headers,
      body: JSON.stringify(payPayload)
    });
    const payJson = await payRes.json();

    if (payRes.status !== 201 || !payJson.success) {
      throw new Error(`Record Payment API failed with status ${payRes.status}: ${JSON.stringify(payJson)}`);
    }

    console.log(`- API called successfully. Status Code: ${payRes.status}`);
    console.log(`- Payment Recorded. Remaining Amount reported: ${payJson.data.remainingAmount}`);

    // Verify Payment record was created
    const recordedPayments = await Payment.find({ memberId: createdMemberId });
    console.log(`- Total payment records in database for this member: ${recordedPayments.length}`);
    if (recordedPayments.length !== 2) {
      throw new Error("Payment record or transaction record missing in database!");
    }
    
    // Check if member balance and paymentStatus are updated in database
    const updatedMember = await Member.findById(createdMemberId);
    if (!updatedMember) {
      throw new Error("Member not found during update validation");
    }
    console.log(`- Member remaining dues in MongoDB: ${updatedMember.remainingAmount}`);
    console.log(`- Member payment status in MongoDB: ${updatedMember.paymentStatus}`);

    if (updatedMember.remainingAmount !== 0 || updatedMember.paymentStatus !== "Paid") {
      throw new Error("Member dues or payment status did not update correctly in database!");
    }
    console.log("- Member balance updated successfully to 0 and status updated to Paid.");

    // ==========================================
    // STEP 8: TRANSACTION TESTING
    // ==========================================
    console.log("\n[STEP 8] Testing Transaction Logging...");
    
    // Fetch transaction list from API
    const transRes = await fetch(`${BASE_URL}/api/payments`, { headers });
    const transJson = await transRes.json();

    if (transRes.status !== 200 || !transJson.success) {
      throw new Error(`Fetch payments logs failed: ${JSON.stringify(transJson)}`);
    }

    // Find our transaction in the list
    const transactions = transJson.data.payments;
    const ourTransactions = transactions.filter((t: any) => t.memberId?._id === createdMemberId || t.memberId === createdMemberId);
    console.log(`- Total transactions fetched for member: ${ourTransactions.length}`);
    if (ourTransactions.length === 0) {
      throw new Error("Recorded transaction was not found in returned payments log list!");
    }

    console.log("- Transactions saved and retrieved from DB list successfully:");
    for (const tx of ourTransactions) {
      console.log(`  Invoice: ${tx.invoiceId}, Amount: ${tx.amount}, Status: ${tx.status}, Date: ${tx.date}`);
    }

    console.log("\nE2E FLOW TESTS: PASS");

    // Clean up
    console.log("\n🧹 Cleaning up test records...");
    await Payment.deleteMany({ memberId: createdMemberId });
    await Notification.deleteMany({ userId: createdMemberId });
    await Member.deleteOne({ _id: createdMemberId });
    console.log("Cleanup done.");
    process.exit(0);

  } catch (error) {
    console.error("\nE2E FLOW TESTS: FAIL");
    console.error("Error details:", error);
    if (createdMemberId) {
      await Payment.deleteMany({ memberId: createdMemberId });
      await Notification.deleteMany({ userId: createdMemberId });
      await Member.deleteOne({ _id: createdMemberId });
    }
    process.exit(1);
  }
}

runE2EFlow();

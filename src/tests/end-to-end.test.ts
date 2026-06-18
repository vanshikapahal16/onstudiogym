import assert from "assert";

const BASE_URL = "http://localhost:3000";

async function runEndToEndVerification() {
  console.log("🚀 STARTING END-TO-END VERIFICATION FLOW...");

  // 1. Authenticate Admin
  console.log("\n🔑 1. Authenticating Admin...");
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ unique_id: "vanshika16", passkey: "Vanshika@123" })
  });

  const loginData: any = await loginRes.json();
  assert(loginRes.status === 200, `Login failed: ${loginData.message}`);
  console.log("✅ Admin logged in successfully:", loginData.data.admin.name);

  // Extract auth cookie
  const setCookie = loginRes.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("No authentication cookie returned from login endpoint!");
  }
  const authHeaders = {
    "Content-Type": "application/json",
    "Cookie": setCookie.split(";")[0]
  };

  // 2. Add Member
  console.log("\n👤 2. Creating a new test member...");
  const addRes = await fetch(`${BASE_URL}/api/members`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      fullName: "EndToEnd TestMember",
      phoneNumber: "9876543222",
      email: "endtoend@test.com",
      address: "123 Test Plaza",
      membershipPlan: "Monthly",
      membershipDuration: 1,
      totalFee: 1500,
      totalPaid: 500
    })
  });

  const addData: any = await addRes.json();
  if (addRes.status !== 201) {
    console.error("DEBUG: addRes status is:", addRes.status);
    console.error("DEBUG: addRes body is:", JSON.stringify(addData, null, 2));
  }
  assert(addRes.status === 201 && addData.success, `Add member failed: ${addData.message}`);
  const createdMember = addData.data.member;
  console.log("✅ Test member created successfully!");
  console.log(`   ID: ${createdMember.id}`);
  console.log(`   Name: ${createdMember.fullName}`);
  console.log(`   Email: ${createdMember.email}`);

  // 3. Search Member
  console.log("\n🔍 3. Searching for the created member...");
  const searchRes = await fetch(`${BASE_URL}/api/members?search=EndToEnd`, {
    method: "GET",
    headers: authHeaders
  });

  const searchData: any = await searchRes.json();
  assert(searchRes.status === 200 && searchData.success, `Search failed: ${searchData.message}`);
  const foundMembers = searchData.data.members;
  const match = foundMembers.find((m: any) => m.email === "endtoend@test.com");
  assert(match, "Created member could not be found via search!");
  console.log("✅ Search found the member successfully!");
  console.log(`   Found Name: ${match.name}`);
  console.log(`   Dues: ₹${match.remainingAmount}`);

  // 4. Record Payment
  console.log("\n💳 4. Recording payment of remaining dues...");
  const payRes = await fetch(`${BASE_URL}/api/payments`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      memberId: createdMember.id,
      amount: 1000
    })
  });

  const payData: any = await payRes.json();
  assert(payRes.status === 201 && payData.success, `Payment failed: ${payData.message}`);
  console.log("✅ Payment recorded successfully!");
  console.log(`   Transaction ID: ${payData.data.payment._id}`);
  console.log(`   Invoice: ${payData.data.payment.invoiceId}`);
  console.log(`   Amount: ₹${payData.data.payment.amount}`);
  console.log(`   New Remaining Dues: ₹${payData.data.remainingAmount}`);

  // 5. Verify Transaction appears in history
  console.log("\n📋 5. Verifying payment transaction appears in payments log...");
  const historyRes = await fetch(`${BASE_URL}/api/payments?limit=10`, {
    method: "GET",
    headers: authHeaders
  });

  const historyData: any = await historyRes.json();
  assert(historyRes.status === 200 && historyData.success, `History fetch failed: ${historyData.message}`);
  const paymentsList = historyData.data.payments;
  const loggedPayment = paymentsList.find((p: any) => p.invoiceId === payData.data.payment.invoiceId);
  assert(loggedPayment, "Recorded payment could not be found in transaction log!");
  console.log("✅ Transaction verified in payments log:");
  console.log(`   Member: ${loggedPayment.memberId?.fullName || "Unknown"}`);
  console.log(`   Phone: ${loggedPayment.memberId?.phoneNumber || "Unknown"}`);
  console.log(`   Amount: ₹${loggedPayment.amount}`);

  // 6. Verify Dashboard updates
  console.log("\n📊 6. Querying revenue dashboard for updated statistics...");
  const dashRes = await fetch(`${BASE_URL}/api/analytics/dashboard`, {
    method: "GET",
    headers: authHeaders
  });

  const dashData: any = await dashRes.json();
  assert(dashRes.status === 200 && dashData.success, `Dashboard query failed: ${dashData.message}`);
  const stats = dashData.data.statistics;
  console.log("✅ Dashboard statistics fetched successfully:");
  console.log(`   Total Members: ${stats.totalMembers}`);
  console.log(`   Active Members: ${stats.activeMembers}`);
  console.log(`   Total Revenue: ₹${stats.totalRevenue}`);
  console.log(`   Pending Dues: ₹${stats.pendingDues}`);

  // 7. Cleanup created test member so we leave clean database
  console.log("\n🗑️ 7. Cleaning up test member...");
  const deleteRes = await fetch(`${BASE_URL}/api/members/${createdMember.id}`, {
    method: "DELETE",
    headers: authHeaders
  });
  assert(deleteRes.status === 200, "Cleanup failed");
  console.log("✅ Test member and associated payment records successfully cleaned up.");

  console.log("\n🎉 END-TO-END VERIFICATION FLOW COMPLETED WITH 100% SUCCESS!");
}

runEndToEndVerification().catch(err => {
  console.error("\n❌ End-to-end verification failed with error:", err.message);
  process.exit(1);
});

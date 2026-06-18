import { NextRequest } from "next/server";
import { verifyAuthToken } from "../middleware/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "test";
const token = jwt.sign({ id: "123", role: "member" }, JWT_SECRET);
const req = new NextRequest("http://localhost:3000/api/member/profile", {
  headers: {
    "Cookie": `token=${token}`
  }
});

console.log("Cookie header:", req.headers.get("cookie"));
console.log("Cookies parsed:", req.cookies.get("token"));
const decoded = verifyAuthToken(req);
console.log("Decoded:", decoded);

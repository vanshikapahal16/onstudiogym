import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "temporary_local_secret_key_1284";

export interface DecodedToken {
  id: string;
  role: "superadmin" | "admin" | "member";
}

// Helper to check if a decoded token is an administrator role
export function isAdmin(decoded: DecodedToken | null): boolean {
  return !!decoded && (decoded.role === "admin" || decoded.role === "superadmin");
}

// Edge-compatible verification of auth token from request using Web Crypto API
export async function verifyAuthTokenEdge(req: NextRequest): Promise<DecodedToken | null> {
  const token = req.cookies.get("token")?.value;

  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerPart, payloadPart, signaturePart] = parts;
    const dataToVerify = `${headerPart}.${payloadPart}`;

    // Base64url decode signature
    let base64 = signaturePart.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const signatureBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      signatureBytes[i] = binary.charCodeAt(i);
    }

    // Import key using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(JWT_SECRET);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Verify signature
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(dataToVerify)
    );

    if (!isValid) return null;

    // Decode and parse payload
    let payloadBase64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    while (payloadBase64.length % 4) {
      payloadBase64 += "=";
    }
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    return payload as DecodedToken;
  } catch (error) {
    return null;
  }
}

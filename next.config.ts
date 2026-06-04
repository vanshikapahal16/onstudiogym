import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: "/sso-callback?complete=true",
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: "/sso-callback?complete=true",
  }
};

export default nextConfig;
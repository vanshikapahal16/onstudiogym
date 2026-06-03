"use client";

import { useEffect } from "react";

export default function MemberSessionSyncer() {
  useEffect(() => {
    fetch("/api/member/sync", { method: "POST" })
      .then((res) => res.json())
      .catch(() => {});
  }, []);

  return null;
}

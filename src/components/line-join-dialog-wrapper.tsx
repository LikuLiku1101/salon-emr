"use client";

import dynamic from "next/dynamic";

export const LineJoinDialog = dynamic(() => import("./line-join-dialog"), {
  ssr: false,
});

"use client";

import dynamic from "next/dynamic";

const EditorTabs = dynamic(() => import("./EditorTabs"), {
  ssr: false,
});

export default function EditorClient() {
  return <EditorTabs />;
}

"use client";

import dynamic from "next/dynamic";

// Render the stage client-side only — it relies on window/rAF/DOM.
const CompanionStage = dynamic(
  () => import("@/components/companion/CompanionStage").then((m) => m.CompanionStage),
  {
    ssr: false,
    loading: () => (
      <div className="w-screen h-screen flex items-center justify-center bg-[#1a1033]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 animate-pulse" />
          <div className="text-white/60 text-sm font-medium">Summoning companions…</div>
        </div>
      </div>
    ),
  },
);

export default function Home() {
  return <CompanionStage />;
}

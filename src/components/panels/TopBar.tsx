"use client";

import { useState } from "react";
import { Pause, Play, Sparkles, Users, Download, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCompanionStore } from "@/lib/store/companionStore";
import { getTier } from "@/lib/companion/affinity";
import { toast } from "sonner";

export function TopBar() {
  const companionIds = Object.keys(useCompanionStore((s) => s.companions));
  const companions = useCompanionStore((s) => s.companions);
  const isPaused = useCompanionStore((s) => s.isPaused);
  const togglePause = useCompanionStore((s) => s.togglePause);

  const [dlState, setDlState] = useState<"idle" | "preparing" | "done">("idle");

  const count = companionIds.length;
  const totalAffinity = companionIds.reduce(
    (sum, id) => sum + (companions[id]?.affinity ?? 0),
    0,
  );
  const avgAffinity = count ? totalAffinity / count : 0;
  const tier = getTier(avgAffinity);

  const handleDownload = async () => {
    if (dlState === "preparing") return;
    setDlState("preparing");
    try {
      // Trigger a fresh build of the zip on the server, then download it.
      const res = await fetch("/api/download", { method: "POST" });
      if (!res.ok) throw new Error("build failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nexus-companions.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDlState("done");
      toast.success("Project ZIP downloaded! Unzip and run `bun install && bun run dev`.");
      setTimeout(() => setDlState("idle"), 2500);
    } catch (e) {
      // Fallback: link directly to the static zip in /public.
      setDlState("idle");
      toast.error("Building fresh zip failed — trying static copy.");
      window.open("/nexus-companions.zip", "_blank");
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 pointer-events-none">
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        className="pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-white/8 backdrop-blur-xl border border-white/10 px-3.5 py-2 shadow-lg"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#1a1033]" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-white tracking-tight">NEXUS Companions</div>
          <div className="text-[10px] text-white/60 font-medium">desktop pet engine v1.0</div>
        </div>
      </motion.div>

      {/* Stats + controls */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        className="pointer-events-auto flex items-center gap-2"
      >
        <div className="hidden sm:flex items-center gap-3 rounded-2xl bg-white/8 backdrop-blur-xl border border-white/10 px-3.5 py-2 shadow-lg">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-xs font-semibold text-white tabular-nums">{count}</span>
            <span className="text-[10px] text-white/50">active</span>
          </div>
          <div className="w-px h-4 bg-white/15" />
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{tier.emoji}</span>
            <span className="text-xs font-semibold text-white tabular-nums">
              {Math.round(avgAffinity)}
            </span>
            <span className="text-[10px] text-white/50">avg affinity</span>
          </div>
        </div>

        {/* Download project ZIP */}
        <button
          onClick={handleDownload}
          disabled={dlState === "preparing"}
          className="pointer-events-auto group relative flex items-center gap-1.5 rounded-2xl bg-gradient-to-br from-emerald-500/90 to-teal-500/90 backdrop-blur-xl border border-emerald-300/30 px-3 h-10 text-white hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-70"
          title="Download the whole project as a ZIP"
        >
          {dlState === "preparing" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : dlState === "done" ? (
            <Check className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="text-xs font-semibold hidden md:inline">
            {dlState === "preparing" ? "Packing…" : dlState === "done" ? "Downloaded" : "Download ZIP"}
          </span>
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Full source + assets
          </span>
        </button>

        <button
          onClick={togglePause}
          className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-2xl bg-white/8 backdrop-blur-xl border border-white/10 text-white hover:bg-white/15 transition-colors shadow-lg"
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
      </motion.div>
    </div>
  );
}

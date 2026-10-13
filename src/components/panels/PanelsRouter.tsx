"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useUIStore } from "@/lib/store/uiStore";
import { RosterPanel } from "./RosterPanel";
import { CharacterCreator } from "./CharacterCreator";
import { PetRepository } from "./PetRepository";
import { SettingsPanel } from "./SettingsPanel";

const TITLES: Record<string, string> = {
  roster: "Companion Roster",
  creator: "Character Creator",
  repository: "Pet Repository",
  settings: "Engine Settings",
};

export function PanelsRouter() {
  const openPanel = useUIStore((s) => s.openPanel);
  const closePanel = useUIStore((s) => s.closePanel);

  return (
    <AnimatePresence>
      {openPanel ? (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex justify-center"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closePanel}
          />
          {/* sheet */}
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="relative z-10 my-auto w-[min(860px,94vw)] max-h-[88vh] overflow-hidden rounded-3xl border border-white/12 bg-[#171029]/85 backdrop-blur-2xl shadow-2xl shadow-black/60"
          >
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {TITLES[openPanel]}
                </h2>
                <p className="text-xs text-white/50">NEXUS desktop companion engine</p>
              </div>
              <button
                onClick={closePanel}
                className="rounded-xl p-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* body */}
            <div className="overflow-y-auto max-h-[calc(88vh-72px)] custom-scroll">
              {openPanel === "roster" && <RosterPanel />}
              {openPanel === "creator" && <CharacterCreator />}
              {openPanel === "repository" && <PetRepository />}
              {openPanel === "settings" && <SettingsPanel />}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

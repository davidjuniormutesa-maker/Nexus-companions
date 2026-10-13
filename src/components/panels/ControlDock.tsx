"use client";

import { motion } from "framer-motion";
import {
  Cat,
  Palette,
  Store,
  SlidersHorizontal,
  Trash2,
  Plus,
} from "lucide-react";
import { useCompanionStore } from "@/lib/store/companionStore";
import { useUIStore } from "@/lib/store/uiStore";
import { BUILTIN_CHARACTERS } from "@/lib/companion/characters";

export function ControlDock() {
  const spawn = useCompanionStore((s) => s.spawn);
  const dismiss = useCompanionStore((s) => s.dismiss);
  const companions = useCompanionStore((s) => s.companions);
  const togglePanel = useUIStore((s) => s.togglePanel);

  const handleQuickAdd = () => {
    // Spawn a random built-in companion.
    const random = BUILTIN_CHARACTERS[Math.floor(Math.random() * BUILTIN_CHARACTERS.length)];
    const x = 100 + Math.random() * Math.max(100, window.innerWidth - 300);
    spawn(random.id, x);
  };

  const handleClearAll = () => {
    Object.keys(companions).forEach((id) => dismiss(id));
  };

  const buttons = [
    { id: "roster", icon: Cat, label: "Companions", action: () => togglePanel("roster") },
    { id: "creator", icon: Palette, label: "Create", action: () => togglePanel("creator") },
    { id: "repository", icon: Store, label: "Pet Store", action: () => togglePanel("repository") },
    { id: "settings", icon: SlidersHorizontal, label: "Settings", action: () => togglePanel("settings") },
  ] as const;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 flex justify-center pb-5 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.15 }}
        className="pointer-events-auto flex items-center gap-1.5 rounded-2xl bg-black/35 backdrop-blur-2xl border border-white/12 px-2 py-2 shadow-2xl shadow-black/40"
      >
        {/* Quick add */}
        <DockButton onClick={handleQuickAdd} accent="emerald" title="Spawn random companion">
          <Plus className="w-5 h-5" />
        </DockButton>

        <div className="w-px h-7 bg-white/12 mx-0.5" />

        {buttons.map((b) => (
          <DockButton key={b.id} onClick={b.action} title={b.label} label={b.label}>
            <b.icon className="w-5 h-5" />
          </DockButton>
        ))}

        <div className="w-px h-7 bg-white/12 mx-0.5" />

        {/* Clear all */}
        <DockButton onClick={handleClearAll} accent="rose" title="Dismiss all companions">
          <Trash2 className="w-5 h-5" />
        </DockButton>
      </motion.div>
    </div>
  );
}

function DockButton({
  children,
  onClick,
  title,
  label,
  accent = "violet",
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  label?: string;
  accent?: "violet" | "emerald" | "rose";
}) {
  const accentMap = {
    violet: "hover:bg-violet-500/25 hover:text-violet-200 hover:border-violet-400/40",
    emerald: "hover:bg-emerald-500/25 hover:text-emerald-200 hover:border-emerald-400/40",
    rose: "hover:bg-rose-500/25 hover:text-rose-200 hover:border-rose-400/40",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`group relative flex items-center gap-1.5 rounded-xl border border-transparent px-2.5 py-2 text-white/80 transition-all ${accentMap[accent]}`}
    >
      {children}
      {label && (
        <span className="hidden sm:inline text-xs font-medium pr-1">{label}</span>
      )}
      {/* tooltip */}
      <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {title}
      </span>
    </button>
  );
}

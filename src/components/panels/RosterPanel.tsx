"use client";

import { motion } from "framer-motion";
import { Plus, X, Sparkles } from "lucide-react";
import { useCompanionStore } from "@/lib/store/companionStore";
import { BUILTIN_CHARACTERS, getCharacterById } from "@/lib/companion/characters";
import { getTier } from "@/lib/companion/affinity";
import type { CharacterDef } from "@/lib/companion/types";

export function RosterPanel() {
  const customChars = useCompanionStore((s) => s.customCharacters);
  const installedPets = useCompanionStore((s) => s.installedPets);
  const spawn = useCompanionStore((s) => s.spawn);
  const companions = useCompanionStore((s) => s.companions);
  const dismiss = useCompanionStore((s) => s.dismiss);
  const select = useCompanionStore((s) => s.select);

  const all: CharacterDef[] = [...BUILTIN_CHARACTERS, ...customChars, ...installedPets];
  const activeIds = Object.keys(companions);

  return (
    <div className="p-5 sm:p-6 space-y-6">
      {/* Active companions */}
      {activeIds.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
            Active on desktop · {activeIds.length}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeIds.map((id) => {
              const inst = companions[id];
              const char = getCharacterById(inst.characterId, [...customChars, ...installedPets]);
              if (!char) return null;
              const tier = getTier(inst.affinity);
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <img
                    src={char.portrait}
                    alt={char.name}
                    className="w-9 h-9 rounded-lg object-cover bg-black/30"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{char.name}</div>
                    <div className="text-[11px] text-white/50 flex items-center gap-1">
                      <span>{tier.emoji}</span>
                      <span>{tier.label}</span>
                      <span>·</span>
                      <span className="tabular-nums">{Math.round(inst.affinity)}%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => select(id)}
                    className="text-[11px] px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white/80"
                  >
                    focus
                  </button>
                  <button
                    onClick={() => dismiss(id)}
                    className="p-1.5 rounded-md text-white/50 hover:text-rose-300 hover:bg-rose-500/15"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Available characters */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
          Available characters · {all.length}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {all.map((char, i) => (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-white/[0.02] p-3 hover:border-white/20 transition-colors"
            >
              {/* accent glow */}
              <div
                className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"
                style={{ background: char.theme.accent }}
              />
              <div className="relative flex gap-3">
                <div className="relative shrink-0">
                  <img
                    src={char.portrait}
                    alt={char.name}
                    className="w-16 h-16 rounded-xl object-cover bg-black/40 border border-white/10"
                  />
                  <span className="absolute -bottom-1 -right-1 text-base">{char.theme.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-white truncate">{char.name}</h4>
                    {char.custom && (
                      <span className="text-[9px] px-1 py-px rounded bg-violet-500/30 text-violet-200 font-semibold uppercase">
                        custom
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-white/40 mb-1">{char.universe}</div>
                  <p className="text-[11px] text-white/60 line-clamp-2 leading-snug">
                    {char.description}
                  </p>
                </div>
              </div>

              {/* personality bars */}
              <div className="relative mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
                <PersonalityBar label="energy" value={char.personality.energy} color={char.theme.accent} />
                <PersonalityBar label="social" value={char.personality.social} color={char.theme.accent} />
                <PersonalityBar label="curiosity" value={char.personality.curiosity} color={char.theme.accent} />
                <PersonalityBar label="playful" value={char.personality.playfulness} color={char.theme.accent} />
              </div>

              <button
                onClick={() => spawn(char.id)}
                className="relative mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-white shadow-lg transition-transform active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${char.theme.accent}, ${char.theme.accent}99)`,
                  boxShadow: `0 6px 18px -4px ${char.theme.accent}80`,
                }}
              >
                <Plus className="w-3.5 h-3.5" /> Spawn to desktop
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <p className="text-[11px] text-white/40 flex items-center gap-1.5">
        <Sparkles className="w-3 h-3" /> Tip: drag companions around, right-click for interactions,
        and raise their affinity to unlock speech bubbles.
      </p>
    </div>
  );
}

function PersonalityBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-white/40 w-14 capitalize">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}

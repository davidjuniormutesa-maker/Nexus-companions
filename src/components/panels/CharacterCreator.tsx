"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Sparkles, RotateCcw, Check } from "lucide-react";
import { useCompanionStore } from "@/lib/store/companionStore";
import { useUIStore } from "@/lib/store/uiStore";
import { BUILTIN_CHARACTERS } from "@/lib/companion/characters";
import type { CharacterDef, Personality } from "@/lib/companion/types";
import { SpriteAnimator } from "@/components/companion/SpriteAnimator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#f472b6", "#a78bfa", "#22d3ee", "#fb923c", "#34d399",
  "#f9a8d4", "#6366f1", "#facc15", "#fb7185", "#38bdf8",
];

const PRESET_EMOJIS = ["🌟", "🌙", "🐾", "🍥", "🔥", "🌸", "💎", "⚡", "🎀", "💚", "🦊", "🐱"];

const DEFAULT_PERSONALITY: Personality = {
  energy: 0.6,
  curiosity: 0.6,
  social: 0.6,
  playfulness: 0.6,
  seriousness: 0.4,
};

export function CharacterCreator() {
  const addCustomCharacter = useCompanionStore((s) => s.addCustomCharacter);
  const spawn = useCompanionStore((s) => s.spawn);
  const closePanel = useUIStore((s) => s.closePanel);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [universe, setUniverse] = useState("Custom");
  const [baseIdx, setBaseIdx] = useState(0);
  const [accent, setAccent] = useState(PRESET_COLORS[0]);
  const [emoji, setEmoji] = useState(PRESET_EMOJIS[0]);
  const [personality, setPersonality] = useState<Personality>(DEFAULT_PERSONALITY);
  const [previewAnim, setPreviewAnim] = useState("idle");
  const [saving, setSaving] = useState(false);

  const baseChar = BUILTIN_CHARACTERS[baseIdx];

  const previewChar: CharacterDef = {
    ...baseChar,
    id: `preview-${baseChar.id}`,
    name: name || "Preview",
    theme: { accent, emoji },
    personality,
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setUniverse("Custom");
    setBaseIdx(0);
    setAccent(PRESET_COLORS[0]);
    setEmoji(PRESET_EMOJIS[0]);
    setPersonality(DEFAULT_PERSONALITY);
  };

  const buildDef = (id: string): CharacterDef => ({
    id,
    name: name.trim() || "Unnamed",
    author: "you",
    description: description.trim() || "A custom NEXUS companion.",
    universe: universe.trim() || "Custom",
    spriteBase: baseChar.spriteBase,
    spriteSize: baseChar.spriteSize,
    frameFormat: baseChar.frameFormat,
    portrait: baseChar.portrait,
    personality,
    theme: { accent, emoji },
    animations: baseChar.animations,
    stateMap: baseChar.stateMap,
    tags: ["custom"],
    custom: true,
  });

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Give your companion a name first!");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/characters/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          universe,
          spriteBase: baseChar.spriteBase,
          accent,
          emoji,
          personality,
        }),
      });
      const data = await res.json();
      if (data.character) {
        addCustomCharacter(data.character);
        toast.success(`${data.character.name} saved to your roster!`);
        closePanel();
      } else {
        throw new Error(data.error ?? "failed");
      }
    } catch (e: any) {
      // fallback: add locally only
      const local = buildDef(`custom_${Date.now()}`);
      addCustomCharacter(local);
      toast.success(`${local.name} added (local only)`);
      closePanel();
    } finally {
      setSaving(false);
    }
  };

  const handleSpawnNow = () => {
    const local = buildDef(`custom_${Date.now()}`);
    addCustomCharacter(local);
    spawn(local.id, 200 + Math.random() * 400);
    toast.success(`${local.name} spawned to your desktop!`);
    closePanel();
  };

  const animButtons = ["idle", "walk", "dance", "wave", "happy", "sit", "sleep"];

  return (
    <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: form */}
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-white/60">Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Yuki, Bolt, Mochi…"
              maxLength={40}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-white/60">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short personality blurb…"
              maxLength={240}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-white/60">Universe</Label>
            <Input
              value={universe}
              onChange={(e) => setUniverse(e.target.value)}
              maxLength={40}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-white/60">Emoji</Label>
            <div className="flex flex-wrap gap-1">
              {PRESET_EMOJIS.map((em) => (
                <button
                  key={em}
                  onClick={() => setEmoji(em)}
                  className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                    emoji === em ? "bg-white/20 ring-2 ring-white/40" : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Base sprite */}
        <div className="space-y-2">
          <Label className="text-xs text-white/60">Base sprite set</Label>
          <div className="grid grid-cols-5 gap-2">
            {BUILTIN_CHARACTERS.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setBaseIdx(i)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                  baseIdx === i ? "border-white/60 scale-105" : "border-white/10 hover:border-white/30"
                }`}
                style={{ aspectRatio: "3/4" }}
              >
                <img src={c.portrait} alt={c.name} className="w-full h-full object-cover bg-black/40" />
                <span className="absolute bottom-0 inset-x-0 text-[8px] text-white bg-black/50 py-0.5 text-center">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Accent color */}
        <div className="space-y-2">
          <Label className="text-xs text-white/60">Accent color</Label>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_COLORS.map((col) => (
              <button
                key={col}
                onClick={() => setAccent(col)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  accent === col ? "ring-2 ring-white scale-110" : "hover:scale-105"
                }`}
                style={{ background: col }}
              />
            ))}
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-7 h-7 rounded-full bg-transparent cursor-pointer border-0 p-0"
            />
          </div>
        </div>

        {/* Personality */}
        <div className="space-y-3">
          <Label className="text-xs text-white/60">Personality traits</Label>
          {(
            [
              ["energy", "Energy — how often it moves"],
              ["curiosity", "Curiosity — likelihood to wander/climb"],
              ["social", "Social — seeks interaction"],
              ["playfulness", "Playful — dance & wave frequency"],
              ["seriousness", "Seriousness — calm vs excitable"],
            ] as const
          ).map(([key, lbl]) => (
            <div key={key} className="rounded-lg bg-white/5 px-3 py-2">
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-white/70">{lbl}</span>
                <span className="text-white tabular-nums font-semibold">
                  {Math.round(personality[key] * 100)}%
                </span>
              </div>
              <Slider
                value={[personality[key]]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(v) => setPersonality((p) => ({ ...p, [key]: v[0] }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right: preview + actions */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 to-transparent p-5">
          <div className="text-xs text-white/50 mb-3 text-center">Live preview</div>
          <div
            className="relative mx-auto rounded-2xl flex items-end justify-center overflow-hidden"
            style={{
              height: 220,
              background: `radial-gradient(ellipse at 50% 90%, ${accent}33, transparent 70%)`,
            }}
          >
            {/* floor glow */}
            <div
              className="absolute bottom-0 left-0 right-0 h-12"
              style={{ background: `linear-gradient(to top, ${accent}22, transparent)` }}
            />
            <div className="relative" style={{ marginBottom: -8 }}>
              <SpriteAnimator character={previewChar} anim={previewAnim} facing={1} scale={1.2} />
            </div>
            {/* floating emoji */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute top-3 right-3 text-2xl"
            >
              {emoji}
            </motion.div>
          </div>

          {/* anim switcher */}
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {animButtons.map((a) => (
              <button
                key={a}
                onClick={() => setPreviewAnim(a)}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                  previewAnim === a
                    ? "text-white"
                    : "text-white/60 bg-white/5 hover:bg-white/10"
                }`}
                style={previewAnim === a ? { background: accent } : {}}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}aa)`,
              boxShadow: `0 8px 20px -4px ${accent}80`,
            }}
          >
            {saving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save to roster
          </button>
          <button
            onClick={handleSpawnNow}
            className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Spawn now
          </button>
        </div>
        <button
          onClick={resetForm}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset form
        </button>

        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-[11px] text-white/50 leading-relaxed">
          <Check className="inline w-3 h-3 text-emerald-400 mr-1" />
          Custom companions reuse the selected base sprite set with your own name,
          colors, and personality — the brain reshapes behaviour from your trait
          sliders in real time.
        </div>
      </div>
    </div>
  );
}

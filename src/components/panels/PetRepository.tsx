"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  Download,
  Upload,
  Plus,
  Check,
  Loader2,
  Flame,
} from "lucide-react";
import { useCompanionStore } from "@/lib/store/companionStore";
import { useUIStore } from "@/lib/store/uiStore";
import { BUILTIN_CHARACTERS, COMMON_STATE_MAP } from "@/lib/companion/characters";
import type { CharacterDef, Personality } from "@/lib/companion/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RepoResponse {
  pets: CharacterDef[];
  count: number;
}

// extend CharacterDef with repo metadata for display
interface RepoPet extends CharacterDef {
  downloads?: number;
  rating?: number;
  author?: string;
}

export function PetRepository() {
  const installPet = useCompanionStore((s) => s.installPet);
  const installedPets = useCompanionStore((s) => s.installedPets);
  const spawn = useCompanionStore((s) => s.spawn);
  const closePanel = useUIStore((s) => s.closePanel);

  const [pets, setPets] = useState<RepoPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("downloads");
  const [showUpload, setShowUpload] = useState(false);

  const fetchPets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/repository?q=${encodeURIComponent(query)}&sort=${sort}`);
      const data: RepoResponse = await res.json();
      setPets(data.pets);
    } catch {
      toast.error("Failed to load repository");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchPets, 250);
    return () => clearTimeout(t);
  }, [query, sort]);

  const handleInstall = async (pet: RepoPet) => {
    try {
      const res = await fetch(`/api/repository/${pet.id}`, { method: "POST" });
      const data = await res.json();
      const installed = data.pet ?? pet;
      installPet(installed);
      toast.success(`${installed.name} installed! Find it in your roster.`);
    } catch {
      installPet(pet);
      toast.success(`${pet.name} installed (offline)`);
    }
  };

  const handleSpawnInstalled = (pet: RepoPet) => {
    spawn(pet.id, 200 + Math.random() * 400);
    toast.success(`${pet.name} spawned to desktop!`);
    closePanel();
  };

  const isInstalled = (id: string) => installedPets.some((p) => p.id === id);

  return (
    <div className="p-5 sm:p-6 space-y-4">
      {/* header controls */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pets by name, author, or vibe…"
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="downloads">Most popular</SelectItem>
            <SelectItem value="rating">Top rated</SelectItem>
            <SelectItem value="new">Newest</SelectItem>
          </SelectContent>
        </Select>
        <button
          onClick={() => setShowUpload((v) => !v)}
          className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-violet-500/30 hover:bg-violet-500/45 border border-violet-400/30 transition-colors whitespace-nowrap"
        >
          <Upload className="w-4 h-4" /> Upload
        </button>
      </div>

      {/* upload form */}
      {showUpload && (
        <UploadForm
          onClose={() => setShowUpload(false)}
          onUploaded={(p) => {
            installPet(p);
            toast.success(`${p.name} uploaded & installed!`);
            fetchPets();
            setShowUpload(false);
          }}
        />
      )}

      {/* grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/50">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading community pets…
        </div>
      ) : pets.length === 0 ? (
        <div className="text-center py-16 text-white/50 text-sm">
          No pets found. Try a different search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pets.map((pet, i) => {
            const installed = isInstalled(pet.id);
            return (
              <motion.div
                key={pet.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-white/[0.02] p-3 hover:border-white/20 transition-colors"
              >
                <div
                  className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"
                  style={{ background: pet.theme.accent }}
                />
                <div className="relative flex gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={pet.portrait}
                      alt={pet.name}
                      className="w-16 h-16 rounded-xl object-cover bg-black/40 border border-white/10"
                    />
                    <span className="absolute -bottom-1 -right-1 text-base">{pet.theme.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white truncate">{pet.name}</h4>
                      {pet.downloads && pet.downloads > 4000 && (
                        <Flame className="w-3 h-3 text-amber-400" />
                      )}
                    </div>
                    <div className="text-[10px] text-white/40 mb-0.5">by {pet.author}</div>
                    <div className="flex items-center gap-2 text-[10px] text-white/50">
                      <span className="flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        <span className="tabular-nums">{(pet.rating ?? 5).toFixed(1)}</span>
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Download className="w-2.5 h-2.5" />
                        <span className="tabular-nums">{formatCount(pet.downloads ?? 0)}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <p className="relative text-[11px] text-white/60 line-clamp-2 leading-snug mt-2 min-h-[28px]">
                  {pet.description}
                </p>
                <div className="relative mt-3 flex gap-1.5">
                  {installed ? (
                    <button
                      onClick={() => handleSpawnInstalled(pet)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold text-white transition-colors"
                      style={{ background: `${pet.theme.accent}30` }}
                    >
                      <Plus className="w-3 h-3" /> Spawn
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInstall(pet)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold text-white shadow transition-transform active:scale-95"
                      style={{
                        background: `linear-gradient(135deg, ${pet.theme.accent}, ${pet.theme.accent}99)`,
                      }}
                    >
                      <Download className="w-3 h-3" /> Install
                    </button>
                  )}
                  {installed && (
                    <span className="flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] text-emerald-300 bg-emerald-500/15">
                      <Check className="w-3 h-3" /> owned
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-white/40 text-center">
        {pets.length} community pets · all free · installs in a single click
      </p>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function UploadForm({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: (pet: CharacterDef) => void;
}) {
  const [name, setName] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [baseIdx, setBaseIdx] = useState(0);
  const [accent, setAccent] = useState("#f472b6");
  const [emoji, setEmoji] = useState("✨");
  const [energy, setEnergy] = useState(0.6);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    setSubmitting(true);
    try {
      const base = BUILTIN_CHARACTERS[baseIdx];
      const personality: Personality = {
        energy,
        curiosity: 0.6,
        social: 0.6,
        playfulness: 0.6,
        seriousness: 0.4,
      };
      const res = await fetch("/api/repository", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          author: author || "anonymous",
          description,
          universe: "Community",
          spriteBase: base.spriteBase,
          accent,
          emoji,
          personality,
        }),
      });
      const data = await res.json();
      if (data.pet) onUploaded(data.pet);
      else throw new Error(data.error);
    } catch (e: any) {
      toast.error("Upload failed: " + (e?.message ?? "unknown"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-2xl border border-violet-400/20 bg-violet-500/8 p-4 space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-white/60">Pet name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-white/60">Your handle</Label>
          <Input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={40}
            placeholder="anonymous"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
        <div className="col-span-full space-y-1.5">
          <Label className="text-xs text-white/60">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={240}
            rows={2}
            className="bg-white/5 border-white/10 text-white resize-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-white/60">Base sprite</Label>
          <div className="flex gap-1.5">
            {BUILTIN_CHARACTERS.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setBaseIdx(i)}
                className={`w-9 h-9 rounded-lg overflow-hidden border-2 ${
                  baseIdx === i ? "border-white/60" : "border-white/10"
                }`}
              >
                <img src={c.portrait} alt={c.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-white/60">Accent</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-9 h-9 rounded-lg bg-transparent cursor-pointer border-0 p-0"
            />
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
              maxLength={2}
              className="w-14 bg-white/5 border-white/10 text-white text-center text-lg"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={submit}
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold text-white bg-violet-500 hover:bg-violet-600 disabled:opacity-50 transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Publish to repository
        </button>
        <button
          onClick={onClose}
          className="rounded-xl px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

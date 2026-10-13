import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BUILTIN_CHARACTERS, COMMON_STATE_MAP } from "@/lib/companion/characters";
import type { CharacterDef, Personality } from "@/lib/companion/types";

export const dynamic = "force-dynamic";

function parsePersonality(s: string): Personality {
  try {
    return JSON.parse(s) as Personality;
  } catch {
    return { energy: 0.6, curiosity: 0.6, social: 0.6, playfulness: 0.6, seriousness: 0.4 };
  }
}

function rowToDef(row: any): CharacterDef {
  const [w, h] = row.spriteSize.split(",").map(Number);
  return {
    id: row.id,
    name: row.name,
    author: row.author,
    description: row.description,
    universe: row.universe,
    spriteBase: row.spriteBase,
    spriteSize: [w || 96, h || 128],
    frameFormat: row.frameFormat === "long" ? "long" : "short",
    portrait: `${row.spriteBase}idle_${row.frameFormat === "long" ? "0001" : "01"}.png`,
    personality: parsePersonality(row.personality),
    theme: { accent: row.accent, emoji: row.emoji },
    animations: BUILTIN_CHARACTERS[0].animations,
    stateMap: COMMON_STATE_MAP,
    tags: (() => {
      try {
        return JSON.parse(row.tags);
      } catch {
        return ["community"];
      }
    })(),
    custom: true,
  };
}

// Curated community pets seeded on first request.
const SEED_PETS = [
  {
    name: "Sakura",
    author: "moonlitDev",
    description: "A gentle blossom spirit who loves waving and napping in warm light.",
    universe: "Community · Spring Spirits",
    spriteBase: "/characters/astra/sprites/",
    accent: "#f9a8d4",
    emoji: "🌸",
    personality: { energy: 0.5, curiosity: 0.6, social: 0.8, playfulness: 0.7, seriousness: 0.3 },
    tags: ["community", "soft", "spring"],
  },
  {
    name: "Kage",
    author: "shadowFox",
    description: "A shadow-walker who climbs every wall in sight. Mysterious but loyal.",
    universe: "Community · Night Walkers",
    spriteBase: "/characters/kuro/sprites/",
    accent: "#6366f1",
    emoji: "🌑",
    personality: { energy: 0.85, curiosity: 0.95, social: 0.4, playfulness: 0.5, seriousness: 0.7 },
    tags: ["community", "climber", "mysterious"],
  },
  {
    name: "Ramen-kun",
    author: "noodleSensei",
    description: "Believes in ramen and friendship. Will run laps when excited.",
    universe: "Community · Food Souls",
    spriteBase: "/characters/naruto/sprites/",
    accent: "#f97316",
    emoji: "🍜",
    personality: { energy: 0.95, curiosity: 0.6, social: 0.85, playfulness: 0.9, seriousness: 0.2 },
    tags: ["community", "energetic", "food"],
  },
  {
    name: "Ember",
    author: "blueFlameArt",
    description: "Stoic flame user. Softens dramatically once affinity reaches soulmate.",
    universe: "Community · Flame Bearers",
    spriteBase: "/characters/dabi/sprites/",
    accent: "#38bdf8",
    emoji: "🔥",
    personality: { energy: 0.75, curiosity: 0.55, social: 0.3, playfulness: 0.4, seriousness: 0.85 },
    tags: ["community", "intense", "flame"],
  },
  {
    name: "Vesper",
    author: "duskCoder",
    description: "A quiet twilight companion. Thinks deep thoughts at 3am.",
    universe: "Community · Twilight",
    spriteBase: "/characters/nyx/sprites/",
    accent: "#c084fc",
    emoji: "🌆",
    personality: { energy: 0.45, curiosity: 0.7, social: 0.4, playfulness: 0.45, seriousness: 0.7 },
    tags: ["community", "calm", "thoughtful"],
  },
  {
    name: "Pip",
    author: "tinyPixel",
    description: "A bouncy tiny friend who dances at every opportunity. Pure joy.",
    universe: "Community · Pixel Pals",
    spriteBase: "/characters/astra/sprites/",
    accent: "#34d399",
    emoji: "💚",
    personality: { energy: 0.9, curiosity: 0.7, social: 0.9, playfulness: 0.95, seriousness: 0.1 },
    tags: ["community", "bouncy", "joyful"],
  },
];

async function ensureSeed() {
  const count = await db.repositoryPet.count();
  if (count > 0) return;
  for (const p of SEED_PETS) {
    await db.repositoryPet.create({
      data: {
        name: p.name,
        author: p.author,
        description: p.description,
        universe: p.universe,
        spriteBase: p.spriteBase,
        spriteSize: "96,128",
        frameFormat: p.spriteBase.includes("dabi") ? "long" : "short",
        accent: p.accent,
        emoji: p.emoji,
        personality: JSON.stringify(p.personality),
        tags: JSON.stringify(p.tags),
        downloads: Math.floor(Math.random() * 5000) + 200,
        rating: 4 + Math.random(),
      },
    });
  }
}

export async function GET(req: NextRequest) {
  await ensureSeed();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() ?? "";
  const sort = searchParams.get("sort") ?? "downloads";

  let rows = await db.repositoryPet.findMany();
  if (q) {
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }
  rows.sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "new") return b.createdAt.getTime() - a.createdAt.getTime();
    return b.downloads - a.downloads;
  });

  return NextResponse.json({ pets: rows.map(rowToDef), count: rows.length });
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeed();
    const body = await req.json();
    const { name, author, description, universe, spriteBase, accent, emoji, personality } = body ?? {};
    if (!name || !spriteBase) {
      return NextResponse.json({ error: "name and spriteBase required" }, { status: 400 });
    }
    const baseChar = BUILTIN_CHARACTERS.find((c) => c.spriteBase === spriteBase);
    const created = await db.repositoryPet.create({
      data: {
        name: String(name).slice(0, 40),
        author: String(author ?? "anonymous").slice(0, 40),
        description: String(description ?? "").slice(0, 240),
        universe: String(universe ?? "Community").slice(0, 40),
        spriteBase: String(spriteBase),
        spriteSize: `${baseChar?.spriteSize[0] ?? 96},${baseChar?.spriteSize[1] ?? 128}`,
        frameFormat: baseChar?.frameFormat ?? "short",
        accent: String(accent ?? "#f472b6"),
        emoji: String(emoji ?? "✨").slice(0, 4),
        personality: JSON.stringify(personality ?? baseChar?.personality ?? {}),
        tags: JSON.stringify(["community", "user-upload"]),
        downloads: 0,
        rating: 5,
      },
    });
    return NextResponse.json({ pet: rowToDef(created) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 });
  }
}

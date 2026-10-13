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
    tags: ["community"],
    custom: true,
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await db.repositoryPet.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ pet: rowToDef(row) });
}

// Install: increment download counter and return the full def.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await db.repositoryPet.update({
    where: { id },
    data: { downloads: { increment: 1 } },
  });
  return NextResponse.json({ pet: rowToDef(row) });
}

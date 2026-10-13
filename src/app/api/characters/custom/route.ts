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
    author: "you",
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
        return ["custom"];
      }
    })(),
    custom: true,
  };
}

export async function GET() {
  const rows = await db.customCharacter.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ characters: rows.map(rowToDef) });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      universe,
      spriteBase,
      accent,
      emoji,
      personality,
    } = body ?? {};

    if (!name || !spriteBase) {
      return NextResponse.json({ error: "name and spriteBase are required" }, { status: 400 });
    }

    const baseChar = BUILTIN_CHARACTERS.find((c) => c.spriteBase === spriteBase);
    const spriteSize = baseChar?.spriteSize ?? [96, 128];
    const frameFormat = baseChar?.frameFormat ?? "short";

    const created = await db.customCharacter.create({
      data: {
        name: String(name).slice(0, 40),
        description: String(description ?? "").slice(0, 240),
        universe: String(universe ?? "Custom").slice(0, 40),
        spriteBase: String(spriteBase),
        spriteSize: `${spriteSize[0]},${spriteSize[1]}`,
        frameFormat,
        accent: String(accent ?? "#f472b6"),
        emoji: String(emoji ?? "✨").slice(0, 4),
        personality: JSON.stringify(personality ?? baseChar?.personality ?? {}),
        animations: "{}",
        stateMap: "{}",
        tags: JSON.stringify(["custom"]),
      },
    });

    return NextResponse.json({ character: rowToDef(created) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 });
  }
}

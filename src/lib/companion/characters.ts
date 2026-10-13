// Built-in character roster. Sprite assets live in /public/characters/<id>/sprites/.

import type { CharacterDef, CompanionState } from "./types";

const BASE_ANIMS = {
  idle: { frames: 6, fps: 6, loop: true },
  blink: { frames: 4, fps: 10, loop: true },
  walk: { frames: 6, fps: 12, loop: true },
  run: { frames: 6, fps: 16, loop: true },
  jump: { frames: 4, fps: 10, loop: false },
  fall: { frames: 6, fps: 10, loop: true },
  land: { frames: 4, fps: 14, loop: false },
  sit: { frames: 6, fps: 6, loop: true },
  sleep: { frames: 6, fps: 4, loop: true },
  wake: { frames: 4, fps: 8, loop: false },
  dance: { frames: 6, fps: 12, loop: true },
  wave: { frames: 6, fps: 10, loop: true },
  talk: { frames: 6, fps: 8, loop: true },
  think: { frames: 6, fps: 6, loop: true },
  surprised: { frames: 4, fps: 10, loop: false },
  happy: { frames: 6, fps: 12, loop: true },
} as const;

const DABI_ANIMS = {
  idle: { frames: 16, fps: 8, loop: true },
  blink: { frames: 30, fps: 18, loop: true },
  walk: { frames: 17, fps: 18, loop: true },
  run: { frames: 15, fps: 22, loop: true },
  jump: { frames: 13, fps: 14, loop: false },
  fall: { frames: 17, fps: 14, loop: true },
  land: { frames: 11, fps: 18, loop: false },
  sit: { frames: 7, fps: 6, loop: true },
  sleep: { frames: 11, fps: 5, loop: true },
  wake: { frames: 10, fps: 10, loop: false },
  dance: { frames: 13, fps: 14, loop: true },
  wave: { frames: 10, fps: 10, loop: true },
  talk: { frames: 19, fps: 10, loop: true },
  think: { frames: 7, fps: 6, loop: true },
  surprised: { frames: 10, fps: 12, loop: false },
  happy: { frames: 13, fps: 14, loop: true },
  attack: { frames: 14, fps: 16, loop: false },
  defend: { frames: 14, fps: 14, loop: true },
  hurt: { frames: 15, fps: 14, loop: false },
  blue_flame: { frames: 17, fps: 16, loop: true },
} as const;

export const COMMON_STATE_MAP: Partial<Record<CompanionState, string>> = {
  IDLE: "idle",
  BLINK: "blink",
  WALK: "walk",
  RUN: "run",
  JUMP: "jump",
  FALL: "fall",
  LAND: "land",
  SIT: "sit",
  SLEEP: "sleep",
  WAKE: "wake",
  DANCE: "dance",
  WAVE: "wave",
  TALK: "talk",
  THINK: "think",
  SURPRISED: "surprised",
  HAPPY: "happy",
  INTERACT: "happy",
  PET: "happy",
};

export const BUILTIN_CHARACTERS: CharacterDef[] = [
  {
    id: "astra",
    name: "Astra",
    author: "NEXUS Companions",
    description:
      "A cheerful star-born companion who loves to dance and wave. Gentle, social, and always up for a chat.",
    universe: "NEXUS Original",
    spriteBase: "/characters/astra/sprites/",
    spriteSize: [96, 128],
    frameFormat: "short",
    portrait: "/characters/astra/sprites/idle_01.png",
    personality: { energy: 0.7, curiosity: 0.65, social: 0.85, playfulness: 0.8, seriousness: 0.3 },
    theme: { accent: "#f472b6", emoji: "🌟" },
    animations: BASE_ANIMS,
    stateMap: COMMON_STATE_MAP,
    tags: ["original", "cheerful", "social"],
  },
  {
    id: "nyx",
    name: "Nyx",
    author: "NEXUS Companions",
    description:
      "A mysterious night-spirit companion. Calm, thoughtful, and a little mischievous after dark.",
    universe: "NEXUS Original",
    spriteBase: "/characters/nyx/sprites/",
    spriteSize: [96, 128],
    frameFormat: "short",
    portrait: "/characters/nyx/sprites/idle_01.png",
    personality: { energy: 0.5, curiosity: 0.7, social: 0.45, playfulness: 0.5, seriousness: 0.6 },
    theme: { accent: "#a78bfa", emoji: "🌙" },
    animations: BASE_ANIMS,
    stateMap: COMMON_STATE_MAP,
    tags: ["original", "mysterious", "calm"],
  },
  {
    id: "kuro",
    name: "Kuro",
    author: "NEXUS Companions",
    description:
      "A playful shadow companion with boundless curiosity. Loves to climb walls and explore.",
    universe: "NEXUS Original",
    spriteBase: "/characters/kuro/sprites/",
    spriteSize: [96, 128],
    frameFormat: "short",
    portrait: "/characters/kuro/sprites/idle_01.png",
    personality: { energy: 0.85, curiosity: 0.9, social: 0.6, playfulness: 0.75, seriousness: 0.25 },
    theme: { accent: "#22d3ee", emoji: "🐾" },
    animations: BASE_ANIMS,
    stateMap: COMMON_STATE_MAP,
    tags: ["original", "playful", "climber"],
  },
  {
    id: "naruto",
    name: "Naruto",
    author: "NEXUS Companions",
    description:
      "An energetic ninja companion who never gives up. Believes in ramen and friendship.",
    universe: "Anime · Ninja Saga",
    spriteBase: "/characters/naruto/sprites/",
    spriteSize: [96, 128],
    frameFormat: "short",
    portrait: "/characters/naruto/sprites/idle_01.png",
    personality: { energy: 0.95, curiosity: 0.6, social: 0.8, playfulness: 0.85, seriousness: 0.35 },
    theme: { accent: "#fb923c", emoji: "🍥" },
    animations: BASE_ANIMS,
    stateMap: COMMON_STATE_MAP,
    tags: ["anime", "energetic", "ninja"],
  },
  {
    id: "dabi",
    name: "Dabi",
    author: "NEXUS Companions",
    description:
      "A brooding blue-flame user. Stoic, intense, and surprisingly soft once affinity is high.",
    universe: "Anime · Hero Academy",
    spriteBase: "/characters/dabi/sprites/",
    spriteSize: [192, 192],
    frameFormat: "long",
    portrait: "/characters/dabi/sprites/idle_0001.png",
    personality: { energy: 0.75, curiosity: 0.55, social: 0.25, playfulness: 0.38, seriousness: 0.82 },
    theme: { accent: "#37a7ff", emoji: "🔥" },
    animations: DABI_ANIMS,
    stateMap: { ...COMMON_STATE_MAP, CLIMB: "walk", HANG: "sit" },
    tags: ["anime", "intense", "flame"],
  },
];

export function getCharacterById(id: string, custom: CharacterDef[] = []): CharacterDef | undefined {
  return [...BUILTIN_CHARACTERS, ...custom].find((c) => c.id === id);
}

export function spriteUrl(char: CharacterDef, anim: string, frameIndex: number): string {
  const padded =
    char.frameFormat === "long"
      ? String(frameIndex + 1).padStart(4, "0")
      : String(frameIndex + 1).padStart(2, "0");
  return `${char.spriteBase}${anim}_${padded}.png`;
}

export function stateToAnim(char: CharacterDef, state: CompanionState): string {
  return char.stateMap[state] ?? "idle";
}

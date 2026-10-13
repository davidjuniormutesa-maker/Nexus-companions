// Core type definitions for the NEXUS desktop companion engine.

export type Vector2 = { x: number; y: number };

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  grounded: boolean;
  gravityEnabled: boolean;
  /** which surface the body is touching */
  surface: Surface;
}

export type Surface = "none" | "floor" | "left" | "right" | "ceiling";

export interface WorldBounds {
  width: number;
  height: number;
  /** y of the floor (companions stand on this). Usually = height. */
  floorY: number;
}

export type CompanionState =
  | "IDLE"
  | "WALK"
  | "RUN"
  | "JUMP"
  | "FALL"
  | "LAND"
  | "SIT"
  | "SLEEP"
  | "WAKE"
  | "DANCE"
  | "WAVE"
  | "HAPPY"
  | "TALK"
  | "THINK"
  | "SURPRISED"
  | "CLIMB"
  | "HANG"
  | "DRAGGED"
  | "BLINK"
  | "INTERACT"
  | "PET";

export interface AnimationDef {
  frames: number;
  fps: number;
  loop: boolean;
}

export interface CharacterTheme {
  accent: string;
  skin?: string;
  hair?: string;
  outfit?: string;
  emoji: string;
}

export interface Personality {
  energy: number;
  curiosity: number;
  social: number;
  playfulness: number;
  seriousness: number;
}

export interface CharacterDef {
  id: string;
  name: string;
  author: string;
  description: string;
  universe: string;
  spriteBase: string;
  spriteSize: [number, number];
  frameFormat: "short" | "long";
  portrait?: string;
  personality: Personality;
  theme: CharacterTheme;
  animations: Record<string, AnimationDef>;
  stateMap: Partial<Record<CompanionState, string>>;
  tags?: string[];
  custom?: boolean;
}

export interface CompanionInstance {
  id: string;
  characterId: string;
  state: CompanionState;
  previousState: CompanionState;
  facing: 1 | -1;
  affinity: number;
  anim: string;
  age: number;
  stateEnteredAt: number;
  targetX: number;
  climbSide: "left" | "right";
  spawnX: number;
  spawnY: number;
  speech?: { text: string; until: number };
  paused: boolean;
}

export interface HeartParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  kind: "heart" | "sparkle" | "note";
}

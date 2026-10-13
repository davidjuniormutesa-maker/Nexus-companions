// Central companion store. Uses Zustand for logical state (state/anim/affinity/
// speech) while physics bodies live in a module-level Map and are applied to
// the DOM directly each frame — avoiding 60fps React re-renders for position.

"use client";

import { create } from "zustand";
import type { Body, CharacterDef, CompanionInstance, WorldBounds } from "@/lib/companion/types";
import { BUILTIN_CHARACTERS, getCharacterById, stateToAnim } from "@/lib/companion/characters";
import { StateMachine } from "@/lib/companion/stateMachine";
import {
  DEFAULT_SETTINGS,
  EngineSettings,
  interactClick,
  interactPet,
  interactTalk,
  tickBrain,
} from "@/lib/companion/engine";
import { randomFrom, STATE_QUOTES } from "@/lib/companion/quotes";

// ---- Module-level (non-reactive) registries ----
const bodies = new Map<string, Body>();
const fsms = new Map<string, StateMachine>();
const domRefs = new Map<string, HTMLDivElement>();
let dragVelocity = { x: 0, y: 0 };
let lastDragPos = { x: 0, y: 0, t: 0 };
let particleId = 0;

function makeId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function rng() {
  return Math.random();
}

export interface CompanionStoreState {
  companions: Record<string, CompanionInstance>;
  customCharacters: CharacterDef[];
  installedPets: CharacterDef[];
  settings: EngineSettings;
  isPaused: boolean;
  selectedId: string | null;
  /** companion id -> latest heart-burst token (increment to trigger) */
  heartBursts: Record<string, number>;
  /** companion id -> latest sparkle token */
  sparkleBursts: Record<string, number>;

  spawn: (characterId: string, x?: number) => string;
  dismiss: (id: string) => void;
  pet: (id: string) => void;
  click: (id: string) => void;
  talk: (id: string) => void;
  startDrag: (id: string, x: number, y: number) => void;
  dragTo: (id: string, x: number, y: number) => void;
  endDrag: (id: string, bounds: WorldBounds) => void;
  tick: (dt: number, bounds: WorldBounds, now: number) => void;
  setSetting: <K extends keyof EngineSettings>(key: K, value: EngineSettings[K]) => void;
  togglePause: () => void;
  select: (id: string | null) => void;
  addCustomCharacter: (def: CharacterDef) => void;
  installPet: (def: CharacterDef) => void;
  registerDom: (id: string, el: HTMLDivElement | null) => void;
  triggerHeart: (id: string) => void;
  fetchAiQuote: (id: string) => Promise<void>;
  allCharacters: () => CharacterDef[];
}

export const useCompanionStore = create<CompanionStoreState>((set, get) => ({
  companions: {},
  customCharacters: [],
  installedPets: [],
  settings: { ...DEFAULT_SETTINGS },
  isPaused: false,
  selectedId: null,
  heartBursts: {},
  sparkleBursts: {},

  allCharacters: () => [...BUILTIN_CHARACTERS, ...get().customCharacters, ...get().installedPets],

  spawn: (characterId, x) => {
    const char = getCharacterById(characterId, [
      ...get().customCharacters,
      ...get().installedPets,
    ]);
    if (!char) return "";
    const id = makeId();
    const width = char.spriteSize[0];
    const height = char.spriteSize[1];
    const instance: CompanionInstance = {
      id,
      characterId,
      state: "IDLE",
      previousState: "IDLE",
      facing: 1,
      affinity: 5,
      anim: stateToAnim(char, "IDLE"),
      age: 0,
      stateEnteredAt: performance.now(),
      targetX: x ?? 200,
      climbSide: "left",
      spawnX: x ?? 200,
      spawnY: 0,
      paused: false,
    };
    bodies.set(id, {
      x: x ?? 200,
      y: 0,
      vx: 0,
      vy: 0,
      width,
      height,
      grounded: true,
      gravityEnabled: true,
      surface: "floor",
    });
    fsms.set(id, new StateMachine("IDLE"));
    set((s) => ({ companions: { ...s.companions, [id]: instance } }));
    return id;
  },

  dismiss: (id) => {
    bodies.delete(id);
    fsms.delete(id);
    domRefs.delete(id);
    set((s) => {
      const { [id]: _omit, ...rest } = s.companions;
      const hb = { ...s.heartBursts };
      delete hb[id];
      return { companions: rest, heartBursts: hb, selectedId: s.selectedId === id ? null : s.selectedId };
    });
  },

  pet: (id) => {
    const ctx = getCtx(id, get);
    if (!ctx) return;
    interactPet(ctx, performance.now());
    commit(id, get, set, { affinity: true, state: true, speech: true });
    get().triggerHeart(id);
  },

  click: (id) => {
    const ctx = getCtx(id, get);
    if (!ctx) return;
    interactClick(ctx, performance.now());
    commit(id, get, set, { affinity: true, state: true, speech: true });
    get().triggerHeart(id);
  },

  talk: (id) => {
    const ctx = getCtx(id, get);
    if (!ctx) return;
    interactTalk(ctx, performance.now());
    commit(id, get, set, { affinity: true, state: true, speech: true });
  },

  startDrag: (id, x, y) => {
    const body = bodies.get(id);
    const fsm = fsms.get(id);
    if (!body || !fsm) return;
    fsm.force("DRAGGED", performance.now());
    body.gravityEnabled = false;
    body.vx = 0;
    body.vy = 0;
    lastDragPos = { x, y, t: performance.now() };
    dragVelocity = { x: 0, y: 0 };
    commit(id, get, set, { state: true });
  },

  dragTo: (id, x, y) => {
    const body = bodies.get(id);
    if (!body) return;
    const now = performance.now();
    const dt = Math.max(1, now - lastDragPos.t);
    dragVelocity = {
      x: ((x - lastDragPos.x) / dt) * 1000,
      y: ((y - lastDragPos.y) / dt) * 1000,
    };
    lastDragPos = { x, y, t: now };
    // center the body on the cursor
    body.x = x - body.width / 2;
    body.y = y - body.height / 2;
    const el = domRefs.get(id);
    if (el) {
      el.style.transform = `translate3d(${body.x}px, ${body.y}px, 0)`;
    }
  },

  endDrag: (id, bounds) => {
    const body = bodies.get(id);
    const fsm = fsms.get(id);
    if (!body || !fsm) return;
    body.gravityEnabled = true;
    // Fling with captured velocity (capped).
    body.vx = Math.max(-900, Math.min(900, dragVelocity.x * 0.4));
    body.vy = Math.max(-600, Math.min(400, dragVelocity.y * 0.3));
    body.grounded = false;
    fsm.force("FALL", performance.now());
    // small affinity reward for gentle handling
    const inst = get().companions[id];
    if (inst) {
      inst.affinity = Math.min(100, inst.affinity + 1);
    }
    commit(id, get, set, { state: true, affinity: true });
  },

  tick: (dt, bounds, now) => {
    if (get().isPaused) return;
    const settings = get().settings;
    const committed: string[] = [];
    for (const [id, body] of bodies) {
      const inst = get().companions[id];
      const fsm = fsms.get(id);
      if (!inst || !fsm) continue;
      const char = getCharacterById(inst.characterId, [
        ...get().customCharacters,
        ...get().installedPets,
      ]);
      if (!char) continue;

      const prevAffinity = inst.affinity;
      const prevState = inst.state;
      const prevSpeech = inst.speech?.text;

      const transitioned = tickBrain(
        { body, instance: inst, fsm, char, settings, rng, now },
        dt,
        bounds,
      );

      // gentle idle affinity growth when close to floor and not sleeping
      if (fsm.state !== "SLEEP" && fsm.state !== "DRAGGED") {
        inst.affinity = Math.min(100, inst.affinity + 0.02 * dt * 60 * 0.1);
      }

      // Apply position directly to DOM (no React re-render).
      const el = domRefs.get(id);
      if (el) {
        el.style.transform = `translate3d(${body.x}px, ${body.y}px, 0)`;
      }

      const affinityChanged = Math.abs(inst.affinity - prevAffinity) > 0.5;
      const speechChanged = inst.speech?.text !== prevSpeech;
      if (transitioned || affinityChanged || speechChanged) {
        committed.push(id);
      }
    }
    if (committed.length) {
      set((s) => {
        const next = { ...s.companions };
        for (const id of committed) {
          next[id] = { ...next[id] };
        }
        return { companions: next };
      });
    }
  },

  setSetting: (key, value) =>
    set((s) => ({ settings: { ...s.settings, [key]: value } })),

  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),

  select: (id) => set({ selectedId: id }),

  addCustomCharacter: (def) =>
    set((s) => ({ customCharacters: [...s.customCharacters, def] })),

  installPet: (def) =>
    set((s) => ({
      installedPets: [...s.installedPets.filter((p) => p.id !== def.id), def],
    })),

  registerDom: (id, el) => {
    if (el) domRefs.set(id, el);
    else domRefs.delete(id);
  },

  triggerHeart: (id) =>
    set((s) => ({ heartBursts: { ...s.heartBursts, [id]: (s.heartBursts[id] ?? 0) + 1 } })),

  fetchAiQuote: async (id) => {
    const inst = get().companions[id];
    if (!inst) return;
    try {
      const res = await fetch("/api/generate-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: inst.state, affinity: inst.affinity }),
      });
      const data = await res.json();
      if (data.quote) {
        const now = performance.now();
        set((s) => ({
          companions: {
            ...s.companions,
            [id]: {
              ...s.companions[id],
              speech: { text: data.quote, until: now + 5000 },
            },
          },
        }));
      }
    } catch {
      // fallback to a local quote
      const now = performance.now();
      set((s) => ({
        companions: {
          ...s.companions,
          [id]: {
            ...s.companions[id],
            speech: { text: randomFrom(STATE_QUOTES[inst.state] ?? STATE_QUOTES.IDLE), until: now + 4000 },
          },
        },
      }));
    }
  },
}));

// ---- helpers ----
function getCtx(id: string, get: () => CompanionStoreState) {
  const body = bodies.get(id);
  const fsm = fsms.get(id);
  const inst = get().companions[id];
  if (!body || !fsm || !inst) return null;
  const char = getCharacterById(inst.characterId, [
    ...get().customCharacters,
    ...get().installedPets,
  ]);
  if (!char) return null;
  return { body, instance: inst, fsm, char, settings: get().settings, rng, now: performance.now() };
}

function commit(
  id: string,
  get: () => CompanionStoreState,
  set: (fn: (s: CompanionStoreState) => Partial<CompanionStoreState>) => void,
  _opts: { affinity?: boolean; state?: boolean; speech?: boolean },
) {
  set((s) => ({
    companions: { ...s.companions, [id]: { ...s.companions[id] } },
  }));
}

export function getBody(id: string): Body | undefined {
  return bodies.get(id);
}

export function nextParticleId(): number {
  return ++particleId;
}

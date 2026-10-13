// The companion "brain": per-tick behaviour decisions that drive the state
// machine. Pure-ish: mutates the body and instance, returns whether a state
// transition happened (so the store can sync React state).
//
// Influenced by Shimeji's behaviour scheduler + the NEXUS intent planner, but
// distilled to a lightweight, deterministic rule set tuned for the web stage.

import type { Body, CompanionInstance, CompanionState, WorldBounds } from "./types";
import type { CharacterDef } from "./types";
import { StateMachine } from "./stateMachine";
import {
  CLIMB_SPEED,
  GRAVITY,
  JUMP_VELOCITY,
  RUN_SPEED,
  TERMINAL_VELOCITY,
  WALK_SPEED,
  jump,
  releaseFromWall,
  walkToward,
} from "./physics";
import { playfulnessFromAffinity, shouldTalk } from "./affinity";
import { GREETINGS, STATE_QUOTES, getDayPart, randomFrom } from "./quotes";

export interface EngineSettings {
  gravityScale: number; // 0.5 .. 2
  speedScale: number; // 0.5 .. 2
  speechEnabled: boolean;
  climbEnabled: boolean;
}

export const DEFAULT_SETTINGS: EngineSettings = {
  gravityScale: 1,
  speedScale: 1,
  speechEnabled: true,
  climbEnabled: true,
};

const GRAVITY_BASE = GRAVITY;

export interface BrainContext {
  body: Body;
  instance: CompanionInstance;
  fsm: StateMachine;
  char: CharacterDef;
  settings: EngineSettings;
  /** persistent RNG-ish helpers */
  rng: () => number;
  /** current real time ms */
  now: number;
}

/** Returns true if the FSM transitioned this tick (caller should sync React). */
export function tickBrain(ctx: BrainContext, dt: number, bounds: WorldBounds): boolean {
  const { body, instance, fsm, char, settings, rng, now } = ctx;

  // Effective gravity scaled by settings.
  const gravity = GRAVITY_BASE * settings.gravityScale;

  instance.age += dt * 1000;
  const timeInState = now - instance.stateEnteredAt;

  let transitioned = false;

  // ---- Per-state behaviour ----
  switch (fsm.state) {
    case "IDLE": {
      // Tiny drift friction so it stays put.
      body.vx *= 0.8;
      const idleDuration = 2000 + rng() * 4000;
      if (timeInState > idleDuration) {
        const playful = playfulnessFromAffinity(instance.affinity, char.personality.playfulness);
        const r = rng();
        // Near a wall + curious + climb enabled -> climb
        const nearWall = body.x < 40 || body.x > bounds.width - body.width - 40;
        if (settings.climbEnabled && nearWall && rng() < char.personality.curiosity * 0.5) {
          instance.climbSide = body.x < 40 ? "left" : "right";
          if (fsm.go("CLIMB", now)) transitioned = true;
        } else if (r < playful * 0.3) {
          if (fsm.go(rng() < 0.5 ? "DANCE" : "WAVE", now)) transitioned = true;
        } else if (r < playful * 0.5) {
          if (fsm.go("SIT", now)) transitioned = true;
        } else if (rng() < 0.15) {
          if (fsm.go("RUN", now)) transitioned = true;
        } else {
          if (fsm.go("WALK", now)) transitioned = true;
        }
      } else if (rng() < 0.01) {
        // occasional blink
        if (fsm.go("BLINK", now)) transitioned = true;
      }
      // High affinity idle -> occasional speech
      maybeSpeak(ctx);
      break;
    }

    case "WALK": {
      const speed = WALK_SPEED * settings.speedScale;
      const dir = walkToward(body, instance.targetX, speed);
      if (dir !== 0) instance.facing = dir;
      const reached = Math.abs(body.x + body.width / 2 - instance.targetX) < 6;
      const nearWall =
        (body.x < 4 && dir === -1) || (body.x > bounds.width - body.width - 4 && dir === 1);
      if (reached || nearWall) {
        // Maybe climb if we hit a wall
        if (
          settings.climbEnabled &&
          nearWall &&
          rng() < char.personality.curiosity * 0.6
        ) {
          instance.climbSide = body.x < 4 ? "left" : "right";
          if (fsm.go("CLIMB", now)) transitioned = true;
        } else if (rng() < 0.1) {
          if (fsm.go("JUMP", now)) transitioned = true;
        } else if (fsm.go("IDLE", now)) transitioned = true;
        transitioned = true;
      } else if (timeInState > 8000) {
        if (fsm.go("IDLE", now)) transitioned = true;
      }
      maybeSpeak(ctx);
      break;
    }

    case "RUN": {
      const speed = RUN_SPEED * settings.speedScale;
      const dir = walkToward(body, instance.targetX, speed);
      if (dir !== 0) instance.facing = dir;
      const reached = Math.abs(body.x + body.width / 2 - instance.targetX) < 8;
      if (reached || timeInState > 3000) {
        if (fsm.go("IDLE", now)) transitioned = true;
      }
      break;
    }

    case "SIT": {
      body.vx = 0;
      if (timeInState > 5000 + rng() * 5000) {
        if (rng() < 0.2) {
          if (fsm.go("SLEEP", now)) transitioned = true;
        } else if (fsm.go("IDLE", now)) transitioned = true;
      }
      break;
    }

    case "SLEEP": {
      body.vx = 0;
      if (timeInState > 12000 + rng() * 8000) {
        if (fsm.go("WAKE", now)) transitioned = true;
      }
      break;
    }

    case "WAKE": {
      if (timeInState > 900) {
        if (fsm.go("IDLE", now)) transitioned = true;
      }
      break;
    }

    case "BLINK": {
      if (timeInState > 300) {
        if (fsm.go("IDLE", now)) transitioned = true;
      }
      break;
    }

    case "JUMP": {
      if (timeInState < 30) {
        jump(body, JUMP_VELOCITY * settings.speedScale);
      }
      if (!body.grounded) {
        if (fsm.go("FALL", now)) transitioned = true;
      }
      break;
    }

    case "FALL": {
      if (body.grounded) {
        if (fsm.go("LAND", now)) transitioned = true;
      }
      break;
    }

    case "LAND": {
      body.vx *= 0.7;
      if (timeInState > 400) {
        if (fsm.go("IDLE", now)) transitioned = true;
      }
      break;
    }

    case "CLIMB": {
      body.gravityEnabled = false;
      body.grounded = false;
      body.vx = 0;
      // Climb upward along the wall.
      body.vy = -CLIMB_SPEED * settings.speedScale;
      // Stick to the wall horizontally.
      if (instance.climbSide === "left") body.x = 0;
      else body.x = bounds.width - body.width;

      const atTop = body.y <= 2;
      if (atTop) {
        if (fsm.go("HANG", now)) transitioned = true;
      } else if (timeInState > 4000 + rng() * 4000) {
        // sometimes drop
        if (rng() < 0.4) {
          releaseFromWall(body);
          if (fsm.go("FALL", now)) transitioned = true;
        } else if (fsm.go("HANG", now)) transitioned = true;
      }
      maybeSpeak(ctx);
      break;
    }

    case "HANG": {
      body.gravityEnabled = false;
      body.grounded = false;
      body.vx = 0;
      body.vy = 0;
      body.y = 0;
      if (instance.climbSide === "left") body.x = 0;
      else body.x = bounds.width - body.width;
      if (timeInState > 3000 + rng() * 4000) {
        releaseFromWall(body);
        if (fsm.go("FALL", now)) transitioned = true;
      }
      break;
    }

    case "DANCE":
    case "WAVE":
    case "HAPPY":
    case "TALK":
    case "THINK":
    case "PET":
    case "INTERACT": {
      body.vx *= 0.8;
      const dur =
        fsm.state === "TALK" ? 4000 : fsm.state === "PET" ? 1500 : fsm.state === "DANCE" ? 3500 : 2000;
      if (timeInState > dur) {
        if (fsm.go("IDLE", now)) transitioned = true;
      }
      maybeSpeak(ctx);
      break;
    }

    case "SURPRISED": {
      body.vx *= 0.8;
      if (timeInState > 600) {
        if (fsm.go("IDLE", now)) transitioned = true;
      }
      break;
    }

    case "DRAGGED": {
      // Position is controlled directly by pointer; no physics here.
      body.gravityEnabled = false;
      body.vx = 0;
      body.vy = 0;
      break;
    }
  }

  // ---- Physics integration (skip when dragged; brain already set pos) ----
  if (fsm.state !== "DRAGGED") {
    // Apply effective gravity to the body via temp scale: we mutate gravity by
    // temporarily overriding using a local integrate-like step.
    if (body.gravityEnabled && !body.grounded) {
      body.vy = Math.min(body.vy + gravity * dt, TERMINAL_VELOCITY * settings.gravityScale);
      body.vx -= body.vx * 0.15 * dt;
    }
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    clampBody(body, bounds);
  }

  // ---- Sync instance.facing / anim when transitioned ----
  if (transitioned) {
    instance.previousState = fsm.previous;
    instance.state = fsm.state;
    instance.stateEnteredAt = now;
    instance.anim = char.stateMap[fsm.state] ?? "idle";
    // Choose a new walk target when entering WALK/RUN
    if (fsm.state === "WALK" || fsm.state === "RUN") {
      instance.targetX = 40 + rng() * Math.max(60, bounds.width - body.width - 80);
    }
  }

  return transitioned;
}

function clampBody(body: Body, bounds: WorldBounds): void {
  const maxX = Math.max(0, bounds.width - body.width);
  const floor = bounds.floorY - body.height;
  if (body.x < 0) {
    body.x = 0;
    if (body.vx < 0) body.vx = -body.vx * 0.45;
  } else if (body.x > maxX) {
    body.x = maxX;
    if (body.vx > 0) body.vx = -body.vx * 0.45;
  }
  if (body.y >= floor) {
    body.y = floor;
    if (body.vy > 0) {
      body.vy = -body.vy * 0.25;
      if (Math.abs(body.vy) < 40) body.vy = 0;
    }
    body.grounded = true;
    body.vx *= 0.82;
    if (Math.abs(body.vx) < 3) body.vx = 0;
  } else {
    body.grounded = false;
    if (body.y < 0) {
      body.y = 0;
      if (body.vy < 0) body.vy = 0;
    }
  }
}

/** Occasionally surface a speech bubble with a state/time-appropriate line. */
function maybeSpeak(ctx: BrainContext): void {
  const { instance, settings, now, rng } = ctx;
  if (!settings.speechEnabled) return;
  if (!shouldTalk(instance.affinity)) return;
  // Don't overwrite an active bubble.
  if (instance.speech && now < instance.speech.until) return;
  // ~6% chance per eligible tick to say something, throttled.
  if (rng() < 0.012) {
    const useGreeting = rng() < 0.4;
    const text = useGreeting
      ? randomFrom(GREETINGS[getDayPart()])
      : randomFrom(STATE_QUOTES[instance.state] ?? STATE_QUOTES.IDLE);
    instance.speech = { text, until: now + 4000 };
  }
}

/** External interaction triggers. */
export function interactPet(ctx: BrainContext, now: number): boolean {
  const { fsm, instance } = ctx;
  instance.affinity = Math.min(100, instance.affinity + 6);
  instance.speech = {
    text: randomFrom(STATE_QUOTES.PET),
    until: now + 2500,
  };
  fsm.force("PET", now);
  return true;
}

export function interactClick(ctx: BrainContext, now: number): boolean {
  const { fsm, instance } = ctx;
  instance.affinity = Math.min(100, instance.affinity + 2);
  // High affinity clicks -> happy; else wave.
  const next = instance.affinity > 60 ? "HAPPY" : "WAVE";
  if (fsm.canGo(next as CompanionState)) fsm.go(next as CompanionState, now);
  else fsm.force(next as CompanionState, now);
  return true;
}

export function interactTalk(ctx: BrainContext, now: number): boolean {
  const { fsm, instance } = ctx;
  instance.affinity = Math.min(100, instance.affinity + 3);
  instance.speech = {
    text: randomFrom(STATE_QUOTES.TALK),
    until: now + 4000,
  };
  fsm.force("TALK", now);
  return true;
}

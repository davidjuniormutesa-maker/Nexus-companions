// Lightweight 2D physics engine for desktop companions.
// Simulates gravity, surface interaction, and collisions with window borders.
// Pure logic — no DOM references. Deterministic and fixed-step friendly.

import type { Body, Surface, WorldBounds } from "./types";

export const GRAVITY = 2400; // px/s^2
export const TERMINAL_VELOCITY = 1800; // px/s
export const GROUND_FRICTION = 0.82; // velocity retained per second of ground contact
export const WALL_BOUNCE = 0.45; // restitution on horizontal walls
export const FLOOR_BOUNCE = 0.25;
export const AIR_DRAG = 0.15; // per second horizontal drag while airborne
export const CLIMB_SPEED = 90; // px/s when climbing walls
export const WALK_SPEED = 70; // px/s baseline
export const RUN_SPEED = 150; // px/s
export const JUMP_VELOCITY = -720; // px/s upward

export function makeBody(x = 0, y = 0, width = 96, height = 128): Body {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    width,
    height,
    grounded: true,
    gravityEnabled: true,
    surface: "floor",
  };
}

/**
 * Integrate one physics step.
 * Handles gravity, horizontal/vertical movement, and collisions with the
 * four window borders (floor, ceiling, left wall, right wall).
 */
export function integrate(b: Body, dt: number, bounds: WorldBounds): Body {
  if (!b.gravityEnabled) {
    // Climbing/hanging: no gravity, just move by velocity.
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    clampToBounds(b, bounds);
    return b;
  }

  // Gravity (only when airborne).
  if (!b.grounded) {
    b.vy = Math.min(b.vy + GRAVITY * dt, TERMINAL_VELOCITY);
    // mild air drag on horizontal velocity
    b.vx -= b.vx * AIR_DRAG * dt;
  }

  b.x += b.vx * dt;
  b.y += b.vy * dt;

  clampToBounds(b, bounds);
  return b;
}

function clampToBounds(b: Body, bounds: WorldBounds): void {
  const maxX = Math.max(0, bounds.width - b.width);
  const floor = bounds.floorY - b.height;

  b.surface = "none";

  // Left wall
  if (b.x <= 0) {
    b.x = 0;
    if (b.vx < 0) b.vx = -b.vx * WALL_BOUNCE;
    b.surface = "left";
  } else if (b.x >= maxX) {
    // Right wall
    b.x = maxX;
    if (b.vx > 0) b.vx = -b.vx * WALL_BOUNCE;
    b.surface = "right";
  }

  // Floor
  if (b.y >= floor) {
    b.y = floor;
    if (b.vy > 0) {
      b.vy = -b.vy * FLOOR_BOUNCE;
      if (Math.abs(b.vy) < 40) b.vy = 0;
    }
    b.grounded = true;
    b.vx *= Math.pow(GROUND_FRICTION, 1); // friction per step
    if (Math.abs(b.vx) < 3) b.vx = 0;
    b.surface = b.surface === "none" ? "floor" : b.surface;
  } else {
    b.grounded = false;
    // Ceiling
    if (b.y <= 0) {
      b.y = 0;
      if (b.vy < 0) b.vy = -b.vy * 0.3;
      b.surface = "ceiling";
    }
  }
}

/** Apply an upward jump impulse. */
export function jump(b: Body, velocity = JUMP_VELOCITY): void {
  if (b.grounded) {
    b.vy = velocity;
    b.grounded = false;
  }
}

/** Push body toward a target x; returns facing direction (-1|1|0). */
export function walkToward(b: Body, targetX: number, speed = WALK_SPEED): 1 | -1 | 0 {
  const cx = b.x + b.width / 2;
  if (Math.abs(targetX - cx) < 4) {
    b.vx = 0;
    return 0;
  }
  const dir = targetX > cx ? 1 : -1;
  b.vx = dir * speed;
  return dir;
}

/** Snap a body onto a wall surface for climbing. */
export function attachToWall(b: Body, side: "left" | "right", bounds: WorldBounds): void {
  b.gravityEnabled = false;
  b.grounded = false;
  b.vx = 0;
  b.vy = 0;
  if (side === "left") b.x = 0;
  else b.x = bounds.width - b.width;
  b.surface = side;
}

/** Release from a wall — resume gravity. */
export function releaseFromWall(b: Body): void {
  b.gravityEnabled = true;
  b.vx = (Math.random() - 0.5) * 60;
  b.vy = 0;
}

export function distance(a: Body, b: Body): number {
  const dx = a.x + a.width / 2 - (b.x + b.width / 2);
  const dy = a.y + a.height / 2 - (b.y + b.height / 2);
  return Math.hypot(dx, dy);
}

/** Detect the dominant surface a grounded/touching body is on. */
export function detectSurface(b: Body, bounds: WorldBounds): Surface {
  if (b.y >= bounds.floorY - b.height - 1) return "floor";
  if (b.x <= 1) return "left";
  if (b.x >= bounds.width - b.width - 1) return "right";
  if (b.y <= 1) return "ceiling";
  return "none";
}

// Affinity system: tracks how bonded the user is with a companion.
// Affinity rises through interaction (click, pet, drag-release) and slowly
// decays when neglected. Idle animations and behaviour change by tier.

export interface AffinityTier {
  level: "stranger" | "acquaintance" | "friend" | "close" | "soulmate";
  min: number;
  max: number;
  label: string;
  emoji: string;
}

export const AFFINITY_TIERS: AffinityTier[] = [
  { level: "stranger", min: 0, max: 20, label: "Stranger", emoji: "🌱" },
  { level: "acquaintance", min: 20, max: 40, label: "Acquaintance", emoji: "🙂" },
  { level: "friend", min: 40, max: 65, label: "Friend", emoji: "🤝" },
  { level: "close", min: 65, max: 85, label: "Close Companion", emoji: "💛" },
  { level: "soulmate", min: 85, max: 100, label: "Soulmate", emoji: "💞" },
];

export const AFFINITY_GAIN = {
  click: 2,
  pet: 6,
  dragRelease: 1,
  talk: 3,
  idleTick: 0.02, // per second of proximity
};

export const AFFINITY_DECAY = 0.01; // per second when neglected

export function clampAffinity(v: number): number {
  return Math.max(0, Math.min(100, v));
}

export function getTier(affinity: number): AffinityTier {
  return (
    AFFINITY_TIERS.find((t) => affinity >= t.min && affinity < t.max) ??
    AFFINITY_TIERS[AFFINITY_TIERS.length - 1]
  );
}

/** Returns the probability [0..1] of performing a "playful" idle action. */
export function playfulnessFromAffinity(affinity: number, base: number): number {
  // Higher affinity => more playful idle animations (dance/wave).
  const tierBoost = (getTier(affinity).min / 100) * 0.4;
  return Math.min(1, base + tierBoost);
}

/** Whether the companion should show speech bubbles (high affinity). */
export function shouldTalk(affinity: number): boolean {
  return affinity >= 45;
}

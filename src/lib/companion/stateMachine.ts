// Explicit finite state machine for companion animation/behaviour states.
// Transitions are declared as data so they can be validated and visualised.
// An illegal transition is refused rather than silently corrupting state.

import type { CompanionState } from "./types";

export const TRANSITIONS: Record<string, CompanionState[]> = {
  "*": ["DRAGGED", "FALL", "SURPRISED", "PET"],
  IDLE: [
    "WALK", "RUN", "SIT", "THINK", "WAVE", "DANCE", "JUMP", "HAPPY",
    "SLEEP", "CLIMB", "BLINK", "TALK", "INTERACT",
  ],
  WALK: ["IDLE", "RUN", "JUMP", "SIT", "CLIMB", "INTERACT"],
  RUN: ["IDLE", "WALK", "JUMP"],
  SIT: ["IDLE", "THINK", "SLEEP", "WAVE", "BLINK", "TALK"],
  SLEEP: ["IDLE", "WAKE", "SURPRISED"],
  WAKE: ["IDLE", "SIT"],
  THINK: ["IDLE", "TALK", "SIT", "BLINK"],
  WAVE: ["IDLE", "HAPPY", "TALK"],
  DANCE: ["IDLE", "HAPPY"],
  JUMP: ["FALL", "IDLE", "LAND"],
  FALL: ["LAND", "IDLE"],
  LAND: ["IDLE", "SIT"],
  CLIMB: ["HANG", "IDLE", "FALL"],
  HANG: ["IDLE", "FALL", "CLIMB"],
  BLINK: ["IDLE", "THINK"],
  TALK: ["IDLE", "THINK", "WAVE", "HAPPY"],
  SURPRISED: ["IDLE", "HAPPY"],
  HAPPY: ["IDLE", "DANCE", "WAVE", "TALK"],
  PET: ["IDLE", "HAPPY"],
  INTERACT: ["IDLE", "HAPPY", "TALK"],
  DRAGGED: ["FALL", "IDLE", "SURPRISED"],
};

export const ALL_STATES: CompanionState[] = (Object.keys(TRANSITIONS).filter(
  (s) => s !== "*",
) as CompanionState[]);

export class StateMachine {
  state: CompanionState;
  previous: CompanionState;
  enteredAt: number;
  private onChange?: (from: CompanionState, to: CompanionState) => void;

  constructor(initial: CompanionState = "IDLE", onChange?: (f: CompanionState, t: CompanionState) => void) {
    this.state = initial;
    this.previous = initial;
    this.enteredAt = 0;
    this.onChange = onChange;
  }

  canGo(to: CompanionState): boolean {
    if (to === this.state) return true;
    const wild = TRANSITIONS["*"] ?? [];
    if ((wild as CompanionState[]).includes(to)) return true;
    const set = TRANSITIONS[this.state] ?? [];
    return (set as CompanionState[]).includes(to);
  }

  go(to: CompanionState, now = 0): boolean {
    if (to === this.state) return false;
    if (!this.canGo(to)) return false;
    this.previous = this.state;
    this.state = to;
    this.enteredAt = now;
    this.onChange?.(this.previous, to);
    return true;
  }

  /** Force a transition regardless of the table (used for interrupts). */
  force(to: CompanionState, now = 0): void {
    this.previous = this.state;
    this.state = to;
    this.enteredAt = now;
    this.onChange?.(this.previous, to);
  }
}

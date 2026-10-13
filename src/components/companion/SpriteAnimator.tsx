"use client";

import { useEffect, useRef } from "react";
import type { CharacterDef } from "@/lib/companion/types";
import { spriteUrl } from "@/lib/companion/characters";

interface SpriteAnimatorProps {
  character: CharacterDef;
  anim: string;
  facing: 1 | -1;
  scale?: number;
  paused?: boolean;
}

/**
 * Renders a sprite-sheet-style animation by cycling <img> sources per frame.
 * Uses a local rAF loop so frame cycling never triggers React re-renders.
 * Images are preloaded so playback is smooth after the first cycle.
 */
export function SpriteAnimator({
  character,
  anim,
  facing,
  scale = 1,
  paused = false,
}: SpriteAnimatorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef(0);
  const animRef = useRef(anim);
  const pausedRef = useRef(paused);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumRef = useRef<number>(0);

  // Keep refs in sync with latest props without restarting the loop.
  useEffect(() => {
    animRef.current = anim;
    pausedRef.current = paused;
  }, [anim, paused]);

  // Preload all frames of the current animation for buttery playback.
  useEffect(() => {
    const def = character.animations[anim];
    if (!def) return;
    for (let i = 0; i < def.frames; i++) {
      const img = new Image();
      img.src = spriteUrl(character, anim, i);
    }
  }, [character, anim]);

  useEffect(() => {
    const [w, h] = character.spriteSize;
    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!lastTimeRef.current) lastTimeRef.current = t;
      const dt = t - lastTimeRef.current;
      lastTimeRef.current = t;
      if (pausedRef.current) {
        accumRef.current = 0;
        return;
      }
      const def = character.animations[animRef.current];
      if (!def) return;
      const frameDur = 1000 / def.fps;
      accumRef.current += dt;
      let steps = 0;
      while (accumRef.current >= frameDur && steps < 8) {
        accumRef.current -= frameDur;
        frameRef.current += 1;
        steps++;
        if (frameRef.current >= def.frames) {
          frameRef.current = def.loop ? 0 : def.frames - 1;
        }
      }
      if (steps > 0 && imgRef.current) {
        imgRef.current.src = spriteUrl(character, animRef.current, frameRef.current);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [character]);

  const [w, h] = character.spriteSize;
  return (
    <div
      className="select-none pointer-events-none"
      style={{
        width: w * scale,
        height: h * scale,
        transform: facing === -1 ? "scaleX(-1)" : "scaleX(1)",
      }}
    >
      <img
        ref={imgRef}
        src={spriteUrl(character, anim, 0)}
        alt={character.name}
        draggable={false}
        width={w * scale}
        height={h * scale}
        style={{
          imageRendering: "auto",
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))",
        }}
      />
    </div>
  );
}

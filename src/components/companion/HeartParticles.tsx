"use client";

import { useEffect, useRef } from "react";
import type { HeartParticle } from "@/lib/companion/types";
import { nextParticleId } from "@/lib/store/companionStore";

interface HeartParticlesProps {
  /** bump this token to fire a burst */
  trigger: number;
  accent: string;
}

const KINDS: HeartParticle["kind"][] = ["heart", "sparkle", "note"];

/**
 * Floating heart + sparkle particle burst. Fires whenever `trigger` changes.
 * Self-contained rAF animation — no React re-renders during the burst.
 */
export function HeartParticles({ trigger, accent }: HeartParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<HeartParticle[]>([]);
  const rafRef = useRef<number>(0);
  const accentRef = useRef(accent);
  const lastTimeRef = useRef<number>(0);
  const runningRef = useRef(false);
  const stepRef = useRef<(t: number) => void>(() => {});

  useEffect(() => {
    accentRef.current = accent;
  }, [accent]);

  // Set up the render loop once on mount. Reads from refs so it never restarts.
  useEffect(() => {
    function step(t: number) {
      const canvas = canvasRef.current;
      if (!canvas) {
        runningRef.current = false;
        rafRef.current = 0;
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        runningRef.current = false;
        rafRef.current = 0;
        return;
      }
      if (!canvas.width) {
        canvas.width = 160;
        canvas.height = 160;
      }
      const last = lastTimeRef.current || t;
      const dt = t - last;
      lastTimeRef.current = t;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ps = particlesRef.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life += dt;
        if (p.life > p.maxLife) {
          ps.splice(i, 1);
          continue;
        }
        p.vy += 180 * (dt / 1000);
        p.x += (p.vx * dt) / 1000;
        p.y += (p.vy * dt) / 1000;
        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.translate(canvas.width / 2 + p.x, canvas.height / 2 + p.y);
        drawGlyph(ctx, p.kind, p.size, accentRef.current);
        ctx.restore();
      }
      if (ps.length === 0) {
        runningRef.current = false;
        rafRef.current = 0;
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    }

    // expose step to the trigger effect via a ref on the function
    stepRef.current = step;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      runningRef.current = false;
    };
  }, []);

  // Spawn a burst when trigger changes (skip the initial 0).
  useEffect(() => {
    if (trigger === 0) return;
    const count = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      const speed = 60 + Math.random() * 120;
      particlesRef.current.push({
        id: nextParticleId(),
        x: 0,
        y: -20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 900 + Math.random() * 500,
        size: 12 + Math.random() * 10,
        kind: KINDS[Math.floor(Math.random() * KINDS.length)],
      });
    }
    // Start the loop if it isn't already running.
    if (!runningRef.current) {
      runningRef.current = true;
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame((t) => stepRef.current(t));
    }
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={160}
      className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
      style={{ width: 160, height: 160 }}
    />
  );
}

function drawGlyph(
  ctx: CanvasRenderingContext2D,
  kind: HeartParticle["kind"],
  size: number,
  color: string,
) {
  if (kind === "sparkle") {
    ctx.fillStyle = "#fde68a";
    drawStar(ctx, 0, 0, size, size * 0.4, 4);
    ctx.fill();
    return;
  }
  if (kind === "note") {
    ctx.fillStyle = color;
    ctx.font = `${size}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("♪", 0, 0);
    return;
  }
  // heart
  ctx.fillStyle = "#fb7185";
  ctx.beginPath();
  const s = size / 2;
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(0, -s * 0.1, -s, -s * 0.1, -s, s * 0.25);
  ctx.bezierCurveTo(-s, s * 0.6, 0, s * 0.85, 0, s);
  ctx.bezierCurveTo(0, s * 0.85, s, s * 0.6, s, s * 0.25);
  ctx.bezierCurveTo(s, -s * 0.1, 0, -s * 0.1, 0, s * 0.35);
  ctx.fill();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  points: number,
) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

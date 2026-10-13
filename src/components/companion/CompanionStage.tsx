"use client";

import { useEffect, useRef } from "react";
import { useCompanionStore } from "@/lib/store/companionStore";
import { Companion } from "./Companion";
import { ControlDock } from "@/components/panels/ControlDock";
import { TopBar } from "@/components/panels/TopBar";
import { PanelsRouter } from "@/components/panels/PanelsRouter";

/**
 * The desktop stage: a full-viewport "desktop" where companions roam.
 * Owns the master rAF loop that ticks the engine for every companion and
 * syncs logical state into the store. Position updates go directly to the DOM.
 */
export function CompanionStage() {
  const companions = useCompanionStore((s) => s.companions);
  const tick = useCompanionStore((s) => s.tick);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const boundsRef = useRef({ width: 1280, height: 720, floorY: 720 });

  useEffect(() => {
    const measure = () => {
      boundsRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
        floorY: window.innerHeight,
      };
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!lastRef.current) lastRef.current = t;
      let dt = (t - lastRef.current) / 1000;
      lastRef.current = t;
      // clamp dt to avoid huge jumps when tab was inactive
      if (dt > 0.05) dt = 0.05;
      tick(dt, boundsRef.current, t);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  const ids = Object.keys(companions);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Wallpaper background */}
      <DesktopWallpaper />

      {/* Top status bar */}
      <TopBar />

      {/* Companions */}
      {ids.map((id) => (
        <Companion key={id} id={id} />
      ))}

      {/* Bottom control dock */}
      <ControlDock />

      {/* Modal panels (creator / repository / settings / roster) */}
      <PanelsRouter />
    </div>
  );
}

function DesktopWallpaper() {
  return (
    <div className="absolute inset-0 -z-10">
      {/* gradient sky */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#1a1033_0%,#2d1b4e_35%,#4a2c6d_65%,#7c3aed22_100%)]" />
      {/* aurora blobs */}
      <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full bg-fuchsia-500/20 blur-3xl animate-pulse-slow" />
      <div className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] rounded-full bg-cyan-400/15 blur-3xl animate-pulse-slower" />
      <div className="absolute bottom-0 left-1/4 w-[30rem] h-[30rem] rounded-full bg-violet-500/15 blur-3xl animate-pulse-slow" />
      {/* stars */}
      <Stars />
      {/* floor line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
}

function Stars() {
  const stars = useRef(
    Array.from({ length: 60 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 70,
      s: Math.random() * 2 + 0.5,
      d: Math.random() * 4 + 2,
      delay: Math.random() * 4,
    })),
  ).current;
  return (
    <div className="absolute inset-0">
      {stars.map((st, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.s,
            height: st.s,
            opacity: 0.6,
            animation: `twinkle ${st.d}s ease-in-out ${st.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

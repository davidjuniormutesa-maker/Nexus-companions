"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useCompanionStore } from "@/lib/store/companionStore";
import { getCharacterById } from "@/lib/companion/characters";
import { getTier } from "@/lib/companion/affinity";
import { SpriteAnimator } from "./SpriteAnimator";
import { SpeechBubble } from "./SpeechBubble";
import { HeartParticles } from "./HeartParticles";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Heart, MessageCircle, Sparkles, X, Hand } from "lucide-react";

interface CompanionProps {
  id: string;
}

export function Companion({ id }: CompanionProps) {
  const inst = useCompanionStore((s) => s.companions[id]);
  const customChars = useCompanionStore((s) => s.customCharacters);
  const installedPets = useCompanionStore((s) => s.installedPets);
  const heartToken = useCompanionStore((s) => s.heartBursts[id] ?? 0);
  const registerDom = useCompanionStore((s) => s.registerDom);
  const startDrag = useCompanionStore((s) => s.startDrag);
  const dragTo = useCompanionStore((s) => s.dragTo);
  const endDrag = useCompanionStore((s) => s.endDrag);
  const pet = useCompanionStore((s) => s.pet);
  const click = useCompanionStore((s) => s.click);
  const talk = useCompanionStore((s) => s.talk);
  const dismiss = useCompanionStore((s) => s.dismiss);
  const select = useCompanionStore((s) => s.select);
  const fetchAiQuote = useCompanionStore((s) => s.fetchAiQuote);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    dragging: boolean;
    started: boolean;
    startX: number;
    startY: number;
    startTime: number;
  }>({
    dragging: false,
    started: false,
    startX: 0,
    startY: 0,
    startTime: 0,
  });
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);

  const character = inst
    ? getCharacterById(inst.characterId, [...customChars, ...installedPets])
    : undefined;

  // Register DOM node for direct transform manipulation by the engine.
  useEffect(() => {
    registerDom(id, containerRef.current);
    return () => registerDom(id, null);
  }, [id, registerDom]);

  // Keep selection in sync with store.
  const selectedId = useCompanionStore((s) => s.selectedId);
  useEffect(() => {
    setSelected(selectedId === id);
  }, [selectedId, id]);

  if (!inst || !character) return null;

  const tier = getTier(inst.affinity);
  const accent = character.theme.accent;
  const speechActive = !!inst.speech && performance.now() < inst.speech.until;

  const DRAG_THRESHOLD = 6; // px before a press becomes a drag

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      dragging: false,
      started: false,
      startX: e.clientX,
      startY: e.clientY,
      startTime: performance.now(),
    };
    select(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const st = dragStateRef.current;
    if (!st.started) {
      // Haven't started dragging yet — check threshold.
      if (st.dragging) return;
      const dx = e.clientX - st.startX;
      const dy = e.clientY - st.startY;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      // crossed threshold -> begin drag
      st.dragging = true;
      st.started = true;
      startDrag(id, e.clientX, e.clientY);
      return;
    }
    dragTo(id, e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const st = dragStateRef.current;
    if (!st.started) {
      // This was a click (press + release without crossing threshold) -> interact.
      const elapsed = performance.now() - st.startTime;
      if (elapsed < 600) {
        click(id);
      }
      st.dragging = false;
      st.started = false;
      return;
    }
    st.dragging = false;
    st.started = false;
    const bounds = {
      width: window.innerWidth,
      height: window.innerHeight,
      floorY: window.innerHeight,
    };
    endDrag(id, bounds);
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-0 left-0 will-change-transform"
      style={{ width: character.spriteSize[0], height: character.spriteSize[1], zIndex: 20 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="relative cursor-grab active:cursor-grabbing" style={{ width: character.spriteSize[0], height: character.spriteSize[1] }}>
            {/* selection ring */}
            {selected && (
              <motion.div
                layoutId={`ring-${id}`}
                className="absolute inset-0 rounded-2xl"
                style={{
                  boxShadow: `0 0 0 2px ${accent}, 0 0 22px ${accent}88`,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* hover halo */}
            {hovered && !selected && (
              <div
                className="absolute inset-0 rounded-2xl transition-opacity"
                style={{ boxShadow: `0 0 18px ${accent}55`, pointerEvents: "none" }}
              />
            )}

            {/* heart particles */}
            <HeartParticles trigger={heartToken} accent={accent} />

            {/* speech bubble */}
            <SpeechBubble text={inst.speech?.text} show={speechActive} accent={accent} />

            {/* sprite */}
            <SpriteAnimator
              character={character}
              anim={inst.anim}
              facing={inst.facing}
              paused={inst.state === "DRAGGED" ? false : false}
            />

            {/* affinity badge */}
            <AffinityBadge affinity={inst.affinity} emoji={tier.emoji} accent={accent} name={character.name} />

            {/* drag handle hint */}
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium px-2 py-0.5 rounded-full text-white/90 bg-black/40 backdrop-blur-sm whitespace-nowrap pointer-events-none"
              >
                drag · pet · right-click
              </motion.div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => pet(id)}>
            <Heart className="mr-2 h-4 w-4 text-rose-500" /> Pet (+affinity)
          </ContextMenuItem>
          <ContextMenuItem onClick={() => click(id)}>
            <Sparkles className="mr-2 h-4 w-4 text-amber-500" /> Interact
          </ContextMenuItem>
          <ContextMenuItem onClick={() => talk(id)}>
            <MessageCircle className="mr-2 h-4 w-4 text-sky-500" /> Talk
          </ContextMenuItem>
          <ContextMenuItem onClick={() => fetchAiQuote(id)}>
            <Sparkles className="mr-2 h-4 w-4 text-violet-500" /> AI quote
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => dismiss(id)} className="text-rose-600 focus:text-rose-700">
            <X className="mr-2 h-4 w-4" /> Dismiss
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

function AffinityBadge({
  affinity,
  emoji,
  accent,
  name,
}: {
  affinity: number;
  emoji: string;
  accent: string;
  name: string;
}) {
  return (
    <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center gap-0.5 pointer-events-none">
      <div
        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-md backdrop-blur-md"
        style={{ background: `${accent}d9` }}
      >
        <span>{emoji}</span>
        <span>{Math.round(affinity)}</span>
      </div>
      <div className="text-[9px] font-medium text-white/80 bg-black/30 backdrop-blur-sm rounded-full px-1.5 py-px">
        {name}
      </div>
    </div>
  );
}

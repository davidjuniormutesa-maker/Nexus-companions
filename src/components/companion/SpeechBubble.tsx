"use client";

import { AnimatePresence, motion } from "framer-motion";

interface SpeechBubbleProps {
  text: string | undefined;
  show: boolean;
  accent: string;
}

export function SpeechBubble({ text, show, accent }: SpeechBubbleProps) {
  return (
    <AnimatePresence>
      {show && text ? (
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 8, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
          className="absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full z-30"
          style={{ pointerEvents: "none" }}
        >
          <div className="relative">
            <div
              className="max-w-[220px] min-w-[80px] rounded-2xl px-3.5 py-2 text-[13px] font-medium leading-snug text-white shadow-xl backdrop-blur-md whitespace-normal text-center"
              style={{
                background: `linear-gradient(135deg, ${accent}f0, ${accent}cc)`,
                boxShadow: `0 8px 24px -6px ${accent}80, 0 0 0 1px rgba(255,255,255,0.18) inset`,
              }}
            >
              {text}
            </div>
            {/* tail */}
            <div
              className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 rotate-45"
              style={{ background: `${accent}cc` }}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

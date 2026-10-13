"use client";

import { create } from "zustand";

export type PanelKind = "roster" | "creator" | "repository" | "settings" | null;

interface UIState {
  openPanel: PanelKind;
  openPanelId: (p: PanelKind) => void;
  togglePanel: (p: NonNullable<PanelKind>) => void;
  closePanel: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  openPanel: null,
  openPanelId: (p) => set({ openPanel: p }),
  togglePanel: (p) =>
    set({ openPanel: get().openPanel === p ? null : p }),
  closePanel: () => set({ openPanel: null }),
}));

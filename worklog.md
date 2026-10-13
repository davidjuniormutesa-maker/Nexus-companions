# NEXUS Companions — Worklog

## Project: Web-based desktop companion (Next.js 16) inspired by Shimeji + NEXUS engine

### Architecture overview
- **Engine** (`src/lib/companion/`): pure-logic physics, FSM, behaviour brain, affinity, quotes, character roster.
- **Store** (`src/lib/store/`): Zustand stores. Companion store keeps logical state in React; physics bodies live in a module-level Map and are applied to the DOM directly each frame (no 60fps re-renders).
- **UI** (`src/components/companion/`, `src/components/panels/`): full-viewport desktop stage, sprite animator with local rAF, speech bubbles, heart particles, control dock, roster/creator/repository/settings panels.
- **API** (`src/app/api/`): characters, custom characters, pet repository, quotes, AI-generated quotes (LLM skill).
- **DB** (Prisma + SQLite): persisted custom characters + repository pets.

### Character assets
- 5 built-in characters copied to `/public/characters/{astra,nyx,kuro,naruto,dabi}`.
- astra/nyx/kuro/naruto: 96×128, `anim_NN.png`, 16 anims.
- dabi: 192×192, `anim_NNNN.png`, 20 anims (extra attack/defend/hurt/blue_flame).

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Explore uploaded files, set up project foundation, build core engine + main UI shell.

Work Log:
- Extracted shimeji source, NEXUS core, and NEXUS character asset zips.
- Copied 5 character sprite packs into /public/characters.
- Built engine: types.ts, characters.ts, quotes.ts, physics.ts, stateMachine.ts, affinity.ts, engine.ts (behaviour brain).
- Built companionStore.ts (Zustand) with direct-DOM physics for 60fps smoothness.
- Built SpriteAnimator (local rAF frame cycling), SpeechBubble, HeartParticles (canvas), Companion (drag + context menu), CompanionStage (master rAF loop + wallpaper).
- Built TopBar, ControlDock, PanelsRouter, RosterPanel, SettingsPanel.

Stage Summary:
- Core engine + main desktop UI shell complete and wired.
- Next: Prisma schema + API routes, CharacterCreator + PetRepository panels, main page assembly, agent-browser verification, zip packaging, cron job.

---
Task ID: 2
Agent: main (Z.ai Code)
Task: Build API routes + Prisma schema, CharacterCreator + PetRepository panels, verify with agent-browser, package as zip, create cron job.

Work Log:
- Wrote Prisma schema (CustomCharacter + RepositoryPet models), pushed to SQLite.
- Built API routes: /api/characters, /api/characters/custom (GET/POST), /api/repository (GET/POST with seed), /api/repository/[id] (GET/POST install), /api/quotes, /api/generate-quote (LLM via z-ai-web-dev-sdk).
- Built CharacterCreator panel: name/description/universe inputs, base-sprite picker, accent color picker, emoji picker, 5 personality sliders, live animated preview, save-to-roster + spawn-now.
- Built PetRepository panel: debounced search, sort dropdown (popular/rating/new), 6 seeded community pets, install + spawn, upload form.
- Fixed click-vs-drag UX: single click triggers interact (affinity + heart particles); drag only starts after 6px threshold.
- Fixed all lint errors (ref-during-render, setState-in-effect, hoisting issues in HeartParticles).
- Agent-browser verification: page loads, companions spawn + animate, physics (gravity/wall-collision/fling) works, drag works, click→affinity+heart-particles works, roster/repository/creator/settings panels all render and function, install flows work end-to-end. 0 console errors.

Stage Summary:
- Full desktop companion app complete and browser-verified.
- Features delivered: physics engine (gravity, surface interaction, border collisions), mouse drag with physics pause + fling release, affinity system with tiered idle animations, walking/running/climbing/hanging states, heart+sparkle+note particle feedback, speech bubbles with time-based greetings + state quotes + AI-generated quotes, custom character creator, community pet repository with install, engine settings panel.
- Performance: direct-DOM transforms for 60fps position updates, local-rAF sprite cycling, no React re-renders during physics. Smooth across viewport sizes.
- Next: package zip, schedule webDevReview cron.

---
Task ID: 3
Agent: main (Z.ai Code) — webDevReview cron round 1
Task: Add ability to download the project ZIP from the running app (user request).

Work Log:
- Created reusable `scripts/build-zip.sh` that zips the project (excluding node_modules/.next/upload/etc.) into `public/nexus-companions.zip`.
- Built the zip into public/ (24M, valid archive).
- Added a prominent emerald "Download ZIP" button to the TopBar with 3 states (idle / packing / done) + tooltip + toast.
- Created `/api/download` route (GET + POST): POST rebuilds the zip fresh then streams it back with proper Content-Disposition headers; GET streams the existing zip.
- Clicking the button triggers POST /api/download → blob download as `nexus-companions.zip`, with a toast confirming success and a fallback to the static /public zip if the build fails.
- Verified: GET returns HTTP 200 / 24.7MB / application/zip; POST returns HTTP 200 / 24.7MB; `unzip -t` confirms valid archive with no errors; browser click triggers the download (visible as `POST /api/download 200 in 3.7s` in dev log); 0 console errors; lint clean.

Stage Summary:
- The whole project can now be downloaded as a ZIP directly from the preview panel via the green "Download ZIP" button in the top-right TopBar. The zip is rebuilt fresh on each click so it always reflects the latest source.
- Also available at the static path `/nexus-companions.zip` and via `GET /api/download`.

import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { GREETINGS, STATE_QUOTES, getDayPart, randomFrom } from "@/lib/companion/quotes";

export const dynamic = "force-dynamic";

const STATE_FLAVOR: Record<string, string> = {
  IDLE: "standing around idly on the desktop",
  WALK: "taking a little walk along the taskbar",
  RUN: "sprinting excitedly",
  FALL: "falling through the air after a jump",
  SIT: "sitting down for a rest",
  SLEEP: "dozing off",
  CLIMB: "climbing up the side of the screen",
  HANG: "hanging from the top of the screen",
  DRAGGED: "being dragged around by the cursor",
  DANCE: "dancing happily",
  HAPPY: "feeling warm and happy",
  WAVE: "waving at the user",
  TALK: "wanting to chat",
  THINK: "deep in thought",
  PET: "being patted lovingly",
};

export async function POST(req: NextRequest) {
  const { state, affinity } = (await req.json()) ?? {};
  const dayPart = getDayPart();
  const stateFlavor = STATE_FLAVOR[state as string] ?? "hanging out on the desktop";
  const tier =
    affinity >= 85 ? "a soulmate-level bond with" :
    affinity >= 65 ? "a close friendship with" :
    affinity >= 40 ? "a friendly bond with" :
    "a new acquaintance with";

  const systemPrompt =
    "You are the inner voice of an adorable anime desktop companion. " +
    "Write ONE short in-character line (max 14 words, often fewer) the companion would say right now. " +
    "It must be playful, wholesome, optionally anime-flavored, and may include a single emoji. " +
    "No quotes, no explanation, just the line.";

  const userPrompt =
    `Context: the companion is currently ${stateFlavor}. ` +
    `Time of day: ${dayPart}. Bond with user: ${tier} the user. ` +
    `Write the line now.`;

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
    });
    const quote = completion.choices[0]?.message?.content?.trim();
    if (quote && quote.length > 0 && quote.length < 160) {
      return NextResponse.json({ quote });
    }
    // fall through to local fallback
  } catch (e) {
    // ignore and use fallback
  }

  const fallback =
    Math.random() < 0.5
      ? randomFrom(GREETINGS[dayPart])
      : randomFrom(STATE_QUOTES[state as string] ?? STATE_QUOTES.IDLE);
  return NextResponse.json({ quote: fallback });
}

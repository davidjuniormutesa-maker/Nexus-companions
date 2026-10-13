import { NextResponse } from "next/server";
import { ANIME_QUOTES, GREETINGS, STATE_QUOTES, getDayPart } from "@/lib/companion/quotes";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    dayPart: getDayPart(),
    greetings: GREETINGS[getDayPart()],
    stateQuotes: STATE_QUOTES,
    animeQuotes: ANIME_QUOTES,
  });
}

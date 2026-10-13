import { NextResponse } from "next/server";
import { BUILTIN_CHARACTERS } from "@/lib/companion/characters";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ characters: BUILTIN_CHARACTERS });
}

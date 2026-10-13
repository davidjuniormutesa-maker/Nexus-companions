import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const PROJECT_ROOT = process.cwd();
const ZIP_PATH = path.join(PROJECT_ROOT, "public", "nexus-companions.zip");
const BUILD_SCRIPT = path.join(PROJECT_ROOT, "scripts", "build-zip.sh");

export async function POST() {
  try {
    // Rebuild the zip fresh so it always reflects the latest source.
    execSync(`bash "${BUILD_SCRIPT}"`, {
      cwd: PROJECT_ROOT,
      timeout: 60_000,
      stdio: "ignore",
    });
  } catch {
    // If the rebuild fails, fall back to whatever zip already exists.
  }

  if (!existsSync(ZIP_PATH)) {
    return NextResponse.json({ error: "zip not available" }, { status: 500 });
  }

  const data = readFileSync(ZIP_PATH);
  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="nexus-companions.zip"',
      "Content-Length": String(data.length),
      "Cache-Control": "no-store",
    },
  });
}

// Also allow a simple GET (e.g. right-click save) that streams the current zip.
export async function GET() {
  if (!existsSync(ZIP_PATH)) {
    return NextResponse.json({ error: "zip not built yet" }, { status: 404 });
  }
  const data = readFileSync(ZIP_PATH);
  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="nexus-companions.zip"',
      "Content-Length": String(data.length),
      "Cache-Control": "no-store",
    },
  });
}

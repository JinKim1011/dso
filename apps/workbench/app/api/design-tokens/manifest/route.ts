import fs from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { ok: false, error: "not found" },
      {
        status: 404,
      },
    );
  }

  try {
    const body = await req.json();
    const manifest = body?.manifest;
    if (manifest === undefined) {
      return NextResponse.json({ ok: false, error: "missing manifest" }, { status: 400 });
    }

    if (!Array.isArray(manifest)) {
      return NextResponse.json({ ok: false, error: "invalid manifest" }, { status: 400 });
    }

    const repoRoot = path.join(__dirname, "../../../../..");
    const defaultPath = path.join(repoRoot, "design-tokens-manifest.json");
    const rawPath = process.env.DSO_MANIFEST_PATH;
    const filePath = rawPath
      ? path.isAbsolute(rawPath)
        ? rawPath
        : path.join(repoRoot, rawPath)
      : defaultPath;

    const nextContent = JSON.stringify(manifest, null, 2);

    try {
      const currentContent = await fs.readFile(filePath, "utf-8");
      if (currentContent !== nextContent) {
        await fs.writeFile(filePath, nextContent, "utf-8");
      }
    } catch {
      await fs.writeFile(filePath, nextContent, "utf-8");
    }

    return NextResponse.json({ ok: true, manifest });
  } catch (err) {
    console.error("Failed to write manifest:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

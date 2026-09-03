import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, lang = "ja" } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const audioBuffer = await generateTtsBuffer(text, lang);
    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error: any) {
    console.error("TTS generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate TTS" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const text = req.nextUrl.searchParams.get("text");
    const lang = req.nextUrl.searchParams.get("lang") || "ja";

    if (!text) {
      return NextResponse.json({ error: "Missing text parameter" }, { status: 400 });
    }

    const audioBuffer = await generateTtsBuffer(text, lang);
    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error: any) {
    console.error("TTS GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate TTS" },
      { status: 500 }
    );
  }
}

async function generateTtsBuffer(rawText: string, lang: string): Promise<Buffer> {
  const clean = rawText.replace(/<[^>]+>/g, "").trim();
  const sentences = clean.split(/([。\n！？\.\!\?]+)/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    if ((current + s).length > 150 && current.length > 0) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    if (!chunk) continue;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });
    if (!res.ok) {
      throw new Error(`Google TTS request failed with status ${res.status}`);
    }
    const ab = await res.arrayBuffer();
    buffers.push(Buffer.from(ab));
  }

  return Buffer.concat(buffers);
}

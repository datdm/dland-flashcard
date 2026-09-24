import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { strokes, width = 300, height = 300 } = body;

    if (!strokes || !Array.isArray(strokes) || strokes.length === 0) {
      return NextResponse.json({ candidates: [] });
    }

    // Convert strokes to Google Input Tools ink format:
    // ink: [ [ [x1, x2, ...], [y1, y2, ...] ], [ [x1, x2, ...], [y1, y2, ...] ] ]
    const formattedInk = strokes.map((stroke: { x: number[]; y: number[] }) => [
      stroke.x,
      stroke.y,
    ]);

    const googlePayload = {
      app_version: 0.4,
      api_level: "537.36",
      device: "5.0 (Windows NT 10.0; Win64; x64)",
      input_type: 0,
      options: "enable_homophone_converter",
      requests: [
        {
          writer_ids: ["kr/ne1"],
          ink: formattedInk,
          language: "ja",
          max_num_results: 15,
          width,
          height,
        },
      ],
    };

    const googleUrl = "https://inputtools.google.com/request?itc=ja-t-i0-handwriting&app=mobilesearch";
    const res = await fetch(googleUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googlePayload),
    });

    if (!res.ok) {
      throw new Error(`Google API error: ${res.status}`);
    }

    const data = await res.json();
    // Google Input Tools Response structure:
    // ["SUCCESS", [[0, ["漢字1", "漢字2", ...], [], {"result_type": "handwriting"}]]]
    if (
      Array.isArray(data) &&
      data[0] === "SUCCESS" &&
      Array.isArray(data[1]) &&
      data[1][0] &&
      Array.isArray(data[1][0][1])
    ) {
      const candidates: string[] = data[1][0][1];
      return NextResponse.json({ candidates });
    }

    return NextResponse.json({ candidates: [] });
  } catch (error) {
    console.error("Handwriting API error:", error);
    return NextResponse.json({ candidates: [], error: "Failed to recognize handwriting" }, { status: 500 });
  }
}

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
      options: "enable_pre_space",
      requests: [
        {
          writing_guide: {
            writing_area_width: width,
            writing_area_height: height,
          },
          ink: formattedInk,
          language: "ja",
          max_num_results: 15,
        },
      ],
    };

    const googleEndpoints = [
      "https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8",
      "https://www.google.com/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8",
      "https://www.google.com.tw/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8",
    ];

    let lastError: any = null;

    for (const endpoint of googleEndpoints) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          body: JSON.stringify(googlePayload),
          signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) continue;

        const data = await res.json();
        // Google Input Tools Response structure:
        // ["SUCCESS", [["hash", ["漢字1", "漢字2", ...], [], {"is_html_escaped": false}]]]
        if (
          Array.isArray(data) &&
          data[0] === "SUCCESS" &&
          Array.isArray(data[1]) &&
          data[1][0] &&
          Array.isArray(data[1][0][1])
        ) {
          const rawCandidates: any[] = data[1][0][1];
          const candidates: string[] = rawCandidates.filter(
            (c) => typeof c === "string" && c.trim().length > 0
          );
          return NextResponse.json({ candidates });
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (lastError) {
      console.warn("Handwriting endpoints failed:", lastError);
    }

    return NextResponse.json({ candidates: [] });
  } catch (error) {
    console.error("Handwriting API error:", error);
    return NextResponse.json({ candidates: [], error: "Failed to recognize handwriting" }, { status: 500 });
  }
}

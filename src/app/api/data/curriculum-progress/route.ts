import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const vocabId = body.vocabId || body.lessonId;

    if (!vocabId) {
      return NextResponse.json({ error: "Missing vocabId or lessonId" }, { status: 400 });
    }

    // Proxy to backend API
    const response = await fetch(`${API_URL}/api/data/progress/${vocabId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Curriculum progress save error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save progress" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Proxy to backend API
    const response = await fetch(`${API_URL}/api/data/progress`, {
      headers: {
        "Authorization": authHeader,
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Curriculum progress fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import pool from "@/server/src/db";
import { verifyToken } from "@/server/src/middleware";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = verifyToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { vocabId, lessonId, learned, learnedAt, favorite, type = "vocab" } = await req.json();

    if (!vocabId && !lessonId) {
      return NextResponse.json({ error: "Missing vocabId or lessonId" }, { status: 400 });
    }

    // Save to database
    const query = `
      INSERT INTO curriculum_progress (user_id, vocab_id, lesson_id, type, learned, learned_at, favorite, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id, vocab_id, lesson_id, type) 
      DO UPDATE SET 
        learned = COALESCE($5, curriculum_progress.learned),
        learned_at = COALESCE($6, curriculum_progress.learned_at),
        favorite = COALESCE($7, curriculum_progress.favorite),
        updated_at = NOW()
      RETURNING *;
    `;

    const result = await pool.query(query, [
      userId,
      vocabId || null,
      lessonId || null,
      type,
      learned !== undefined ? learned : null,
      learnedAt || null,
      favorite !== undefined ? favorite : null,
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
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
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = verifyToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const query = `
      SELECT * FROM curriculum_progress 
      WHERE user_id = $1 
      ORDER BY updated_at DESC 
      LIMIT 10000;
    `;

    const result = await pool.query(query, [userId]);

    // Convert to object format { "vocab-id": { learned: true, ... } }
    const progressMap: Record<string, any> = {};
    result.rows.forEach((row) => {
      const key = row.vocab_id || row.lesson_id;
      if (key) {
        progressMap[key] = {
          learned: row.learned || false,
          learnedAt: row.learned_at,
          favorite: row.favorite || false,
          type: row.type,
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: progressMap,
    });
  } catch (error: any) {
    console.error("Curriculum progress fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

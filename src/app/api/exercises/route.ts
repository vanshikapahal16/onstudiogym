import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Exercise from "@/models/Exercise";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError } from "@/utils/response";

// GET /api/exercises (Explore all exercises)
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const query = category && category !== "All" ? { category } : {};
    const exercises = await Exercise.find(query);

    return sendSuccess("Exercise library loaded", { exercises });
  } catch (error) {
    return sendError("Failed to fetch exercises", error, 500);
  }
}

// POST /api/exercises (Admin adds a premium exercise to library)
export async function POST(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || !isAdmin(decoded)) {
      return sendUnauthorized();
    }

    await connectToDatabase();
    const { title, category, type, level, target, reps, duration, img } = await req.json();

    if (!title || !category || !type || !level || !target || !reps || !duration || !img) {
      return sendError("Please provide all required exercise details", null, 400);
    }

    const exercise = await Exercise.create({
      title,
      category,
      type,
      level,
      target,
      reps,
      duration,
      img,
    });

    return sendSuccess("Exercise added to library", { exercise }, 201);
  } catch (error) {
    return sendError("Failed to add exercise", error, 500);
  }
}

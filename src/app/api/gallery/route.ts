import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Gallery from "@/models/Gallery";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { verifyAuthToken } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendError, sendNotFound } from "@/utils/response";

// GET /api/gallery (Public fetches gallery images)
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const images = await Gallery.find({}).sort({ order: 1, createdAt: -1 });
    return sendSuccess("Gallery images loaded", { images });
  } catch (error) {
    return sendError("Failed to fetch gallery images", error, 500);
  }
}

// POST /api/gallery (Admin uploads a new gallery image via Cloudinary)
export async function POST(req: NextRequest) {
  try {
    const decoded = verifyAuthToken(req);
    if (!decoded || decoded.role !== "admin") {
      return sendUnauthorized();
    }

    await connectToDatabase();
    const { imageBase64, caption, order } = await req.json();

    if (!imageBase64 || !caption) {
      return sendError("Please provide image string and caption", null, 400);
    }

    // Direct Cloudinary upload
    const uploadResult = await uploadImage(imageBase64);

    const galleryItem = await Gallery.create({
      publicId: uploadResult.publicId,
      url: uploadResult.url,
      caption,
      order: order || 0,
    });

    return sendSuccess("Image uploaded to gallery and Cloudinary", { galleryItem }, 201);
  } catch (error) {
    return sendError("Image upload failed", error, 500);
  }
}

// DELETE /api/gallery/[id] (Admin deletes a gallery image, synchronized with Cloudinary)
// Since this is Next.js App Router dynamic route DELETE /api/gallery/[id], we need an dynamic subfolder/route handler or we can accept the id in request body/query.
// The user asked for DELETE /api/gallery/:id. Let's create `src/app/api/gallery/[id]/route.ts` next to handle this specifically.

import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Gallery from "@/models/Gallery";
import { deleteImage } from "@/lib/cloudinary";
import { verifyAuthToken, isAdmin } from "@/middleware/auth";
import { sendSuccess, sendUnauthorized, sendNotFound, sendError } from "@/utils/response";

// DELETE /api/gallery/:id (Admin deletes a gallery image, synchronized with Cloudinary)
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const decoded = verifyAuthToken(req);
    if (!decoded || !isAdmin(decoded)) {
      return sendUnauthorized();
    }

    await connectToDatabase();
    const galleryItem = await Gallery.findById(params.id);

    if (!galleryItem) {
      return sendNotFound("Gallery image not found");
    }

    // Direct Cloudinary CDN Deletion
    const isVideo = galleryItem.url.includes("/video/upload/") || galleryItem.url.match(/\.(mp4|webm|ogg|mov)/i) !== null;
    await deleteImage(galleryItem.publicId, isVideo);

    // Database deletion
    await Gallery.findByIdAndDelete(params.id);

    return sendSuccess("Image successfully deleted from gallery and Cloudinary storage");
  } catch (error) {
    return sendError("Failed to delete gallery image", error, 500);
  }
}

"use server";

import { connectToDatabase } from "@/lib/db";
import Gallery from "@/models/Gallery";
import { revalidatePath } from "next/cache";
import { verifyAdminServerAction } from "@/middleware/auth";


export type GalleryImage = {
  id: string;
  url: string;
  caption: string;
  order: number;
};

export async function getGalleryImages(): Promise<GalleryImage[]> {
  try {
    await connectToDatabase();
    
    let images = await Gallery.find({}).sort({ order: 1 });

    
    // Seed default gallery images if database is empty
    if (images.length === 0) {
      console.log("🌱 Seeding real gallery database...");
      const defaultImages = [
        {
          publicId: "default_entrance_1",
          url: "/images/gym/entrance_1.png",
          caption: "ON FITNESS STUDIO Main Entrance",
          order: 0,
        },
        {
          publicId: "default_entrance_2",
          url: "/images/gym/entrance_2.png",
          caption: "ON FITNESS STUDIO - Ganaur Sign",
          order: 1,
        },
        {
          publicId: "default_owner_posing",
          url: "/images/owner/owner_posing.png",
          caption: "Founder & Head Coach Posing in Gym",
          order: 2,
        },
      ];
      await Gallery.insertMany(defaultImages);
      images = await Gallery.find({}).sort({ order: 1 });
    }

    return images.map((img) => ({
      id: img._id.toString(),
      url: img.url,
      caption: img.caption,
      order: img.order ?? 0,
    }));
  } catch (error) {
    console.error("Error reading gallery data from DB:", error);
    return [];
  }
}

export async function addGalleryImage(fileStr: string, caption: string) {
  try {
    if (!(await verifyAdminServerAction())) {
      throw new Error("Unauthorized: Admin credentials required.");
    }

    await connectToDatabase();

    let imageUrl = "/images/gym/entrance_1.png";
    let publicId = `upload_${Date.now()}`;

    if (fileStr && fileStr.startsWith("data:")) {
      try {
        const { uploadImage } = await import("@/lib/cloudinary");
        const uploadResult = await uploadImage(fileStr);
        imageUrl = uploadResult.url;
        publicId = uploadResult.publicId;
      } catch (err) {
        console.error("Failed to upload gallery image to Cloudinary:", err);
      }
    } else if (fileStr) {
      imageUrl = fileStr;
    }

    const count = await Gallery.countDocuments();
    
    const newImage = await Gallery.create({
      publicId,
      url: imageUrl,
      caption,
      order: count,
    });
    
    revalidatePath("/");
    revalidatePath("/admin/gallery");
    return {
      id: newImage._id.toString(),
      url: newImage.url,
      caption: newImage.caption,
      order: newImage.order,
    };
  } catch (error) {
    console.error("Error adding gallery image:", error);
    throw new Error("Failed to add image to gallery");
  }
}

export async function removeGalleryImage(id: string) {
  try {
    if (!(await verifyAdminServerAction())) {
      throw new Error("Unauthorized: Admin credentials required.");
    }

    await connectToDatabase();

    const img = await Gallery.findById(id);
    if (img && img.publicId) {
      try {
        const { deleteImage } = await import("@/lib/cloudinary");
        const isVideo = img.url.includes("/video/upload/") || img.url.match(/\.(mp4|webm|ogg|mov)/i) !== null;
        await deleteImage(img.publicId, isVideo);
      } catch (e) {
        console.error("Failed to delete from Cloudinary:", e);
      }
    }

    await Gallery.findByIdAndDelete(id);
    revalidatePath("/");
    revalidatePath("/admin/gallery");
  } catch (error) {
    console.error("Error removing gallery image:", error);
    throw new Error("Failed to remove image");
  }
}

export async function updateImageCaption(id: string, caption: string) {
  try {
    if (!(await verifyAdminServerAction())) {
      throw new Error("Unauthorized: Admin credentials required.");
    }

    await connectToDatabase();
    await Gallery.findByIdAndUpdate(id, { caption });
    revalidatePath("/");
    revalidatePath("/admin/gallery");
  } catch (error) {
    console.error("Error updating gallery image caption:", error);
    throw new Error("Failed to update caption");
  }
}

"use server";

import { connectToDatabase } from "@/lib/db";
import Gallery from "@/models/Gallery";
import { revalidatePath } from "next/cache";

export type GalleryImage = {
  id: string;
  url: string;
  caption: string;
  order: number;
};

export async function getGalleryImages(): Promise<GalleryImage[]> {
  try {
    await connectToDatabase();
    
    // Update any old seeded captions in the database
    await Gallery.updateMany({ caption: "AG ANTIGRAVITY Main Entrance" }, { $set: { caption: "ON FITNESS STUDIO Main Entrance" } });
    await Gallery.updateMany({ caption: "AG ANTIGRAVITY - Ganaur Sign" }, { $set: { caption: "ON FITNESS STUDIO - Ganaur Sign" } });
    
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

export async function addGalleryImage(url: string, caption: string) {
  try {
    await connectToDatabase();
    const count = await Gallery.countDocuments();
    
    const newImage = await Gallery.create({
      publicId: `upload_${Date.now()}`,
      url,
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
    await connectToDatabase();
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
    await connectToDatabase();
    await Gallery.findByIdAndUpdate(id, { caption });
    revalidatePath("/");
    revalidatePath("/admin/gallery");
  } catch (error) {
    console.error("Error updating gallery image caption:", error);
    throw new Error("Failed to update caption");
  }
}

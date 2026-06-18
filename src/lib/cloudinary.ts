import { v2 as cloudinary } from "cloudinary";

// Provide safe local fallbacks so the app does not crash if envs are missing
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "mock_cloud",
  api_key: process.env.CLOUDINARY_API_KEY || "mock_key",
  api_secret: process.env.CLOUDINARY_API_SECRET || "mock_secret",
  secure: true,
});

export async function uploadImage(fileStr: string): Promise<{ publicId: string; url: string }> {
  // If no Cloudinary credentials are provided, return a mock URL using Unsplash
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME === "mock_cloud" ||
    process.env.CLOUDINARY_CLOUD_NAME === "test"
  ) {
    console.log("⚠️ Missing Cloudinary Credentials. Using simulated local storage.");
    return {
      publicId: `mock_${Date.now()}`,
      url: fileStr.startsWith("data:") 
        ? "https://images.unsplash.com/photo-1517838357463-d25dfeac3438?q=80&w=600" 
        : fileStr,
    };
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: "on_fitness_gallery",
    });
    return {
      publicId: uploadResponse.public_id,
      url: uploadResponse.secure_url,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  if (publicId.startsWith("mock_")) {
    console.log(`⚠️ Mock Image Deleted: ${publicId}`);
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    throw new Error("Failed to delete image from Cloudinary");
  }
}

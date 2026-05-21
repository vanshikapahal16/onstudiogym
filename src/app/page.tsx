import { getGalleryImages } from "@/app/actions/gallery";
import LandingPage from "@/components/public/LandingPage";

export default async function PublicPage() {
  const galleryImages = await getGalleryImages();
  
  return <LandingPage initialGalleryImages={galleryImages} />;
}

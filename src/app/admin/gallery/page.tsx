"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2, GripHorizontal, Check, Loader2, Image as ImageIcon, X, PlayCircle } from "lucide-react";
import { getGalleryImages, addGalleryImage, removeGalleryImage, updateImageCaption, type GalleryImage } from "@/app/actions/gallery";

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newCaption, setNewCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [activeMedia, setActiveMedia] = useState<GalleryImage | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    setLoading(true);
    const data = await getGalleryImages();
    setImages(data);
    setLoading(false);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!previewUrl) return;
    
    setAdding(true);
    try {
      await addGalleryImage(previewUrl, newCaption || "Gym Media");
      setSelectedFile(null);
      setPreviewUrl(null);
      setNewCaption("");
      await loadImages();
    } catch (err) {
      alert("Failed to upload file.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    await removeGalleryImage(id);
    await loadImages();
  }

  async function handleUpdateCaption(id: string, caption: string) {
    await updateImageCaption(id, caption);
    await loadImages();
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
          <Upload className="w-5 h-5 text-primary" />
          Upload New Photo or Video
        </h3>
        <form onSubmit={handleAdd} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Select Photo or Video File</label>
              <input 
                type="file" 
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/90 cursor-pointer" 
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Caption</label>
              <input 
                type="text" 
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="e.g. Premium Cardio Zone" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" 
              />
            </div>
          </div>

          {previewUrl && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">File Preview:</p>
              <div className="w-48 aspect-video rounded-lg overflow-hidden border border-white/20">
                {selectedFile?.type.startsWith("video/") || previewUrl.startsWith("data:video/") ? (
                  <video src={previewUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                )}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={adding || !previewUrl}
            className="px-6 py-2.5 rounded-xl bg-primary text-black font-bold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(0,255,178,0.3)] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Upload to Gallery
          </button>
        </form>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Live Gallery
          </h3>
          <span className="text-sm text-muted-foreground">{images.length} items published</span>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((img) => {
              const isVideo = img.url.includes("/video/upload/") || img.url.match(/\.(mp4|webm|ogg|mov)/i) !== null;
              return (
                <motion.div 
                  key={img.id}
                  layoutId={img.id}
                  className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/5"
                >
                  <div 
                    onClick={() => setActiveMedia(img)}
                    className="aspect-video relative bg-black flex items-center justify-center cursor-pointer overflow-hidden"
                  >
                    {isVideo ? (
                      <>
                        <video src={img.url} className="w-full h-full object-cover animate-fade-in" muted playsInline preload="metadata" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35 group-hover:bg-black/15 transition-colors">
                          <PlayCircle className="w-10 h-10 text-primary opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 drop-shadow-[0_0_10px_rgba(0,255,178,0.5)]" />
                        </div>
                      </>
                    ) : (
                      <img src={img.url} alt={img.caption} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 z-10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(img.id);
                        }}
                        className="p-2 rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-[#0B0F19]">
                    <input 
                      type="text" 
                      defaultValue={img.caption}
                      onBlur={(e) => handleUpdateCaption(img.id, e.target.value)}
                      className="w-full bg-transparent border-none text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-1"
                    />
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <GripHorizontal className="w-3 h-3 cursor-move" />
                      Drag to reorder
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-8 backdrop-blur-md"
            onClick={() => setActiveMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-5xl w-full max-h-[85vh] bg-[#0B0F19] rounded-2xl overflow-hidden border border-white/10 flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-black/40">
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Media Preview
                </span>
                <button
                  onClick={() => setActiveMedia(null)}
                  className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Media Container */}
              <div className="flex-1 overflow-hidden bg-black flex items-center justify-center p-4 min-h-[40vh] max-h-[70vh]">
                {activeMedia.url.includes("/video/upload/") || activeMedia.url.match(/\.(mp4|webm|ogg|mov)/i) !== null ? (
                  <video
                    src={activeMedia.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <img
                    src={activeMedia.url}
                    alt={activeMedia.caption}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                )}
              </div>

              {/* Caption */}
              {activeMedia.caption && (
                <div className="p-5 border-t border-white/10 bg-black/40 text-center">
                  <p className="text-white text-base font-medium">{activeMedia.caption}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

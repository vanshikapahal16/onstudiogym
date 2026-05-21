"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Trash2, GripHorizontal, Check, Loader2, Image as ImageIcon } from "lucide-react";
import { getGalleryImages, addGalleryImage, removeGalleryImage, updateImageCaption, type GalleryImage } from "@/app/actions/gallery";

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    setLoading(true);
    const data = await getGalleryImages();
    setImages(data);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl) return;
    
    setAdding(true);
    await addGalleryImage(newUrl, newCaption || "Gym Image");
    setNewUrl("");
    setNewCaption("");
    await loadImages();
    setAdding(false);
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
          Upload New Image
        </h3>
        <form onSubmit={handleAdd} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Image URL</label>
              <input 
                type="text" 
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" 
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
          <button 
            type="submit" 
            disabled={adding || !newUrl}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(0,255,178,0.3)] disabled:opacity-50 flex items-center gap-2"
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
          <span className="text-sm text-muted-foreground">{images.length} images published</span>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((img) => (
              <motion.div 
                key={img.id}
                layoutId={img.id}
                className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/5"
              >
                <div className="aspect-video relative">
                  <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                    <button 
                      onClick={() => handleRemove(img.id)}
                      className="p-2 rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors"
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

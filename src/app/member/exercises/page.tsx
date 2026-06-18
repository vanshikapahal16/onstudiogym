"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Dumbbell, PlayCircle, Star, Clock, Loader2 } from "lucide-react";

const categories = [
  "All", "Chest", "Back", "Shoulder", "Legs", "Cardio", "Beginner"
];

interface ExerciseItem {
  _id: string;
  title: string;
  category: string;
  type: string;
  level: string;
  target: string;
  reps: string;
  duration: string;
  img: string;
}

export default function ExerciseLibrary() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const res = await fetch("/api/exercises");
      const data = await res.json();
      if (res.ok && data.success) {
        setExercises(data.data.exercises || []);
      }
    } catch (err) {
      console.error("Failed to load exercises:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(ex => 
    (activeCategory === "All" || ex.category.toLowerCase() === activeCategory.toLowerCase()) &&
    (ex.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     ex.target.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Exercise <span className="text-primary text-gradient">Library</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover premium workouts for every goal.
          </p>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 w-full lg:w-96 focus-within:border-primary/50 transition-colors">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search exercises by name or muscle group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-white w-full placeholder:text-muted-foreground focus:ring-0"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 custom-scrollbar lg:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-300 cursor-pointer ${
                activeCategory === cat
                  ? "bg-primary text-white neon-glow border border-primary/50"
                  : "bg-white/5 text-muted-foreground border border-white/10 hover:text-white hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredExercises.map((exercise, index) => (
            <motion.div
              key={exercise._id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="glass-panel rounded-3xl overflow-hidden border border-white/10 group hover:border-primary/50 transition-colors duration-500 flex flex-col"
            >
              <div className="relative aspect-video overflow-hidden bg-black/50 cursor-pointer">
                <img 
                  src={exercise.img} 
                  alt={exercise.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] to-transparent" />
                
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-md text-xs font-bold text-white border border-white/10 flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {exercise.level}
                  </span>
                  <span className="px-2.5 py-1 bg-primary/20 backdrop-blur-md rounded-md text-xs font-bold text-primary border border-primary/30">
                    {exercise.category}
                  </span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-14 h-14 rounded-full bg-primary/20 backdrop-blur-md border border-primary/50 flex items-center justify-center text-primary neon-glow">
                    <PlayCircle className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{exercise.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Target: <span className="text-gray-300">{exercise.target}</span></p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-1 text-sm text-gray-300">
                    <Dumbbell className="w-4 h-4 text-primary" /> {exercise.reps}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-300">
                    <Clock className="w-4 h-4 text-secondary" /> {exercise.duration}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredExercises.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <Dumbbell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-bold text-white mb-2">No exercises found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}

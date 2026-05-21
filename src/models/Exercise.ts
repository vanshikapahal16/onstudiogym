import mongoose from "mongoose";

const ExerciseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    target: {
      type: String,
      required: true,
    },
    reps: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    img: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Exercise || mongoose.model("Exercise", ExerciseSchema);

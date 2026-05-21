import mongoose from "mongoose";

const InquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    fitnessGoal: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Inquiry || mongoose.model("Inquiry", InquirySchema);

import mongoose from "mongoose";

const PendingMemberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Name is required"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.PendingMember || mongoose.model("PendingMember", PendingMemberSchema);

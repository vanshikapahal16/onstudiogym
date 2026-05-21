import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
      required: true,
      default: Date.now,
    },
    checkOut: {
      type: Date,
      index: true,
    },
    duration: {
      type: Number, // In minutes
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);

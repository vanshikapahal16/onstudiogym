import mongoose from "mongoose";

const AttendanceLogsSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      index: true,
    },
    qrData: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Success", "Failed"],
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.AttendanceLogs || mongoose.model("AttendanceLogs", AttendanceLogsSchema);

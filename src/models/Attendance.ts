import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },
    memberName: {
      type: String,
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
    date: {
      type: String, // format: YYYY-MM-DD
      required: true,
      index: true,
    },
    time: {
      type: String, // format: HH:MM:SS
      required: true,
    },
    deviceInfo: {
      type: String,
      default: "Unknown Device",
    },
    checkInSource: {
      type: String,
      default: "QR Scan",
      index: true,
    },
  },
  { timestamps: true }
);

// Pre-validate hook to auto-fill memberName, date, and time if missing
AttendanceSchema.pre("validate", async function () {
  const self = this as any;
  if (self.checkIn) {
    const d = new Date(self.checkIn);
    if (!self.date) {
      self.date = d.toISOString().split("T")[0];
    }
    if (!self.time) {
      self.time = d.toTimeString().split(" ")[0];
    }
  }
  
  if (self.memberId && !self.memberName) {
    try {
      const MemberModule = await import("./Member");
      const Member = mongoose.models.Member || MemberModule.default || MemberModule;
      const member = await Member.findById(self.memberId);
      if (member) {
        self.memberName = member.fullName || member.name;
      }
    } catch (err) {
      console.error("Failed to populate memberName in Attendance pre-validate hook:", err);
    }
  }
});

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { addMonths, differenceInDays } from "date-fns";

const MemberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      index: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      index: true,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    profileImage: {
      type: String,
      default: "https://ui-avatars.com/api/?name=Gym+Member&background=random",
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    membershipDuration: {
      type: Number, // in months
      required: [true, "Membership duration is required"],
    },
    membershipExpiry: {
      type: Date,
      index: true,
    },
    totalFee: {
      type: Number,
      required: [true, "Total fee is required"],
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    membershipStatus: {
      type: String,
      enum: ["Active", "Expiring Soon", "Expired", "Suspended"],
      default: "Active",
      index: true,
    },
    lastVisit: {
      type: Date,
    },
    attendanceCount: {
      type: Number,
      default: 0,
    },
    mustChangePassword: {
      type: Boolean,
      default: true, // For onboarding first-time login
    },
    role: {
      type: String,
      default: "member",
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash password & Automate fields before saving
MemberSchema.pre("save", async function () {
  // Hash password if modified
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error: any) {
      throw error;
    }
  }

  // Calculate Expiry Date
  if (this.isModified("membershipDuration") || this.isModified("joinDate") || !this.membershipExpiry) {
    this.membershipExpiry = addMonths(this.joinDate || new Date(), this.membershipDuration);
  }

  // Calculate Remaining Amount
  this.remainingAmount = Math.max(0, this.totalFee - this.totalPaid);

  // Automatically update status based on expiration (unless it's manually set to Suspended)
  if (this.membershipStatus !== "Suspended") {
    const daysLeft = differenceInDays(this.membershipExpiry, new Date());
    if (daysLeft < 0) {
      this.membershipStatus = "Expired";
    } else if (daysLeft <= 10) {
      this.membershipStatus = "Expiring Soon";
    } else {
      this.membershipStatus = "Active";
    }
  }
});

// Compare password method
MemberSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export default mongoose.models.Member || mongoose.model("Member", MemberSchema);

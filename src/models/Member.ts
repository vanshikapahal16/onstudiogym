import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { addMonths, differenceInDays } from "date-fns";

const MemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      alias: "fullName",
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      alias: "phoneNumber",
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    hashedPassword: {
      type: String,
      required: [true, "Password is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    profileImage: {
      type: String,
      default: "https://ui-avatars.com/api/?name=Gym+Member&background=random",
    },
    membershipPlan: {
      type: String,
      enum: ["Monthly", "Quarterly", "Half-Yearly", "Annual", "Gold"],
      default: "Monthly",
    },
    membershipStartDate: {
      type: Date,
      alias: "joinDate",
      default: Date.now,
    },
    membershipEndDate: {
      type: Date,
      alias: "membershipExpiry",
      index: true,
    },
    membershipDuration: {
      type: Number, // in months
      required: [true, "Membership duration is required"],
      default: 1,
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
      enum: ["Active", "Expiring Soon", "Expired", "Suspended", "Pending"],
      default: "Active",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Partially Paid", "Unpaid"],
      default: "Unpaid",
      index: true,
    },
    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    isActive: {
      type: Boolean,
      default: true,
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
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for password
MemberSchema.virtual("password")
  .get(function (this: any) {
    return this.hashedPassword;
  })
  .set(function (this: any, val: string) {
    this._password = val;
  });

// Hash password & Automate fields before validation
MemberSchema.pre("validate", async function () {
  const self = this as any;
  // Hash password if plain text was set on virtual
  if (self._password) {
    try {
      const salt = await bcrypt.genSalt(10);
      self.hashedPassword = await bcrypt.hash(self._password, salt);
      delete self._password;
    } catch (error: any) {
      throw error;
    }
  } else if (self.isModified("hashedPassword")) {
    // Hash if set directly and not hashed
    if (!self.hashedPassword.startsWith("$2a$") && !self.hashedPassword.startsWith("$2b$")) {
      try {
        const salt = await bcrypt.genSalt(10);
        self.hashedPassword = await bcrypt.hash(self.hashedPassword, salt);
      } catch (error: any) {
        throw error;
      }
    }
  }

  // Deduce plan or duration if modified
  if (self.isModified("membershipDuration") && !self.isModified("membershipPlan")) {
    const dur = self.membershipDuration;
    if (dur === 1) self.membershipPlan = "Monthly";
    else if (dur === 3) self.membershipPlan = "Quarterly";
    else if (dur === 6) self.membershipPlan = "Half-Yearly";
    else if (dur === 12) self.membershipPlan = "Annual";
  } else if (self.isModified("membershipPlan") && !self.isModified("membershipDuration")) {
    const plan = self.membershipPlan;
    if (plan === "Monthly") self.membershipDuration = 1;
    else if (plan === "Quarterly") self.membershipDuration = 3;
    else if (plan === "Half-Yearly") self.membershipDuration = 6;
    else if (plan === "Annual") self.membershipDuration = 12;
    else if (plan === "Gold") self.membershipDuration = 12;
  }

  // Calculate Expiry Date
  if (self.isModified("membershipDuration") || self.isModified("membershipPlan") || self.isModified("membershipStartDate") || !self.membershipEndDate) {
    const startDate = self.membershipStartDate || new Date();
    const dur = self.membershipDuration || 1;
    self.membershipEndDate = addMonths(startDate, dur);
  }

  // Calculate Remaining Amount
  self.remainingAmount = Math.max(0, self.totalFee - self.totalPaid);

  // Set Payment Status
  if (self.totalPaid >= self.totalFee) {
    self.paymentStatus = "Paid";
  } else if (self.totalPaid > 0) {
    self.paymentStatus = "Partially Paid";
  } else {
    self.paymentStatus = "Unpaid";
  }

  // Automatically update status based on expiration (unless it's Pending, manually set to Suspended, or isActive is false)
  if (self.membershipStatus === "Pending") {
    self.isActive = false;
  } else if (self.membershipStatus === "Suspended" || !self.isActive) {
    self.membershipStatus = "Suspended";
    self.isActive = false;
  } else {
    const daysLeft = differenceInDays(self.membershipEndDate, new Date());
    if (daysLeft < 0) {
      self.membershipStatus = "Expired";
    } else if (daysLeft <= 10) {
      self.membershipStatus = "Expiring Soon";
    } else {
      self.membershipStatus = "Active";
    }
  }
});

// Compare password method
MemberSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  const hash = this.hashedPassword || this.password || "";
  return bcrypt.compare(password, hash);
};

export default mongoose.models.Member || mongoose.model("Member", MemberSchema);


import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      unique: true,
      index: true,
      trim: true,
    },
    hashedPassword: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      default: "admin",
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Virtual for fullName for backward compatibility
AdminSchema.virtual("fullName")
  .get(function (this: any) {
    return this.name;
  })
  .set(function (this: any, val: string) {
    this.name = val;
  });

// Virtual for password setter/getter
AdminSchema.virtual("password")
  .set(function (this: any, password: string) {
    this._password = password;
  })
  .get(function (this: any) {
    return this._password;
  });

// Hash password before validation
AdminSchema.pre("validate", async function (this: any) {
  if (this._password) {
    const salt = await bcrypt.genSalt(10);
    this.hashedPassword = await bcrypt.hash(this._password, salt);
  }
});

// Compare password method
AdminSchema.methods.comparePassword = async function (this: any, password: string): Promise<boolean> {
  if (!this.hashedPassword) return false;
  return bcrypt.compare(password, this.hashedPassword);
};

// Ensure virtual fields are serialized
AdminSchema.set("toJSON", { virtuals: true });
AdminSchema.set("toObject", { virtuals: true });

export default mongoose.models.Admin || mongoose.model("Admin", AdminSchema);


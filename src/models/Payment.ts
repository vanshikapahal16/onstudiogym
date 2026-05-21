import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    invoiceId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["Paid", "Partially Paid", "Pending", "Overdue"],
      default: "Paid",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);

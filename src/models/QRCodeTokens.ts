import mongoose from "mongoose";

const QRCodeTokensSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.QRCodeTokens || mongoose.model("QRCodeTokens", QRCodeTokensSchema);

import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", index: true },
  tokenHash: { type: String, required: true, unique: true },
  jti: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: { type: Date, default: null },
  replacedBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
});

const refreshTokenModel =
  mongoose.models.refreshToken ||
  mongoose.model("refreshToken", refreshTokenSchema);

export default refreshTokenModel;

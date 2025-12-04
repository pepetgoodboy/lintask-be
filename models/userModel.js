import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  license: { type: String, nullable: true },
  status: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  verifyCode: { type: String, nullable: true },
  expiredAt: { type: Date, nullable: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;

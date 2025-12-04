import mongoose from "mongoose";

const imapSchema = new mongoose.Schema({
  imapHost: { type: String, required: true },
  imapPort: { type: Number, required: true },
  imapUser: { type: String, required: true },
  imapPass: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["valid", "invalid"], default: "invalid" },
});

const imapModel = mongoose.models.imap || mongoose.model("imap", imapSchema);

export default imapModel;

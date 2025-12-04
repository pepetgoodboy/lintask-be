import imapModel from "../models/imapModel.js";
import { createListener } from "../utils/imapListener.js";

const addImap = async (req, res) => {
  try {
    const { imapHost, imapPort, imapUser, imapPass, userId } = req.body;
    const newImap = new imapModel({
      imapHost,
      imapPort,
      imapUser,
      imapPass,
      userId,
    });
    const result = await newImap.save();
    const saved = await imapModel
      .findById(result._id)
      .populate("userId", "name email");
    createListener(saved);
    return res.status(200).json({ message: "IMAP account successfully added" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

const listImaps = async (req, res) => {
  try {
    const imaps = await imapModel.find().populate("userId", "name email");
    return res
      .status(200)
      .json({ message: "IMAP accounts fetched", data: imaps });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export { addImap, listImaps };

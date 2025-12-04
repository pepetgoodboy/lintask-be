import express from "express";
import { addImap, listImaps } from "../controllers/imapController.js";

const router = express.Router();

router.post("/add-imap", addImap);
router.get("/list-imaps", listImaps);

export default router;

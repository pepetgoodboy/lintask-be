import express from "express";
import {
  registerUser,
  verifyUser,
  resendVerifCode,
  loginUser,
  profileUser,
  forgotPass,
  resetPass,
  refreshUserToken,
  logoutUser,
} from "../controllers/userController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify", verifyUser);
router.post("/resend-code", resendVerifCode);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPass);
router.post("/reset-password/:id/:token", resetPass);
router.get("/profile", auth, profileUser);
router.post("/refresh", refreshUserToken);
router.post("/logout", logoutUser);

export default router;

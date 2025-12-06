import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import jwt from "jsonwebtoken";
import {
  createJti,
  signAccessToken,
  signRefreshToken,
  persistRefreshToken,
  setRefreshCookie,
  hashToken,
  rotateRefreshToken,
} from "../utils/tokens.js";
import refreshTokenModel from "../models/refreshToken.js";
import { sendResetPassword, sendVerifCode } from "./mailer.js";

// Generate verification code
const generateVerificationCode = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return random.toString();
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Check if user already exists
    const exists = await userModel.findOne({ email: email });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "Email sudah terdaftar!" });
    }

    // Validating email format & strong password
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Email tidak valid!" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password harus memiliki minimal 8 karakter!",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const code = generateVerificationCode();

    // Set code expired at for 5 minutes
    const codeExpiredAt = new Date(Date.now() + 5 * 60 * 1000);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      license: null,
      isVerified: false,
      verifyCode: code,
      expiredAt: null,
      codeExpiredAt,
    });

    // Save user
    const user = await newUser.save();
    await sendVerifCode(user.email, code);

    return res.status(201).json({
      success: true,
      message:
        "Registrasi berhasil, silakan cek email untuk mendapatkan kode verifikasi",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const resendVerifCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Email anda belum terdaftar!" });
    }
    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Email sudah terverifikasi!" });
    }
    const code = generateVerificationCode();
    user.verifyCode = code;
    user.codeExpiredAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();
    await sendVerifCode(user.email, code);
    return res
      .status(200)
      .json({ success: true, message: "Kode verifikasi berhasil dikirim" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const verifyUser = async (req, res) => {
  try {
    const { verifCode } = req.body;
    const user = await userModel.findOne({ verifyCode: verifCode });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Kode verifikasi salah!" });
    }
    if (user.codeExpiredAt < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Kode verifikasi sudah kadaluarsa!" });
    }
    user.isVerified = true;
    user.verifyCode = null;
    user.codeExpiredAt = null;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Verifikasi berhasil, silahkan login" });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Email anda belum terdaftar!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Email atau password salah!" });

    const accessToken = signAccessToken(user);

    const jti = createJti();
    const refreshToken = signRefreshToken(user, jti);

    await persistRefreshToken({
      user,
      refreshToken,
      jti,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "",
    });

    setRefreshCookie(res, refreshToken);

    return res
      .status(200)
      .json({ success: true, data: { accessToken, refreshToken } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const refreshUserToken = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token" });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or refresh token" });
    }

    const tokenHash = hashToken(token);
    const doc = await refreshTokenModel
      .findOne({
        tokenHash,
        jti: decoded.jti,
      })
      .populate("user");

    if (!doc) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token not recognized" });
    }

    if (doc.revokedAt) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token revoked" });
    }

    if (doc.expiresAt < new Date()) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token expired" });
    }

    const result = await rotateRefreshToken(doc, doc.user, req, res);
    return res.status(200).json({ success: true, data: result.accessToken });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;

    if (token) {
      const tokenHash = hashToken(token);
      const doc = await refreshTokenModel.findOne({ tokenHash });
      if (doc && !doc.revokedAt) {
        doc.revokedAt = new Date();
        await doc.save();
      }
    }

    res.clearCookie("refresh_token", { path: "/api/auth/refresh" });
    return res.status(200).json({ success: true, message: "Logout success" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const forgotPass = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Email anda belum terdaftar!" });
    }

    const token = jwt.sign({ id: user._id }, process.env.RESET_PASS_SECRET, {
      expiresIn: "10m",
    });

    await sendResetPassword(user.email, user._id, token);
    return res.status(200).json({
      success: true,
      message:
        "Link reset password telah dikirim ke email anda, silahkan cek email anda",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resetPass = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { password } = req.body;
    const user = await userModel.findById(id);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    jwt.verify(token, process.env.RESET_PASS_SECRET, async (err, decoded) => {
      if (err) {
        return res
          .status(400)
          .json({ success: false, message: "Token tidak valid" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user.password = hashedPassword;
      await user.save();
      return res
        .status(200)
        .json({ success: true, message: "Password berhasil diperbarui" });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const profileUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  registerUser,
  verifyUser,
  resendVerifCode,
  loginUser,
  profileUser,
  refreshUserToken,
  forgotPass,
  resetPass,
  logoutUser,
};

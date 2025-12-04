import jwt from "jsonwebtoken";
import crypto from "crypto";
import refreshTokenModel from "../models/refreshToken.js";

const ACCESS_TTL = "15m";
const REFRESH_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const createJti = () => {
  return crypto.randomBytes(16).toString("hex");
};

const signAccessToken = (user) => {
  const payload = { id: user._id.toString(), email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
};

const signRefreshToken = (user, jti) => {
  const payload = { id: user._id.toString(), jti };
  const token = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TTL_SEC,
  });
  return token;
};

const persistRefreshToken = async ({
  user,
  refreshToken,
  jti,
  ip,
  userAgent,
}) => {
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000);
  await refreshTokenModel.create({
    user: user._id,
    tokenHash,
    jti,
    expiresAt,
    ip,
    userAgent,
  });
};

const setRefreshCookie = (res, refreshToken) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: REFRESH_TTL_SEC * 1000,
  });
};

const rotateRefreshToken = async (oldDoc, user, req, res) => {
  // revoke old
  oldDoc.revokedAt = new Date();
  const newJti = createJti();
  oldDoc.replacedBy = newJti;
  await oldDoc.save();

  // issue new
  const newAccess = signAccessToken(user);
  const newRefresh = signRefreshToken(user, newJti);
  await persistRefreshToken({
    user,
    refreshToken: newRefresh,
    jti: newJti,
    ip: req.ip,
    userAgent: req.headers["user-agent"] || "",
  });
  setRefreshCookie(res, newRefresh);
  return { accessToken: newAccess };
};

export {
  hashToken,
  createJti,
  signAccessToken,
  signRefreshToken,
  persistRefreshToken,
  setRefreshCookie,
  rotateRefreshToken,
};

import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, tokenFromHeader] = authHeader ? authHeader.split(" ") : [];
  const tokenFromCookie = req.cookies?.access_token;

  const token =
    scheme === "Bearer" && tokenFromHeader ? tokenFromHeader : tokenFromCookie;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (error) {
    const msg =
      error.name === "TokenExpiredError"
        ? "Access token expired"
        : "Invalid token";
    return res.status(401).json({ message: msg });
  }
};

export default auth;

import express from "express";
import userRoute from "./routes/userRoute.js";
import imapRoute from "./routes/imapRoute.js";
import { connectDB } from "./config/db.js";
import { startListener } from "./utils/imapListener.js";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";

// App Config
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// DB Connection
connectDB();

// IMAP Service
startListener();

// API Endpoints
app.use("/api/v1/auth", userRoute);
app.use("/api/v1/imap", imapRoute);

// Listen
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

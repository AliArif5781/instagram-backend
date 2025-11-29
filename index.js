import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/mongoose.db.js";
import { authenticateRoute } from "./routes/autenticateRoute.js";
import imagekitRoute from "./routes/imageKitRoute.js";
import { postRoute } from "./routes/postRoute.js";
import { messageRoute } from "./routes/messageRoute.js";
import { server, app } from "./socket/socket.js";
import { followRoute } from "./routes/followRoute.js";
import { storyRoute } from "./routes/storyRoute.js";
connectDB();
// const app = express();
const port = process.env.PORT || 5000;
app.use(cookieParser());
app.use(express.json());

console.log(process.env.CLIENT_URI);
app.use(
  cors({
    // origin: ["http://localhost:5173"],
    origin: process.env.SERVER_URI,
    credentials: true,
  })
);

app.get("", (req, res) => {
  res.send("api Working");
});

app.use("/api/user", authenticateRoute);
app.use("/api/v1/imagekit", imagekitRoute);
app.use("/api/user", messageRoute);
app.use("/api/user", followRoute);
app.use("/api/user/post", postRoute);
app.use("/api/user", storyRoute);

// global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

server.listen(port, () => {
  console.log(`server running at port ${port}`);
});

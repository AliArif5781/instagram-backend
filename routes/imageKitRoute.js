// routes/imagekitRoutes.js
import express from "express";
import ImageKit from "imagekit";

const router = express.Router();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// GET /api/v1/imagekit/auth
router.get("/auth", (req, res) => {
  try {
    const result = imagekit.getAuthenticationParameters();
    res.json(result); // { token, expire, signature }
  } catch (err) {
    res.status(500).json({ message: "ImageKit auth error" });
  }
});

export default router;

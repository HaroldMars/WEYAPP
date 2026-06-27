import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cloudinary, { isCloudinaryEnabled } from "../config/cloudinary.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, "..", "..", "uploads");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const imageFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, png, gif, webp) are allowed."));
  }
};

// Memory storage when using Cloudinary (we stream the buffer up), disk storage otherwise.
const makeStorage = (subfolder) => {
  if (isCloudinaryEnabled) {
    return multer.memoryStorage();
  }
  const dest = path.join(uploadsRoot, subfolder);
  ensureDir(dest);
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, unique);
    },
  });
};

export const uploadAvatar = multer({
  storage: makeStorage("avatars"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFileFilter,
});

export const uploadChatImage = multer({
  storage: makeStorage("chat-images"),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: imageFileFilter,
});

export const uploadPostImage = multer({
  storage: makeStorage("post-images"),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: imageFileFilter,
});

/**
 * Given a multer file object, returns a public URL string.
 * If Cloudinary is enabled, uploads the in-memory buffer there first.
 */
export const resolveUploadedFileUrl = async (file, folder) => {
  if (!file) return "";

  if (isCloudinaryEnabled) {
    const b64 = file.buffer.toString("base64");
    const dataUri = `data:${file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `chatapp/${folder}`,
      resource_type: "image",
    });
    return result.secure_url;
  }

  // Local disk: served statically from /uploads
  return `/uploads/${folder}/${file.filename}`;
};

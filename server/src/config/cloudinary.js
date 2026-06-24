import { v2 as cloudinary } from "cloudinary";

export const isCloudinaryEnabled = process.env.UPLOAD_STRATEGY === "cloudinary";

if (isCloudinaryEnabled) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export default cloudinary;

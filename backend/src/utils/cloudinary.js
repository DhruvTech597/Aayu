import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

/**
 * Upload a buffer to Cloudinary using streams
 * @param {Buffer} buffer 
 * @param {String} folder 
 * @returns {Promise}
 */
export const uploadToCloudinary = (buffer, folder = "medai-records", resourceType = "auto", originalName = "") => {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: resourceType,
    };

    if (originalName) {
      const ext = originalName.split(".").pop();
      const baseName = originalName.split(".").slice(0, -1).join(".").replace(/[^a-zA-Z0-9]/g, "_");
      options.public_id = `${baseName}_${Date.now()}`;
      if (resourceType === "raw") {
        options.public_id = `${baseName}_${Date.now()}.${ext}`;
      }
    }

    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

/**
 * Delete a file from Cloudinary
 * @param {String} publicId 
 * @returns {Promise}
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    return null;
  }
};

const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log(`[Cloudinary Configured] Connected to cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
} else {
  console.log('[Cloudinary] Not configured, will use local storage for uploads.');
}

/**
 * Upload a local file to Cloudinary
 * @param {string} localFilePath - Path to local file
 * @param {string} folder - Cloudinary folder
 * @param {boolean} removeLocal - Whether to delete local temp file after upload
 */
const uploadToCloudinary = async (localFilePath, folder = 'sunbird_crm', removeLocal = true, customOptions = {}) => {
  if (!isCloudinaryConfigured) {
    return null;
  }

  try {
    const isImage = /\.(jpg|jpeg|png|bmp|tiff|heic|webp)$/i.test(localFilePath);
    const options = {
      folder,
      resource_type: isImage ? 'image' : 'auto',
      ...customOptions,
    };

    // Automatically convert all images to optimized WebP format
    if (isImage) {
      options.format = 'webp';
      options.transformation = [
        { quality: 'auto:good', fetch_format: 'webp' },
      ];
    }

    const result = await cloudinary.uploader.upload(localFilePath, options);

    if (removeLocal && fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.warn('[Cloudinary Temp Clean Warning]', err.message);
      }
    }

    return result;
  } catch (error) {
    console.error('[Cloudinary Upload Error]', error.message);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary by public ID
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!isCloudinaryConfigured || !publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.warn('[Cloudinary Delete Error]', error.message);
    return null;
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
};

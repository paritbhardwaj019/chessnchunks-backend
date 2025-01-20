const { v2: cloudinary } = require('cloudinary');
const httpStatus = require('http-status');

const config = require('../config');

const ApiError = require('./apiError');

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

/**
 * Upload file to Cloudinary
 * @param {string|Buffer} file - File path or buffer
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder name
 * @param {string} options.publicId - Custom public ID for the file
 * @param {Array} options.allowedFormats - Array of allowed file formats
 * @returns {Promise<Object>} Cloudinary upload response
 */
const uploadToCloudinary = async (file, options = {}) => {
  try {
    const {
      folder = 'academy-logos',
      publicId,
      allowedFormats = ['jpg', 'jpeg', 'png', 'gif'],
      maxSize = 5 * 1024 * 1024,
    } = options;

    const uploadOptions = {
      folder,
      allowed_formats: allowedFormats,
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { fetch_format: 'auto', quality: 'auto' },
      ],
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    const uploadResponse = await cloudinary.uploader.upload(
      file,
      uploadOptions
    );

    return {
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      format: uploadResponse.format,
      width: uploadResponse.width,
      height: uploadResponse.height,
    };
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `File upload failed: ${error.message}`
    );
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID of the file
 * @returns {Promise<Object>} Cloudinary deletion response
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `File deletion failed: ${error.message}`
    );
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};

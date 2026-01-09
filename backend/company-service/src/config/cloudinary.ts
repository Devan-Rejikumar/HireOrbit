import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

let isConfigured = false;

const configureCloudinary = () => {
  if (!isConfigured) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    logger.debug('[Cloudinary] Checking configuration:', {
      hasCloudName: !!cloudName,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      cloudNameLength: cloudName?.length || 0,
      apiKeyLength: apiKey?.length || 0,
      apiSecretLength: apiSecret?.length || 0,
    });

    if (!cloudName || !apiKey || !apiSecret) {
      return false;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    isConfigured = true;
    return true;
  }
  return true;
};

configureCloudinary();

export default cloudinary;
export { configureCloudinary };


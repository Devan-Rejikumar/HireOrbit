import { v2 as cloudinary } from 'cloudinary';

// Lazy configuration - only configure when first used
let isConfigured = false;

const configureCloudinary = () => {
  if (!isConfigured) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    console.log('[Cloudinary] Checking configuration:', {
      hasCloudName: !!cloudName,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      cloudNameLength: cloudName?.length || 0,
      apiKeyLength: apiKey?.length || 0,
      apiSecretLength: apiSecret?.length || 0,
    });

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('[Cloudinary] Configuration missing. Required environment variables:');
      console.error('  - CLOUDINARY_CLOUD_NAME:', cloudName ? '✓ Set' : '✗ Missing');
      console.error('  - CLOUDINARY_API_KEY:', apiKey ? '✓ Set' : '✗ Missing');
      console.error('  - CLOUDINARY_API_SECRET:', apiSecret ? '✓ Set' : '✗ Missing');
      return false;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    isConfigured = true;
    console.log('[Cloudinary] Configuration loaded successfully');
    return true;
  }
  return true;
};

// Configure on module load if env vars are available
configureCloudinary();

export default cloudinary;
export { configureCloudinary };


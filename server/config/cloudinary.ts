import { v2 as cloudinary } from 'cloudinary';
import { config } from './index';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

export { cloudinary };

export function validateCloudinaryConfig(): boolean {
  return !!(
    config.cloudinary.cloudName &&
    config.cloudinary.apiKey &&
    config.cloudinary.apiSecret
  );
}

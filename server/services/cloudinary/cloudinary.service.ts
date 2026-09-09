import { UploadApiResponse, UploadApiOptions } from 'cloudinary';
import { cloudinary } from '../../config/cloudinary';

export interface UploadStreamOptions {
  folder?: string;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  allowedFormats?: string[];
  transformation?: object[];
  tags?: string[];
}

export interface CloudinaryUploadResult {
  publicId: string;
  resourceType: string;
  secureUrl: string;
  url: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
}

/**
 * Streams a buffer directly to Cloudinary using upload_stream.
 * This avoids any temporary file on disk.
 */
export function uploadStream(
  buffer: Buffer,
  options: UploadStreamOptions
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions: UploadApiOptions = {
      folder: options.folder,
      public_id: options.publicId,
      resource_type: options.resourceType ?? 'auto',
      allowed_formats: options.allowedFormats,
      transformation: options.transformation,
      tags: options.tags,
      use_filename: false,
      unique_filename: true,
      overwrite: false,
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error || !result) {
        return reject(error ?? new Error('Cloudinary upload returned no result'));
      }
      resolve({
        publicId: result.public_id,
        resourceType: result.resource_type,
        secureUrl: result.secure_url,
        url: result.url,
        format: result.format,
        width: result.width,
        height: result.height,
        duration: (result as any).duration,
        bytes: result.bytes,
      });
    });

    stream.end(buffer);
  });
}

/**
 * Destroys a Cloudinary asset by publicId.
 */
export async function deleteResource(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Generates an optimized/transformed Cloudinary URL without uploading.
 */
export function generateOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    format?: string;
    quality?: string | number;
    resourceType?: string;
  } = {}
): string {
  return cloudinary.url(publicId, {
    resource_type: (options.resourceType ?? 'image') as any,
    transformation: [
      {
        width: options.width,
        height: options.height,
        crop: options.crop ?? 'fill',
        fetch_format: options.format ?? 'auto',
        quality: options.quality ?? 'auto',
      },
    ],
    secure: true,
  });
}

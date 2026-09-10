import { UploadApiOptions } from 'cloudinary';
import { cloudinary } from '../../config/cloudinary';

export interface UploadStreamOptions {
  folder?: string;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  allowedFormats?: string[];
  transformation?: object[];
  tags?: string[];
  mimeType?: string;
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
 * Optimised for speed:
 *  - Images: quality=auto:low, fetch_format=auto (WebP/AVIF on supported browsers)
 *  - Audio/Video: no eager transforms (process async on Cloudinary side)
 *  - chunk_size=6MB so large files don't block the event loop
 */
export function uploadStream(
  buffer: Buffer,
  options: UploadStreamOptions
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const isImage = (options.resourceType === 'image') ||
      (!options.resourceType && options.mimeType?.startsWith('image/'));
    const isAudioOrVideo = options.resourceType === 'video'; // Cloudinary uses 'video' for audio too

    const uploadOptions: UploadApiOptions = {
      folder: options.folder,
      public_id: options.publicId,
      resource_type: options.resourceType ?? 'auto',
      tags: options.tags,
      use_filename: false,
      unique_filename: true,
      overwrite: false,
      // ── Speed optimisations ───────────────────────────────────────────────
      // Auto-select best format (WebP/AVIF for images) and quality — halves
      // average image file size without visible quality loss.
      ...(isImage && {
        quality: 'auto:low',
        fetch_format: 'auto',
        // Limit dimensions to 1920px — most screens never exceed this
        transformation: [
          { width: 1920, height: 1920, crop: 'limit' },
          ...(Array.isArray(options.transformation) ? options.transformation : []),
        ],
      }),
      // For audio/video: skip eager transforms so the response is instant.
      // Cloudinary processes async in the background.
      ...(isAudioOrVideo && {
        eager_async: true,          // do NOT block the response for video encoding
        eager_notification_url: undefined,
      }),
      // Upload in 6 MB chunks — prevents timeouts on large files over slow links
      chunk_size: 6 * 1024 * 1024,
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

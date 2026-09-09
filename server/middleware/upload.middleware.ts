import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// ── MIME allowlists ────────────────────────────────────────────────────────
const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ALLOWED_AUDIO_MIMES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/mp4',
  'audio/x-m4a',
]);

const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
]);

export const ALLOWED_ALL_MIMES = new Set([
  ...ALLOWED_IMAGE_MIMES,
  ...ALLOWED_AUDIO_MIMES,
  ...ALLOWED_VIDEO_MIMES,
]);

// ── Size limits (bytes) ────────────────────────────────────────────────────
const IMAGE_SIZE_LIMIT = 10 * 1024 * 1024;  // 10 MB
const AUDIO_SIZE_LIMIT = 25 * 1024 * 1024;  // 25 MB
const VIDEO_SIZE_LIMIT = 100 * 1024 * 1024; // 100 MB

function getFileSizeLimit(mimetype: string): number {
  if (ALLOWED_IMAGE_MIMES.has(mimetype)) return IMAGE_SIZE_LIMIT;
  if (ALLOWED_AUDIO_MIMES.has(mimetype)) return AUDIO_SIZE_LIMIT;
  if (ALLOWED_VIDEO_MIMES.has(mimetype)) return VIDEO_SIZE_LIMIT;
  return IMAGE_SIZE_LIMIT; // conservative fallback
}

// ── Multer configuration ───────────────────────────────────────────────────
// We use memory storage so buffers go straight to Cloudinary with no disk I/O.

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
) {
  if (ALLOWED_ALL_MIMES.has(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: image (JPEG/PNG/WebP/GIF), audio (MP3/WAV/OGG/WebM), video (MP4/WebM/MOV).`
      )
    );
  }
}

/**
 * General-purpose upload middleware (single field "file").
 * Max size is enforced dynamically per MIME in the controller after multer runs;
 * we set the absolute maximum (video) at the multer level to avoid OOM on large files.
 */
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: VIDEO_SIZE_LIMIT, // hard ceiling; per-type checks done post-parse
    files: 1,
  },
  fileFilter,
});

/**
 * Upload a single file under field name "file".
 */
export const uploadSingle = uploadMiddleware.single('file');

/**
 * Validates per-MIME size after multer has buffered the file.
 * Call this after uploadSingle in the route chain.
 */
export function validateFileSize(
  req: Request & { file?: Express.Multer.File }
): string | null {
  const file = req.file;
  if (!file) return null;
  const limit = getFileSizeLimit(file.mimetype);
  if (file.size > limit) {
    const limitMb = Math.round(limit / (1024 * 1024));
    return `File too large. Maximum allowed size for ${file.mimetype} is ${limitMb} MB.`;
  }
  return null;
}

/**
 * Infers DearYou media type from MIME type.
 */
export function inferMediaType(mimetype: string): 'image' | 'audio' | 'voice' | 'video' {
  if (ALLOWED_VIDEO_MIMES.has(mimetype)) return 'video';
  if (ALLOWED_AUDIO_MIMES.has(mimetype)) return 'audio';
  return 'image';
}

/**
 * Maps DearYou media type to Cloudinary resource_type.
 */
export function toCloudinaryResourceType(
  mediaType: string
): 'image' | 'video' | 'raw' | 'auto' {
  if (mediaType === 'video') return 'video';
  if (mediaType === 'audio' || mediaType === 'voice') return 'video'; // Cloudinary uses 'video' for audio
  return 'image';
}

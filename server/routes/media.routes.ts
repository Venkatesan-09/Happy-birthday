import { Router, Request, Response, NextFunction } from 'express';
import { MediaController } from '../controllers/media.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();

/**
 * Multer error handler: translates MulterError into a standardized JSON response
 * so it does not fall through to the generic error handler.
 */
function handleUploadErrors(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (err && err.code && err.code.startsWith('LIMIT_')) {
    // Multer size/files limit errors
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: err.message || 'Uploaded file exceeds the allowed size limit.',
      },
    });
  }
  if (err instanceof Error && !('code' in err)) {
    // MIME filter error thrown by fileFilter
    return res.status(415).json({
      success: false,
      error: {
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: err.message,
      },
    });
  }
  next(err);
}

// ── Creator Routes (JWT authenticated) ────────────────────────────────────

/**
 * POST /api/media/upload
 * Creator uploads a media file to their experience.
 * multipart/form-data: field "file" + body { experienceId, moduleId?, altText?, caption?, title? }
 */
router.post(
  '/upload',
  authenticate,
  uploadSingle,
  handleUploadErrors,
  MediaController.upload
);

/**
 * GET /api/media/experience/:experienceId
 * Lists all active media for an experience (creator only).
 * Query params: ?type=image|audio|voice|video
 */
router.get(
  '/experience/:experienceId',
  authenticate,
  MediaController.list
);

/**
 * DELETE /api/media/:mediaId
 * Soft-deletes a media record and removes the Cloudinary asset.
 */
router.delete(
  '/:mediaId',
  authenticate,
  MediaController.delete
);

// ── Contributor Route (token authenticated) ────────────────────────────────

/**
 * POST /api/media/contributor/:token
 * Contributor uploads a photo, audio, or video via their invite token.
 * multipart/form-data: field "file" + body { altText?, caption? }
 */
router.post(
  '/contributor/:token',
  uploadSingle,
  handleUploadErrors,
  MediaController.contributorUpload
);

export default router;

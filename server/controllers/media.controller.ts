import { Response, NextFunction, Request } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateFileSize } from '../middleware/upload.middleware';
import {
  creatorUpload,
  contributorUpload,
  listMediaForExperience,
  deleteMedia,
} from '../services/media.service';

export class MediaController {
  /**
   * POST /api/media/upload
   * Creator uploads a file to their experience.
   * Expects multipart/form-data with field "file" plus body fields:
   *   experienceId (required), moduleId, altText, caption, title
   */
  static async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // multer already parsed req.file at this point
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No file provided. Use field name "file".' },
        });
      }

      const sizeError = validateFileSize(req);
      if (sizeError) {
        return res.status(400).json({
          success: false,
          error: { code: 'FILE_TOO_LARGE', message: sizeError },
        });
      }

      const { experienceId, moduleId, altText, caption, title } = req.body;
      if (!experienceId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELD', message: 'experienceId is required.' },
        });
      }

      const media = await creatorUpload({
        file: req.file,
        experienceId,
        moduleId,
        altText,
        caption,
        title,
        userId: req.userId!,
      });

      return res.status(201).json({ success: true, data: media });
    } catch (error: any) {
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: { code: 'UPLOAD_FAILED', message: error.message },
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/media/experience/:experienceId
   * Lists all active media for an experience (creator only).
   */
  static async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { experienceId } = req.params;
      const { type } = req.query as { type?: string };

      const items = await listMediaForExperience(experienceId, req.userId!, type);
      return res.json({ success: true, data: items });
    } catch (error: any) {
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: { code: 'LIST_FAILED', message: error.message },
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/media/:mediaId
   * Soft-deletes a media record and removes the Cloudinary asset.
   */
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { mediaId } = req.params;
      await deleteMedia(mediaId, req.userId!);
      return res.json({ success: true, message: 'Media deleted successfully.' });
    } catch (error: any) {
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: { code: 'DELETE_FAILED', message: error.message },
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/media/contributor/:token
   * Contributor uploads a photo/audio/video via their invite token.
   * Expects multipart/form-data with field "file".
   */
  static async contributorUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No file provided. Use field name "file".' },
        });
      }

      const sizeError = validateFileSize(req as any);
      if (sizeError) {
        return res.status(400).json({
          success: false,
          error: { code: 'FILE_TOO_LARGE', message: sizeError },
        });
      }

      const { altText, caption } = req.body;
      const media = await contributorUpload({
        file: req.file,
        token,
        altText,
        caption,
      });

      return res.status(201).json({ success: true, data: media });
    } catch (error: any) {
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: { code: 'CONTRIBUTOR_UPLOAD_FAILED', message: error.message },
        });
      }
      next(error);
    }
  }
}

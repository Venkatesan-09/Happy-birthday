import { Request, Response, NextFunction } from 'express';
import { RecipientService } from '../services/recipient.service';

export class RecipientController {
  static async getExperience(req: Request, res: Response, next: NextFunction) {
    try {
      const accessHeader = req.headers['x-experience-access'] as string | undefined;
      const experience = await RecipientService.getExperienceBySlug(
        req.params.slug,
        accessHeader
      );
      res.status(200).json({
        success: true,
        data: experience,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const { password } = req.body;
      const token = await RecipientService.verifyPassword(req.params.slug, password);
      res.status(200).json({
        success: true,
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_SESSION_ID',
            message: 'Session ID is required in query params',
          },
        });
      }

      const progress = await RecipientService.getProgress(req.params.slug, sessionId);
      res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const progress = await RecipientService.updateProgress(req.params.slug, req.body);
      res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  }
}

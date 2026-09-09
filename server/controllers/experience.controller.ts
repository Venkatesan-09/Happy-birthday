import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ExperienceService } from '../services/experience.service';

export class ExperienceController {
  static async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const experiences = await ExperienceService.listByUser(req.userId!);
      res.status(200).json({
        success: true,
        data: experiences,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ExperienceService.getByIdWithModules(req.params.id);
      res.status(200).json({
        success: true,
        data: {
          ...result.experience.toJSON(),
          modules: result.modules,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const experience = await ExperienceService.create(req.userId!, req.body);
      const full = await ExperienceService.getByIdWithModules(experience._id.toString());
      res.status(201).json({
        success: true,
        data: {
          ...full.experience.toJSON(),
          modules: full.modules,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const updated = await ExperienceService.update(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await ExperienceService.delete(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Experience deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async duplicate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const duplicated = await ExperienceService.duplicate(req.params.id, req.userId!);
      const full = await ExperienceService.getByIdWithModules(duplicated._id.toString());
      res.status(201).json({
        success: true,
        data: {
          ...full.experience.toJSON(),
          modules: full.modules,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async publishCheck(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ExperienceService.publishCheck(req.params.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async publish(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ExperienceService.publish(req.params.id, req.userId!);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listVersions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const versions = await ExperienceService.listVersions(req.params.id);
      res.status(200).json({
        success: true,
        data: versions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async restoreVersion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const restored = await ExperienceService.restoreVersion(req.params.id, req.params.versionId);
      const full = await ExperienceService.getByIdWithModules(restored._id.toString());
      res.status(200).json({
        success: true,
        data: {
          ...full.experience.toJSON(),
          modules: full.modules,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

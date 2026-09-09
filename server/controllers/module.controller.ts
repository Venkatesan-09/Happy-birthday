import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ModuleService } from '../services/module.service';

export class ModuleController {
  static async addModule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const moduleDoc = await ModuleService.addModule(req.params.id, req.body);
      res.status(201).json({
        success: true,
        data: moduleDoc,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateModule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const updated = await ModuleService.updateModule(req.params.moduleId, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteModule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await ModuleService.deleteModule(req.params.moduleId);
      res.status(200).json({
        success: true,
        message: 'Module deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async reorderModules(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const modules = await ModuleService.reorderModules(req.params.id, req.body.moduleIds);
      res.status(200).json({
        success: true,
        data: modules,
      });
    } catch (error) {
      next(error);
    }
  }
}

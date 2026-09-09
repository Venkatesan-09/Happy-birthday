import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ContributorService } from '../services/contributor.service';

export class ContributorController {
  static async listContributors(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const contributors = await ContributorService.listContributors(req.params.id);
      res.status(200).json({
        success: true,
        data: contributors,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createContributor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, email } = req.body;
      const result = await ContributorService.createContributor(req.params.id, name, email);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteContributor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await ContributorService.removeContributor(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Contributor removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async listContributions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const contributions = await ContributorService.listContributions(req.params.id);
      res.status(200).json({
        success: true,
        data: contributions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async reviewContribution(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { approved, creatorNote } = req.body;
      const updated = await ContributorService.reviewContribution(
        req.params.id,
        approved,
        creatorNote
      );
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  // Public Contributor endpoints
  static async getInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ContributorService.getInvitationByToken(req.params.token);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async submitContribution(req: Request, res: Response, next: NextFunction) {
    try {
      const contribution = await ContributorService.submitContributionByToken(
        req.params.token,
        req.body
      );
      res.status(201).json({
        success: true,
        data: contribution,
      });
    } catch (error) {
      next(error);
    }
  }
}

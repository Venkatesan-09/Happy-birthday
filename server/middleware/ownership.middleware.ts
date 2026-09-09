import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from './auth.middleware';
import { Experience } from '../models/Experience';
import { Module } from '../models/Module';
import { Contributor } from '../models/Contributor';
import { Contribution } from '../models/Contribution';

/**
 * Ensures the authenticated user is the creator of the experience referenced in req.params.id or req.params.experienceId
 */
export async function requireExperienceOwner(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const experienceId = req.params.id || req.params.experienceId;
    if (!experienceId || !mongoose.Types.ObjectId.isValid(experienceId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Valid Experience ID is required.',
        },
      });
    }

    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Experience not found.',
        },
      });
    }

    if (experience.creatorId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access forbidden. You do not own this experience.',
        },
      });
    }

    (req as any).experience = experience;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Ensures the authenticated user owns the experience to which the module belongs
 */
export async function requireModuleOwner(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const moduleId = req.params.moduleId || req.params.id;
    if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Valid Module ID is required.',
        },
      });
    }

    const moduleDoc = await Module.findById(moduleId);
    if (!moduleDoc) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Module not found.',
        },
      });
    }

    const experience = await Experience.findById(moduleDoc.experienceId);
    if (!experience || experience.creatorId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access forbidden. You do not own the parent experience of this module.',
        },
      });
    }

    (req as any).module = moduleDoc;
    (req as any).experience = experience;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Ensures the authenticated user owns the experience to which the contributor belongs
 */
export async function requireContributorOwner(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const contributorId = req.params.id || req.params.contributorId;
    if (!contributorId || !mongoose.Types.ObjectId.isValid(contributorId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Valid Contributor ID is required.',
        },
      });
    }

    const contributor = await Contributor.findById(contributorId);
    if (!contributor) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contributor not found.',
        },
      });
    }

    const experience = await Experience.findById(contributor.experienceId);
    if (!experience || experience.creatorId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access forbidden. You do not own this experience.',
        },
      });
    }

    (req as any).contributor = contributor;
    (req as any).experience = experience;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Ensures the authenticated user owns the experience to which the contribution belongs
 */
export async function requireContributionOwner(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const contributionId = req.params.id || req.params.contributionId;
    if (!contributionId || !mongoose.Types.ObjectId.isValid(contributionId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Valid Contribution ID is required.',
        },
      });
    }

    const contribution = await Contribution.findById(contributionId);
    if (!contribution) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contribution not found.',
        },
      });
    }

    const experience = await Experience.findById(contribution.experienceId);
    if (!experience || experience.creatorId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access forbidden. You do not own this experience.',
        },
      });
    }

    (req as any).contribution = contribution;
    (req as any).experience = experience;
    next();
  } catch (error) {
    next(error);
  }
}

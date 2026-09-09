import { Router } from 'express';
import { ContributorController } from '../controllers/contributor.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  requireExperienceOwner,
  requireContributorOwner,
  requireContributionOwner,
} from '../middleware/ownership.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  contributorCreateSchema,
  contributionSubmitSchema,
  contributionReviewSchema,
} from '../validators';

const router = Router();

// --- Creator Protected Routes ---
router.get(
  '/experiences/:id/contributors',
  authenticate,
  requireExperienceOwner,
  ContributorController.listContributors
);

router.post(
  '/experiences/:id/contributors',
  authenticate,
  requireExperienceOwner,
  validateBody(contributorCreateSchema),
  ContributorController.createContributor
);

router.delete(
  '/contributors/:id',
  authenticate,
  requireContributorOwner,
  ContributorController.deleteContributor
);

router.get(
  '/experiences/:id/contributions',
  authenticate,
  requireExperienceOwner,
  ContributorController.listContributions
);

router.patch(
  '/contributions/:id/review',
  authenticate,
  requireContributionOwner,
  validateBody(contributionReviewSchema),
  ContributorController.reviewContribution
);

// --- Public Contributor Invitation Routes ---
router.get('/contributor/invitations/:token', ContributorController.getInvitation);
router.post(
  '/contributor/invitations/:token/contributions',
  validateBody(contributionSubmitSchema),
  ContributorController.submitContribution
);

export default router;

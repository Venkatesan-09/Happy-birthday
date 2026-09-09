import { Router } from 'express';
import { ExperienceController } from '../controllers/experience.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireExperienceOwner } from '../middleware/ownership.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { experienceCreateSchema, experienceUpdateSchema } from '../validators';

const router = Router();

// All experience management routes require creator authentication
router.use(authenticate);

router.get('/', ExperienceController.list);
router.post('/', validateBody(experienceCreateSchema), ExperienceController.create);
router.get('/:id', requireExperienceOwner, ExperienceController.getById);
router.patch('/:id', requireExperienceOwner, validateBody(experienceUpdateSchema), ExperienceController.update);
router.delete('/:id', requireExperienceOwner, ExperienceController.delete);
router.post('/:id/duplicate', requireExperienceOwner, ExperienceController.duplicate);
router.get('/:id/publish-check', requireExperienceOwner, ExperienceController.publishCheck);
router.post('/:id/publish', requireExperienceOwner, ExperienceController.publish);
router.get('/:id/versions', requireExperienceOwner, ExperienceController.listVersions);
router.post('/:id/versions/:versionId/restore', requireExperienceOwner, ExperienceController.restoreVersion);

export default router;

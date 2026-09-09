import { Router } from 'express';
import { RecipientController } from '../controllers/recipient.controller';
import { validateBody } from '../middleware/validate.middleware';
import { publicAccessSchema, recipientProgressSchema } from '../validators';

const router = Router();

// Public recipient endpoints
router.get('/experiences/:slug', RecipientController.getExperience);
router.post('/experiences/:slug/access', validateBody(publicAccessSchema), RecipientController.verifyAccess);
router.get('/experiences/:slug/progress', RecipientController.getProgress);
router.patch('/experiences/:slug/progress', validateBody(recipientProgressSchema), RecipientController.updateProgress);

export default router;

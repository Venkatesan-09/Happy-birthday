import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { aiGenerateSchema } from '../validators';

const router = Router();

router.post('/generate', authenticate, validateBody(aiGenerateSchema), AIController.generate);
router.post('/translate', AIController.translate);

export default router;

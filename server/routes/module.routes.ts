import { Router } from 'express';
import { ModuleController } from '../controllers/module.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireExperienceOwner, requireModuleOwner } from '../middleware/ownership.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { moduleCreateSchema, moduleUpdateSchema, moduleReorderSchema } from '../validators';

const router = Router();

router.use(authenticate);

// Module creation and reordering scoped to an experience (mounted under /api/experiences)
router.post('/:id/modules', requireExperienceOwner, validateBody(moduleCreateSchema), ModuleController.addModule);
router.post('/:id/modules/reorder', requireExperienceOwner, validateBody(moduleReorderSchema), ModuleController.reorderModules);

// Module modification and deletion by moduleId (mounted under /api/modules)
router.patch('/:moduleId', requireModuleOwner, validateBody(moduleUpdateSchema), ModuleController.updateModule);
router.delete('/:moduleId', requireModuleOwner, ModuleController.deleteModule);

export default router;

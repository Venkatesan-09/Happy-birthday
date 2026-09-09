import { Router, Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';

const router = Router();

router.post('/track', async (req: Request, res: Response) => {
  try {
    const { event, experienceId, properties } = req.body;
    await AuditLog.create({
      actorType: 'recipient',
      action: event || 'page_view',
      targetId: experienceId || null,
      targetType: 'experience',
      metadata: properties || {},
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    }).catch(() => {});

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(200).json({ success: true });
  }
});

export default router;

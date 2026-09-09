import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateAIContent, translateText } from '../gemini';
import { AIGeneration } from '../models/AIGeneration';

export class AIController {
  static async generate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type, params, experienceId } = req.body;
      const result = await generateAIContent({
        type: (type || 'LETTER').toUpperCase(),
        ...(params || {}),
      } as any);

      // Record AI Generation for audit & analytics
      await AIGeneration.create({
        experienceId: experienceId || null,
        userId: req.userId || null,
        promptType: type,
        prompt: JSON.stringify(params || {}),
        response: typeof result === 'string' ? result : JSON.stringify(result),
        generationModel: 'gemini-2.5-flash',
      }).catch((err) => console.warn('[AI Logger] Failed to save generation log:', err.message));

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async translate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { text, targetLanguage, sourceLanguage } = req.body;
      if (!text || !targetLanguage) {
        res.status(400).json({ success: false, error: { message: 'text and targetLanguage are required' } });
        return;
      }
      const result = await translateText({ text, targetLanguage, sourceLanguage });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

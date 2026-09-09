import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;
      const { user, token } = await AuthService.register(name, email, password);

      res.status(201).json({
        success: true,
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { user, token } = await AuthService.login(email, password);

      res.status(200).json({
        success: true,
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response) {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { config } from '../config';

export class AuthService {
  static async register(name: string, email: string, password: string):Promise<{ user: IUser; token: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const error: any = new Error('A user with this email address already exists.');
      error.statusCode = 409;
      error.code = 'USER_ALREADY_EXISTS';
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const token = this.generateToken(user._id.toString());
    return { user, token };
  }

  static async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const error: any = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const token = this.generateToken(user._id.toString());
    return { user, token };
  }

  static generateToken(userId: string): string {
    return jwt.sign({ userId }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as jwt.SignOptions);
  }
}

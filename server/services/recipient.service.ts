import bcrypt from 'bcryptjs';
import { Experience } from '../models/Experience';
import { Module } from '../models/Module';
import { Contribution } from '../models/Contribution';
import { RecipientSession } from '../models/RecipientSession';
import { hashToken } from '../utils';

export class RecipientService {
  /**
   * Fetches public experience by slug, stripping sensitive data.
   * If password protected, verifies password token.
   */
  static async getExperienceBySlug(slug: string, accessHeader?: string): Promise<any> {
    const experience = await Experience.findOne({ slug: slug.toLowerCase() });
    if (!experience) {
      const error: any = new Error('Experience not found');
      error.statusCode = 404;
      throw error;
    }

    // Check expiration
    if (experience.expiresAt && new Date() > experience.expiresAt) {
      const error: any = new Error('This birthday experience has expired.');
      error.statusCode = 410;
      throw error;
    }

    // Check password protection
    if (experience.privacy?.type === 'password' && experience.privacy.passwordHash) {
      const expectedToken = hashToken(`unlocked_${experience._id.toString()}`);
      if (!accessHeader || accessHeader !== expectedToken) {
        return {
          id: experience._id,
          slug: experience.slug,
          requiresPassword: true,
          theme: experience.theme,
          recipient: {
            name: experience.recipient?.name,
            nickname: experience.recipient?.nickname,
          },
        };
      }
    }

    // Fetch ordered enabled modules
    const modules = await Module.find({
      experienceId: experience._id,
      enabled: true,
    }).sort({ position: 1 });

    // Fetch only approved contributions
    const approvedContributions = await Contribution.find({
      experienceId: experience._id,
      approved: true,
    }).sort({ createdAt: -1 });

    // Sanitize modules: for wishes/guestbook/PEOPLE modules, dynamically inject approved contributions
    const sanitizedModules = modules.map((mod) => {
      const modObj = mod.toJSON();
      if (
        mod.type === 'guestbook' ||
        mod.type === 'wishes' ||
        mod.type === 'PEOPLE' ||
        mod.type === 'people'
      ) {
        const existingWishes = Array.isArray(modObj.content?.wishes)
          ? [...modObj.content.wishes]
          : [];

        for (const ctb of approvedContributions) {
          const ctbId = ctb._id.toString();
          const existingIdx = existingWishes.findIndex(
            (w: any) =>
              w.contributionId === ctbId ||
              w.id === `w_${ctbId}` ||
              w.id === ctbId
          );

          const mediaUrl =
            ctb.media?.url ||
            (typeof ctb.media === 'string' ? ctb.media : undefined);
          const isVideo =
            ctb.type === 'video' ||
            (Boolean(mediaUrl) && /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(mediaUrl));

          const formattedItem = {
            id: `w_${ctbId}`,
            contributionId: ctbId,
            name: ctb.contributorName,
            relationship: ctb.relationship || 'Friend',
            message: ctb.message,
            mediaUrl,
            media:
              ctb.media ||
              (mediaUrl ? { url: mediaUrl, type: isVideo ? 'video' : 'photo' } : undefined),
            type: isVideo ? 'video' : mediaUrl ? 'photo' : 'message',
            createdAt: 'Recently',
          };

          if (existingIdx >= 0) {
            existingWishes[existingIdx] = {
              ...existingWishes[existingIdx],
              ...formattedItem,
            };
          } else {
            existingWishes.push(formattedItem);
          }
        }

        modObj.content = {
          ...modObj.content,
          wishes: existingWishes,
        };
      }
      return modObj;
    });

    const expObj = experience.toJSON();
    delete expObj.privacy?.passwordHash;

    return {
      ...expObj,
      modules: sanitizedModules,
      contributions: approvedContributions,
    };
  }

  /**
   * Verifies password against bcrypt hash.
   * NO BACKDOORS (removed 'teddy', 'birthday', etc.).
   */
  static async verifyPassword(slug: string, passwordAttempt: string): Promise<string> {
    const experience = await Experience.findOne({ slug: slug.toLowerCase() });
    if (!experience) {
      const error: any = new Error('Experience not found');
      error.statusCode = 404;
      throw error;
    }

    if (experience.privacy?.type !== 'password' || !experience.privacy.passwordHash) {
      // Experience doesn't require password
      return hashToken(`unlocked_${experience._id.toString()}`);
    }

    const isMatch = await bcrypt.compare(passwordAttempt, experience.privacy.passwordHash);
    if (!isMatch) {
      const error: any = new Error('Incorrect password');
      error.statusCode = 401;
      error.code = 'INVALID_PASSWORD';
      throw error;
    }

    return hashToken(`unlocked_${experience._id.toString()}`);
  }

  static async getProgress(slug: string, sessionId: string): Promise<any> {
    const experience = await Experience.findOne({ slug: slug.toLowerCase() });
    if (!experience) {
      const error: any = new Error('Experience not found');
      error.statusCode = 404;
      throw error;
    }

    let session = await RecipientSession.findOne({
      experienceId: experience._id,
      sessionId,
    });

    if (!session) {
      session = await RecipientSession.create({
        experienceId: experience._id,
        sessionId,
        completedModules: [],
        discoveredSecrets: [],
        gamesCompleted: [],
        progress: 0,
      });
    }

    return session;
  }

  static async updateProgress(slug: string, data: any): Promise<any> {
    const experience = await Experience.findOne({ slug: slug.toLowerCase() });
    if (!experience) {
      const error: any = new Error('Experience not found');
      error.statusCode = 404;
      throw error;
    }

    const { sessionId, completedModuleId, discoveredSecret, completedGame, progress } = data;

    let session = await RecipientSession.findOne({
      experienceId: experience._id,
      sessionId,
    });

    if (!session) {
      session = new RecipientSession({
        experienceId: experience._id,
        sessionId,
        completedModules: [],
        discoveredSecrets: [],
        gamesCompleted: [],
        progress: 0,
      });
    }

    if (completedModuleId && !session.completedModules.includes(completedModuleId)) {
      session.completedModules.push(completedModuleId);
    }
    if (discoveredSecret && !session.discoveredSecrets.includes(discoveredSecret)) {
      session.discoveredSecrets.push(discoveredSecret);
    }
    if (completedGame && !session.gamesCompleted.includes(completedGame)) {
      session.gamesCompleted.push(completedGame);
    }
    if (typeof progress === 'number') {
      session.progress = Math.max(session.progress, progress);
    }

    session.lastVisitedAt = new Date();
    await session.save();

    return session;
  }
}

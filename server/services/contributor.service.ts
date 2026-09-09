import mongoose from 'mongoose';
import { Contributor, IContributor } from '../models/Contributor';
import { Contribution, IContribution } from '../models/Contribution';
import { Module } from '../models/Module';
import { Experience } from '../models/Experience';
import { generateToken, hashToken } from '../utils';

export class ContributorService {
  static async listContributors(experienceId: string): Promise<IContributor[]> {
    return Contributor.find({
      experienceId: new mongoose.Types.ObjectId(experienceId),
    }).sort({ createdAt: -1 });
  }

  static async createContributor(
    experienceId: string,
    name: string,
    email?: string
  ): Promise<{ contributor: IContributor; inviteToken: string }> {
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);

    const contributor = await Contributor.create({
      experienceId: new mongoose.Types.ObjectId(experienceId),
      name: name.trim(),
      email: (email || '').toLowerCase().trim(),
      token: rawToken,
      inviteToken: rawToken,
      tokenHash,
      status: 'invited',
    });

    return { contributor, inviteToken: rawToken };
  }

  static async removeContributor(contributorId: string): Promise<void> {
    await Contributor.findByIdAndDelete(contributorId);
  }

  static async listContributions(experienceId: string): Promise<IContribution[]> {
    return Contribution.find({
      experienceId: new mongoose.Types.ObjectId(experienceId),
    }).sort({ createdAt: -1 });
  }

  static async reviewContribution(
    contributionId: string,
    approved: boolean,
    creatorNote?: string
  ): Promise<IContribution | null> {
    const contribution = await Contribution.findByIdAndUpdate(
      contributionId,
      {
        $set: {
          approved,
          reviewStatus: approved ? 'approved' : 'rejected',
          creatorNote: creatorNote || '',
        },
      },
      { new: true }
    );

    if (!contribution) return null;

    // Directly sync with the 'People Who Love You' (PEOPLE) module
    try {
      if (approved) {
        let peopleModule = await Module.findOne({
          experienceId: contribution.experienceId,
          type: { $in: ['PEOPLE', 'people'] },
        });

        const mediaUrl =
          contribution.media?.url ||
          (typeof contribution.media === 'string' ? contribution.media : '');
        const isVideo =
          contribution.type === 'video' ||
          (Boolean(mediaUrl) && /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(mediaUrl));

        const wishItem = {
          id: `w_${contribution._id.toString()}`,
          contributionId: contribution._id.toString(),
          name: contribution.contributorName,
          relationship: contribution.relationship || 'Friend',
          message: contribution.message,
          mediaUrl: mediaUrl || undefined,
          media:
            contribution.media ||
            (mediaUrl ? { url: mediaUrl, type: isVideo ? 'video' : 'photo' } : undefined),
          type: isVideo ? 'video' : mediaUrl ? 'photo' : 'message',
          createdAt: 'Recently',
        };

        if (!peopleModule) {
          const lastMod = await Module.findOne({
            experienceId: contribution.experienceId,
          }).sort({ position: -1 });
          const position = lastMod ? lastMod.position + 1 : 0;

          await Module.create({
            experienceId: contribution.experienceId,
            type: 'PEOPLE',
            position,
            enabled: true,
            title: 'People Who Love You',
            subtitle: 'A wall of heartfelt messages from friends & family',
            content: {
              title: 'Words from Your Circle 💕',
              subtitle: 'People who care about you took a moment to leave their birthday blessings.',
              allowPublicSubmissions: true,
              wishes: [wishItem],
            },
          });
        } else {
          const currentContent = peopleModule.content || {};
          const existingWishes = Array.isArray(currentContent.wishes)
            ? [...currentContent.wishes]
            : [];
          const existingIndex = existingWishes.findIndex(
            (w: any) =>
              w.contributionId === contribution._id.toString() ||
              w.id === `w_${contribution._id.toString()}`
          );

          if (existingIndex >= 0) {
            existingWishes[existingIndex] = {
              ...existingWishes[existingIndex],
              ...wishItem,
            };
          } else {
            existingWishes.push(wishItem);
          }

          peopleModule.content = {
            ...currentContent,
            wishes: existingWishes,
          };
          peopleModule.markModified('content');
          await peopleModule.save();
        }
      } else {
        // If rejected, remove from PEOPLE module
        const peopleModule = await Module.findOne({
          experienceId: contribution.experienceId,
          type: { $in: ['PEOPLE', 'people'] },
        });
        if (peopleModule && peopleModule.content && Array.isArray(peopleModule.content.wishes)) {
          peopleModule.content.wishes = peopleModule.content.wishes.filter(
            (w: any) =>
              w.contributionId !== contribution._id.toString() &&
              w.id !== `w_${contribution._id.toString()}`
          );
          peopleModule.markModified('content');
          await peopleModule.save();
        }
      }
    } catch (syncErr) {
      console.error('Error syncing contribution to PEOPLE module:', syncErr);
    }

    return contribution;
  }

  static async getInvitationByToken(token: string): Promise<{ contributor: IContributor; experience: any }> {
    if (!token || token === 'undefined' || token === 'null') {
      const error: any = new Error('Invalid or expired invitation token');
      error.statusCode = 404;
      throw error;
    }

    const tokenHash = hashToken(token);
    const contributor = await Contributor.findOne({
      $or: [
        { token },
        { inviteToken: token },
        { tokenHash },
      ],
    });
    if (!contributor) {
      const error: any = new Error('Invalid or expired invitation token');
      error.statusCode = 404;
      throw error;
    }

    if (contributor.expiresAt && new Date() > contributor.expiresAt) {
      const error: any = new Error('This invitation link has expired');
      error.statusCode = 410;
      throw error;
    }

    const experience = await Experience.findById(contributor.experienceId);
    if (!experience) {
      const error: any = new Error('Experience no longer exists');
      error.statusCode = 404;
      throw error;
    }

    return {
      contributor,
      experience: {
        id: experience._id,
        recipient: experience.recipient,
        theme: experience.theme,
      },
    };
  }

  static async submitContributionByToken(token: string, data: any): Promise<IContribution> {
    const { contributor, experience } = await this.getInvitationByToken(token);

    const mediaUrl = data.mediaUrl || data.media?.url || (typeof data.media === 'string' ? data.media : '');
    const isVideo =
      data.type === 'video' ||
      (Boolean(mediaUrl) && /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(mediaUrl));

    let mediaObj = data.media || null;
    if (!mediaObj && mediaUrl) {
      mediaObj = {
        url: mediaUrl,
        type: isVideo ? 'video' : 'photo',
      };
    }

    const determinedType = data.type || (isVideo ? 'video' : mediaUrl ? 'photo' : 'message');

    const contribution = await Contribution.create({
      experienceId: experience.id,
      contributorId: contributor._id,
      contributorName: data.contributorName || contributor.name,
      relationship: data.relationship || '',
      type: determinedType,
      message: data.message || '',
      media: mediaObj,
      approved: false, // Requires creator approval before appearing
      reviewStatus: 'pending',
    });

    contributor.status = 'submitted';
    await contributor.save();

    return contribution;
  }
}

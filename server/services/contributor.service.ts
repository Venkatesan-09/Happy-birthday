import mongoose from 'mongoose';
import { Contributor, IContributor } from '../models/Contributor';
import { Contribution, IContribution } from '../models/Contribution';
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
    return Contribution.findByIdAndUpdate(
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

    const contribution = await Contribution.create({
      experienceId: experience.id,
      contributorId: contributor._id,
      contributorName: data.contributorName || contributor.name,
      relationship: data.relationship || '',
      type: data.type || 'message',
      message: data.message || '',
      media: data.media || null,
      approved: false, // Requires creator approval before appearing
      reviewStatus: 'pending',
    });

    contributor.status = 'submitted';
    await contributor.save();

    return contribution;
  }
}

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Experience, IExperience } from '../models/Experience';
import { Module, IModule } from '../models/Module';
import { ExperienceVersion } from '../models/ExperienceVersion';
import { generateSlug } from '../utils';

export class ExperienceService {
  static async listByUser(userId: string): Promise<IExperience[]> {
    return Experience.find({ creatorId: new mongoose.Types.ObjectId(userId) }).sort({
      updatedAt: -1,
    });
  }

  static async getByIdWithModules(id: string): Promise<{ experience: IExperience; modules: IModule[] }> {
    const experience = await Experience.findById(id);
    if (!experience) {
      const error: any = new Error('Experience not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const modules = await Module.find({
      experienceId: experience._id,
    }).sort({ position: 1 });

    return { experience, modules };
  }

  static async create(userId: string, data: any): Promise<IExperience> {
    const slug = generateSlug(data.recipient?.name || 'birthday');

    let passwordHash: string | undefined = undefined;
    if (data.privacy?.type === 'password' && data.privacy?.password) {
      passwordHash = await bcrypt.hash(data.privacy.password, 10);
    }

    const experience = await Experience.create({
      creatorId: new mongoose.Types.ObjectId(userId),
      slug,
      recipient: {
        name: data.recipient?.name,
        nickname: data.recipient?.nickname || '',
        relationship: data.recipient?.relationship || '',
        birthday: data.recipient?.birthday || '',
      },
      theme: data.theme || undefined,
      privacy: {
        type: data.privacy?.type || 'public',
        passwordHash,
      },
      settings: data.settings || {},
      status: 'draft',
    });

    // If initial modules are provided (like the frontend templates pass)
    if (Array.isArray(data.modules) && data.modules.length > 0) {
      const moduleDocs = data.modules.map((m: any, index: number) => ({
        experienceId: experience._id,
        type: m.type,
        position: typeof m.position === 'number' ? m.position : index,
        enabled: m.enabled !== false,
        title: m.title || '',
        subtitle: m.subtitle || '',
        content: m.content || {},
        settings: m.settings || {},
        style: m.style || {},
      }));

      await Module.insertMany(moduleDocs);
    }

    return experience;
  }

  static async update(id: string, data: any): Promise<IExperience | null> {
    const updatePayload: any = {};

    if (data.recipient) updatePayload.recipient = data.recipient;
    if (data.theme) updatePayload.theme = data.theme;
    if (data.status) updatePayload.status = data.status;
    if (data.settings) updatePayload.settings = data.settings;
    if (data.expiresAt !== undefined) updatePayload.expiresAt = data.expiresAt;

    if (data.privacy) {
      updatePayload.privacy = {
        type: data.privacy.type || 'public',
      };
      if (data.privacy.password) {
        updatePayload.privacy.passwordHash = await bcrypt.hash(data.privacy.password, 10);
      }
    }

    return Experience.findByIdAndUpdate(id, { $set: updatePayload }, { new: true });
  }

  static async delete(id: string): Promise<void> {
    const expId = new mongoose.Types.ObjectId(id);
    await Experience.findByIdAndDelete(expId);
    await Module.deleteMany({ experienceId: expId });
  }

  static async duplicate(id: string, userId: string): Promise<IExperience> {
    const original = await Experience.findById(id);
    if (!original) {
      const error: any = new Error('Original experience not found');
      error.statusCode = 404;
      throw error;
    }

    const newSlug = generateSlug(`${original.recipient.name}-copy`);
    const copyExp = await Experience.create({
      creatorId: new mongoose.Types.ObjectId(userId),
      slug: newSlug,
      recipient: { ...original.recipient },
      theme: { ...original.theme },
      privacy: { ...original.privacy },
      settings: original.settings ? { ...original.settings } : {},
      status: 'draft',
    });

    const originalModules = await Module.find({ experienceId: original._id });
    if (originalModules.length > 0) {
      const clonedModules = originalModules.map((m) => ({
        experienceId: copyExp._id,
        type: m.type,
        position: m.position,
        enabled: m.enabled,
        title: m.title,
        subtitle: m.subtitle,
        content: m.content,
        settings: m.settings,
        style: m.style,
      }));
      await Module.insertMany(clonedModules);
    }

    return copyExp;
  }

  static async publishCheck(id: string): Promise<any> {
    const experience = await Experience.findById(id);
    if (!experience) {
      const error: any = new Error('Experience not found');
      error.statusCode = 404;
      throw error;
    }

    const modules = await Module.find({ experienceId: experience._id });
    const checks = [
      {
        id: 'recipient_name',
        label: 'Recipient name is set',
        passed: Boolean(experience.recipient?.name?.trim()),
        severity: 'error',
      },
      {
        id: 'has_modules',
        label: 'At least one module is configured and enabled',
        passed: modules.some((m) => m.enabled),
        severity: 'error',
      },
      {
        id: 'theme_ready',
        label: 'Theme is configured',
        passed: Boolean(experience.theme?.primaryColor),
        severity: 'warning',
      },
    ];

    const canPublish = checks.filter((c) => c.severity === 'error').every((c) => c.passed);
    const readyCount = checks.filter((c) => c.passed).length;

    return {
      canPublish,
      checks,
      readyCount,
      totalCount: checks.length,
    };
  }

  static async publish(id: string, userId: string): Promise<{ experience: IExperience; version: any }> {
    const { experience, modules } = await this.getByIdWithModules(id);

    // Increment version number
    const lastVersion = await ExperienceVersion.findOne({ experienceId: experience._id }).sort({
      versionNumber: -1,
    });
    const versionNumber = (lastVersion?.versionNumber || 0) + 1;

    // Create immutable snapshot
    const snapshot = {
      experience: experience.toJSON(),
      modules: modules.map((m) => m.toJSON()),
      publishedAt: new Date(),
    };

    const version = await ExperienceVersion.create({
      experienceId: experience._id,
      versionNumber,
      snapshot,
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    experience.status = 'published';
    experience.publishedAt = new Date();
    await experience.save();

    return { experience, version };
  }

  static async listVersions(id: string): Promise<any[]> {
    return ExperienceVersion.find({ experienceId: new mongoose.Types.ObjectId(id) }).sort({
      versionNumber: -1,
    });
  }

  static async restoreVersion(id: string, versionId: string): Promise<IExperience> {
    const version = await ExperienceVersion.findById(versionId);
    if (!version || version.experienceId.toString() !== id) {
      const error: any = new Error('Version snapshot not found');
      error.statusCode = 404;
      throw error;
    }

    const { experience: expSnapshot, modules: modSnapshots } = version.snapshot;

    // Restore experience details safely
    const exp = await Experience.findById(id);
    if (!exp) {
      const error: any = new Error('Experience not found');
      error.statusCode = 404;
      throw error;
    }

    if (expSnapshot.theme) exp.theme = expSnapshot.theme;
    if (expSnapshot.settings) exp.settings = expSnapshot.settings;
    if (expSnapshot.recipient) exp.recipient = expSnapshot.recipient;
    await exp.save();

    // Recreate modules from snapshot
    if (Array.isArray(modSnapshots)) {
      await Module.deleteMany({ experienceId: exp._id });
      const modulesToInsert = modSnapshots.map((m: any) => ({
        experienceId: exp._id,
        type: m.type,
        position: m.position,
        enabled: m.enabled,
        title: m.title,
        subtitle: m.subtitle,
        content: m.content,
        settings: m.settings,
        style: m.style,
      }));
      await Module.insertMany(modulesToInsert);
    }

    return exp;
  }
}

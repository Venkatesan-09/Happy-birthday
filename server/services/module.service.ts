import mongoose from 'mongoose';
import { Module, IModule } from '../models/Module';

export class ModuleService {
  static async addModule(experienceId: string, data: any): Promise<IModule> {
    const count = await Module.countDocuments({
      experienceId: new mongoose.Types.ObjectId(experienceId),
    });

    const position = typeof data.position === 'number' ? data.position : count;

    const moduleDoc = await Module.create({
      experienceId: new mongoose.Types.ObjectId(experienceId),
      type: data.type,
      position,
      enabled: data.enabled !== false,
      title: data.title || '',
      subtitle: data.subtitle || '',
      content: data.content || {},
      settings: data.settings || {},
      style: data.style || {},
    });

    return moduleDoc;
  }

  static async updateModule(moduleId: string, data: any): Promise<IModule | null> {
    return Module.findByIdAndUpdate(
      moduleId,
      { $set: data },
      { new: true }
    );
  }

  static async deleteModule(moduleId: string): Promise<void> {
    await Module.findByIdAndDelete(moduleId);
  }

  static async reorderModules(experienceId: string, moduleIds: string[]): Promise<IModule[]> {
    const expObjId = new mongoose.Types.ObjectId(experienceId);

    const updatePromises = moduleIds.map((id, index) =>
      Module.updateOne(
        { _id: new mongoose.Types.ObjectId(id), experienceId: expObjId },
        { $set: { position: index } }
      )
    );

    await Promise.all(updatePromises);

    return Module.find({ experienceId: expObjId }).sort({ position: 1 });
  }
}

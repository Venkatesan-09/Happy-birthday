import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Media, IMedia } from '../models/Media';
import { Experience } from '../models/Experience';
import { Contributor } from '../models/Contributor';
import {
  uploadStream,
  deleteResource,
  CloudinaryUploadResult,
} from './cloudinary/cloudinary.service';
import { inferMediaType, toCloudinaryResourceType } from '../middleware/upload.middleware';
import { hashToken } from '../utils';

// Helper to save uploaded file locally if Cloudinary is unavailable or returns 403
function saveLocalMedia(file: Express.Multer.File): { url: string; publicId: string } {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const ext = path.extname(file.originalname) || '';
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, file.buffer);
  return {
    url: `/uploads/${filename}`,
    publicId: filename,
  };
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface CreatorUploadInput {
  file: Express.Multer.File;
  experienceId: string;
  moduleId?: string;
  altText?: string;
  caption?: string;
  title?: string;
  userId: string;
}

export interface ContributorUploadInput {
  file: Express.Multer.File;
  token: string;
  altText?: string;
  caption?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildCloudinaryFolder(experienceId: string, mediaType: string): string {
  return `dearyou/experiences/${experienceId}/${mediaType}`;
}

async function verifyExperienceOwnership(
  experienceId: string,
  userId: string
): Promise<void> {
  const exp = await Experience.findById(experienceId).select('creatorId').lean();
  if (!exp) {
    throw Object.assign(new Error('Experience not found'), { status: 404 });
  }
  if (exp.creatorId.toString() !== userId) {
    throw Object.assign(new Error('You do not own this experience'), { status: 403 });
  }
}

// ── Service Methods ────────────────────────────────────────────────────────

/**
 * Handles creator media upload: verifies ownership, streams to Cloudinary,
 * stores metadata in MongoDB.
 */
export async function creatorUpload(input: CreatorUploadInput): Promise<IMedia> {
  const { file, experienceId, moduleId, altText, caption, title, userId } = input;

  // 1. Verify creator owns this experience
  await verifyExperienceOwnership(experienceId, userId);

  // 2. Determine media type and Cloudinary resource type
  const mediaType = inferMediaType(file.mimetype);
  const cloudinaryResourceType = toCloudinaryResourceType(mediaType);

  let result: CloudinaryUploadResult | null = null;
  try {
    // 3. Upload to Cloudinary
    // Timeout: 90s — videos up to 100 MB need time on Render's free tier.
    const folder = buildCloudinaryFolder(experienceId, mediaType);
    const uploadPromise = uploadStream(file.buffer, {
      folder,
      resourceType: cloudinaryResourceType,
      mimeType: file.mimetype,
      tags: ['dearyou', `exp_${experienceId}`, `creator_${userId}`],
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Cloudinary upload timed out after 90s — check your Cloudinary plan limits or file size')), 90_000)
    );
    result = await Promise.race([uploadPromise, timeoutPromise]);
  } catch (cloudErr: any) {
    console.warn(`[MediaService] Cloudinary upload failed (${cloudErr.message}). Storing locally as fallback.`);
    // Fallback: store locally on server
    const local = saveLocalMedia(file);
    result = {
      publicId: local.publicId,
      resourceType: cloudinaryResourceType,
      secureUrl: local.url,
      url: local.url,
      format: path.extname(file.originalname).replace(/^\./, '') || 'bin',
      bytes: file.size,
    };
  }

  // 4. Save Media record in MongoDB
  const media = await Media.create({
    experienceId: new mongoose.Types.ObjectId(experienceId),
    moduleId: moduleId ? new mongoose.Types.ObjectId(moduleId) : null,
    type: mediaType,
    originalFilename: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    cloudinary: {
      publicId:     result.publicId,
      resourceType: result.resourceType,
      secureUrl:    result.secureUrl,
      url:          result.url,
      format:       result.format,
      width:        result.width,
      height:       result.height,
      duration:     result.duration,
      bytes:        result.bytes,
    },
    uploadedBy: {
      kind:   'CREATOR',
      userId: new mongoose.Types.ObjectId(userId),
    },
    metadata: { altText, caption, title },
    status: 'active',
  });

  return media;
}

/**
 * Handles contributor media upload: verifies invite token, streams to Cloudinary,
 * stores metadata in MongoDB.
 */
export async function contributorUpload(input: ContributorUploadInput): Promise<IMedia> {
  const { file, token, altText, caption } = input;

  // 1. Resolve contributor by invite token
  const contributor = await Contributor.findOne({
    $or: [
      { token },
      { inviteToken: token },
      { tokenHash: hashToken(token) },
    ],
  }).lean();
  if (!contributor) {
    throw Object.assign(new Error('Invalid or expired contributor token'), { status: 401 });
  }
  if (contributor.status === 'submitted') {
    throw Object.assign(new Error('This contribution has already been submitted'), { status: 409 });
  }

  const experienceId = contributor.experienceId.toString();

  // 2. Determine types and upload
  const mediaType = inferMediaType(file.mimetype);
  const cloudinaryResourceType = toCloudinaryResourceType(mediaType);

  let result: CloudinaryUploadResult | null = null;
  try {
    // 2b. Upload to Cloudinary with 90s timeout
    const folder = buildCloudinaryFolder(experienceId, `contributors/${mediaType}`);
    const uploadPromise = uploadStream(file.buffer, {
      folder,
      resourceType: cloudinaryResourceType,
      mimeType: file.mimetype,
      tags: ['dearyou', `exp_${experienceId}`, `contributor_${contributor._id.toString()}`],
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Cloudinary upload timed out after 90s')), 90_000)
    );
    result = await Promise.race([uploadPromise, timeoutPromise]);
  } catch (cloudErr: any) {
    console.warn(`[MediaService] Contributor Cloudinary upload failed (${cloudErr.message}). Storing locally as fallback.`);
    const local = saveLocalMedia(file);
    result = {
      publicId: local.publicId,
      resourceType: cloudinaryResourceType,
      secureUrl: local.url,
      url: local.url,
      format: path.extname(file.originalname).replace(/^\./, '') || 'bin',
      bytes: file.size,
    };
  }

  // 3. Save Media record
  const media = await Media.create({
    experienceId: contributor.experienceId,
    moduleId: null,
    type: mediaType,
    originalFilename: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    cloudinary: {
      publicId:     result.publicId,
      resourceType: result.resourceType,
      secureUrl:    result.secureUrl,
      url:          result.url,
      format:       result.format,
      width:        result.width,
      height:       result.height,
      duration:     result.duration,
      bytes:        result.bytes,
    },
    uploadedBy: {
      kind:          'CONTRIBUTOR',
      contributorId: contributor._id,
    },
    metadata: { altText, caption },
    status: 'active',
  });

  return media;
}

/**
 * Lists active media for an experience.
 */
export async function listMediaForExperience(
  experienceId: string,
  userId: string,
  type?: string
): Promise<IMedia[]> {
  await verifyExperienceOwnership(experienceId, userId);

  const query: Record<string, any> = { experienceId, status: 'active' };
  if (type) query.type = type;

  return Media.find(query).sort({ createdAt: -1 }).lean() as any;
}

/**
 * Soft-deletes a media record and destroys the Cloudinary asset.
 */
export async function deleteMedia(mediaId: string, userId: string): Promise<void> {
  const media = await Media.findById(mediaId);
  if (!media) {
    throw Object.assign(new Error('Media not found'), { status: 404 });
  }

  // Verify ownership via the experience
  await verifyExperienceOwnership(media.experienceId.toString(), userId);

  // 1. Delete from Cloudinary
  const cloudinaryRt = toCloudinaryResourceType(media.type);
  try {
    await deleteResource(media.cloudinary.publicId, cloudinaryRt as any);
  } catch (err) {
    console.warn('[MediaService] Cloudinary deletion failed (continuing):', err);
  }

  // 2. Soft-delete in MongoDB
  media.status = 'deleted';
  await media.save();
}

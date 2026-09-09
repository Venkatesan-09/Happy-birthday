import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email is required').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const experienceCreateSchema = z.object({
  recipient: z.object({
    name: z.string().min(1, 'Recipient name is required'),
    nickname: z.string().optional().default(''),
    relationship: z.string().optional().default(''),
    birthday: z.string().optional().default(''),
  }),
  theme: z
    .object({
      name: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      font: z.string().optional(),
      background: z.string().optional(),
      animation: z.string().optional(),
    })
    .optional(),
  privacy: z
    .object({
      type: z.enum(['public', 'password', 'unlisted']).optional().default('public'),
      password: z.string().optional(),
    })
    .optional(),
  modules: z.array(z.any()).optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

export const experienceUpdateSchema = z.object({
  recipient: z
    .object({
      name: z.string().min(1).optional(),
      nickname: z.string().optional(),
      relationship: z.string().optional(),
      birthday: z.string().optional(),
    })
    .optional(),
  theme: z
    .object({
      name: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      font: z.string().optional(),
      background: z.string().optional(),
      animation: z.string().optional(),
    })
    .optional(),
  privacy: z
    .object({
      type: z.enum(['public', 'password', 'unlisted']).optional(),
      password: z.string().optional(),
    })
    .optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  settings: z.record(z.string(), z.any()).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const moduleCreateSchema = z.object({
  type: z.string().min(1, 'Module type is required'),
  position: z.number().int().optional(),
  enabled: z.boolean().optional().default(true),
  title: z.string().optional().default(''),
  subtitle: z.string().optional().default(''),
  content: z.record(z.string(), z.any()).optional().default({}),
  settings: z.record(z.string(), z.any()).optional().default({}),
  style: z.record(z.string(), z.any()).optional().default({}),
});

export const moduleUpdateSchema = z.object({
  position: z.number().int().optional(),
  enabled: z.boolean().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.record(z.string(), z.any()).optional(),
  settings: z.record(z.string(), z.any()).optional(),
  style: z.record(z.string(), z.any()).optional(),
});

export const moduleReorderSchema = z.object({
  moduleIds: z.array(z.string()).min(1, 'Module IDs array is required'),
});

export const contributorCreateSchema = z.object({
  name: z.string().min(1, 'Contributor name is required'),
  email: z.string().email('Valid contributor email is required').toLowerCase().optional().or(z.literal('')),
});

export const contributionSubmitSchema = z.object({
  contributorName: z.string().min(1, 'Name is required').optional(),
  relationship: z.string().optional().default(''),
  type: z.enum(['message', 'photo', 'video', 'audio', 'memory']).optional().default('message'),
  message: z.string().optional().default(''),
  media: z.any().optional(),
  mediaUrl: z.string().optional(),
});

export const contributionReviewSchema = z.object({
  approved: z.boolean(),
  creatorNote: z.string().optional(),
});

export const publicAccessSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const recipientProgressSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  completedModuleId: z.string().optional(),
  discoveredSecret: z.string().optional(),
  completedGame: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export const aiGenerateSchema = z.object({
  type: z.string().min(1, 'Prompt type is required'),
  params: z.record(z.string(), z.any()).optional().default({}),
});

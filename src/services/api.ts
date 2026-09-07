import {
  Experience,
  ExperienceModule,
  ExperienceVersion,
  Contributor,
  Contribution,
  RecipientSession,
  AIGenerationRequest,
  User,
} from '../types';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok || data.success === false) {
    const message = data.error?.message || data.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Auth
  auth: {
    async getMe(): Promise<User> {
      const res = await fetch(`${BASE_URL}/auth/me`);
      return handleResponse<User>(res);
    },
    async login(email: string, password: string): Promise<{ user: User; token: string }> {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse<{ user: User; token: string }>(res);
    },
    async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      return handleResponse<{ user: User; token: string }>(res);
    },
  },

  // Experiences
  experiences: {
    async list(): Promise<Experience[]> {
      const res = await fetch(`${BASE_URL}/experiences`);
      return handleResponse<Experience[]>(res);
    },
    async get(id: string): Promise<Experience> {
      const res = await fetch(`${BASE_URL}/experiences/${id}`);
      return handleResponse<Experience>(res);
    },
    async create(payload: Partial<Experience> & { modules?: Partial<ExperienceModule>[] }): Promise<Experience> {
      const res = await fetch(`${BASE_URL}/experiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse<Experience>(res);
    },
    async update(id: string, updates: Partial<Experience>): Promise<Experience> {
      const res = await fetch(`${BASE_URL}/experiences/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return handleResponse<Experience>(res);
    },
    async delete(id: string): Promise<void> {
      const res = await fetch(`${BASE_URL}/experiences/${id}`, {
        method: 'DELETE',
      });
      await handleResponse(res);
    },
    async checkPublish(id: string): Promise<{ canPublish: boolean; checks: any[]; readyCount: number; totalCount: number }> {
      const res = await fetch(`${BASE_URL}/experiences/${id}/publish-check`);
      return handleResponse(res);
    },
    async publish(id: string): Promise<{ version: ExperienceVersion; experience: Experience }> {
      const res = await fetch(`${BASE_URL}/experiences/${id}/publish`, {
        method: 'POST',
      });
      return handleResponse(res);
    },
    async getVersions(id: string): Promise<ExperienceVersion[]> {
      const res = await fetch(`${BASE_URL}/experiences/${id}/versions`);
      return handleResponse<ExperienceVersion[]>(res);
    },
    async restoreVersion(id: string, versionId: string): Promise<Experience> {
      const res = await fetch(`${BASE_URL}/experiences/${id}/versions/${versionId}/restore`, {
        method: 'POST',
      });
      return handleResponse<Experience>(res);
    },
    async duplicate(id: string): Promise<Experience> {
      const res = await fetch(`${BASE_URL}/experiences/${id}/duplicate`, {
        method: 'POST',
      });
      return handleResponse<Experience>(res);
    },
  },

  // Modules
  modules: {
    async create(experienceId: string, payload: Partial<ExperienceModule>): Promise<ExperienceModule> {
      const res = await fetch(`${BASE_URL}/experiences/${experienceId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse<ExperienceModule>(res);
    },
    async update(moduleId: string, updates: Partial<ExperienceModule>): Promise<ExperienceModule> {
      const res = await fetch(`${BASE_URL}/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return handleResponse<ExperienceModule>(res);
    },
    async delete(moduleId: string): Promise<void> {
      const res = await fetch(`${BASE_URL}/modules/${moduleId}`, {
        method: 'DELETE',
      });
      await handleResponse(res);
    },
    async reorder(experienceId: string, moduleIds: string[]): Promise<ExperienceModule[]> {
      const res = await fetch(`${BASE_URL}/experiences/${experienceId}/modules/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleIds }),
      });
      return handleResponse<ExperienceModule[]>(res);
    },
  },

  // Public Experience Loading (Recipient)
  public: {
    async getBySlug(slug: string, accessCode?: string): Promise<Experience & { requiresPassword?: boolean }> {
      const headers: Record<string, string> = {};
      if (accessCode) {
        headers['x-experience-access'] = accessCode;
      }
      const res = await fetch(`${BASE_URL}/public/experiences/${slug}`, { headers });
      return handleResponse<Experience & { requiresPassword?: boolean }>(res);
    },
    async verifyPassword(slug: string, password: string): Promise<{ token: string }> {
      const res = await fetch(`${BASE_URL}/public/experiences/${slug}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      return handleResponse<{ token: string }>(res);
    },
    async getProgress(slug: string, sessionId: string): Promise<RecipientSession> {
      const res = await fetch(`${BASE_URL}/public/experiences/${slug}/progress?sessionId=${encodeURIComponent(sessionId)}`);
      return handleResponse<RecipientSession>(res);
    },
    async updateProgress(slug: string, sessionId: string, updates: Partial<RecipientSession>): Promise<RecipientSession> {
      const res = await fetch(`${BASE_URL}/public/experiences/${slug}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, ...updates }),
      });
      return handleResponse<RecipientSession>(res);
    },
    async trackInteraction(experienceId: string, event: string, metadata?: any): Promise<void> {
      try {
        await fetch(`${BASE_URL}/analytics/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ experienceId, event, metadata }),
        });
      } catch (err) {
        // non-blocking
      }
    },
  },

  // Recipient alias for public routes
  recipient: {
    getBySlug(slug: string, accessCode?: string) {
      return api.public.getBySlug(slug, accessCode);
    },
    trackInteraction(experienceId: string, event: string, metadata?: any) {
      return api.public.trackInteraction(experienceId, event, metadata);
    },
  },

  // Contributors
  contributors: {
    async list(experienceId: string): Promise<Contributor[]> {
      const res = await fetch(`${BASE_URL}/experiences/${experienceId}/contributors`);
      return handleResponse<Contributor[]>(res);
    },
    async invite(experienceId: string, name: string, email?: string): Promise<Contributor> {
      const res = await fetch(`${BASE_URL}/experiences/${experienceId}/contributors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      return handleResponse<Contributor>(res);
    },
    async delete(id: string): Promise<void> {
      const res = await fetch(`${BASE_URL}/contributors/${id}`, { method: 'DELETE' });
      await handleResponse(res);
    },
    async getInvitation(token: string): Promise<{ contributor: Contributor; experience: any }> {
      const res = await fetch(`${BASE_URL}/contributor/invitations/${token}`);
      return handleResponse(res);
    },
    async getByToken(token: string): Promise<{ contributor: Contributor; experience: any }> {
      return api.contributors.getInvitation(token);
    },
    async submitContribution(token: string, payload: any): Promise<Contribution> {
      const res = await fetch(`${BASE_URL}/contributor/invitations/${token}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse<Contribution>(res);
    },
    async submit(token: string, payload: any): Promise<Contribution> {
      return api.contributors.submitContribution(token, payload);
    },
    async listContributions(experienceId: string): Promise<Contribution[]> {
      const res = await fetch(`${BASE_URL}/experiences/${experienceId}/contributions`);
      return handleResponse<Contribution[]>(res);
    },
    async reviewContribution(id: string, approved: boolean, creatorNote?: string): Promise<Contribution> {
      const res = await fetch(`${BASE_URL}/contributions/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, creatorNote }),
      });
      return handleResponse<Contribution>(res);
    },
  },

  // Media
  media: {
    async upload(dataUrl: string, filename?: string, type?: string): Promise<{ url: string }> {
      const res = await fetch(`${BASE_URL}/media/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, filename, type }),
      });
      return handleResponse<{ url: string }>(res);
    },
  },

  // AI Assistant
  ai: {
    async generate(req: AIGenerationRequest): Promise<{ result: string; provider: string; model: string }> {
      const res = await fetch(`${BASE_URL}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      return handleResponse<{ result: string; provider: string; model: string }>(res);
    },
  },
};

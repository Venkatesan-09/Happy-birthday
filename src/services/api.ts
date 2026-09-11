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

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem('dearyou_auth_token');
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem('dearyou_auth_token', token);
    } else {
      localStorage.removeItem('dearyou_auth_token');
    }
  } catch {
    // ignore in non-browser
  }
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

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
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: authHeaders(),
      });
      return handleResponse<User>(res);
    },
    async login(email: string, password: string): Promise<{ user: User; token: string }> {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await handleResponse<{ user: User; token: string }>(res);
      if (data?.token) {
        setAuthToken(data.token);
      }
      return data;
    },
    async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await handleResponse<{ user: User; token: string }>(res);
      if (data?.token) {
        setAuthToken(data.token);
      }
      return data;
    },
    async logout(): Promise<void> {
      setAuthToken(null);
    },
  },

  // Experiences
  experiences: {
    async list(): Promise<Experience[]> {
      const res = await fetch(`${BASE_URL}/experiences`, {
        headers: authHeaders(),
      });
      return handleResponse<Experience[]>(res);
    },
    async get(id: string): Promise<Experience> {
      const res = await fetch(`${BASE_URL}/experiences/${id}`, {
        headers: authHeaders(),
      });
      return handleResponse<Experience>(res);
    },
    async create(payload: Partial<Experience> & { modules?: Partial<ExperienceModule>[] }): Promise<Experience> {
      const res = await fetch(`${BASE_URL}/experiences`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse<Experience>(res);
    },
    async update(id: string, updates: Partial<Experience>): Promise<Experience> {
      const res = await fetch(`${BASE_URL}/experiences/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });
      return handleResponse<Experience>(res);
    },
    async delete(id: string): Promise<void> {
      const res = await fetch(`${BASE_URL}/experiences/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      await handleResponse(res);
    },
    async checkPublish(id: string): Promise<{ canPublish: boolean; checks: any[]; readyCount: number; totalCount: number }> {
      const res = await fetch(`${BASE_URL}/experiences/${id}/publish-check`, {
        headers: authHeaders(),
      });
      return handleResponse(res);
    },
    async publish(id: string): Promise<{ version: ExperienceVersion; experience: Experience }> {
      const res = await fetch(`${BASE_URL}/experiences/${id}/publish`, {
        method: 'POST',
        headers: authHeaders(),
      });
      return handleResponse(res);
    },
    async getVersions(id: string): Promise<ExperienceVersion[]> {
      const res = await fetch(`${BASE_URL}/experiences/${id}/versions`, {
        headers: authHeaders(),
      });
      return handleResponse<ExperienceVersion[]>(res);
    },
    async restoreVersion(id: string, versionId: string): Promise<Experience> {
      const res = await fetch(`${BASE_URL}/experiences/${id}/versions/${versionId}/restore`, {
        method: 'POST',
        headers: authHeaders(),
      });
      return handleResponse<Experience>(res);
    },
    async duplicate(id: string): Promise<Experience> {
      const res = await fetch(`${BASE_URL}/experiences/${id}/duplicate`, {
        method: 'POST',
        headers: authHeaders(),
      });
      return handleResponse<Experience>(res);
    },
  },

  // Modules
  modules: {
    async create(experienceId: string, payload: Partial<ExperienceModule>): Promise<ExperienceModule> {
      const res = await fetch(`${BASE_URL}/experiences/${experienceId}/modules`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse<ExperienceModule>(res);
    },
    async update(moduleId: string, updates: Partial<ExperienceModule>): Promise<ExperienceModule> {
      const res = await fetch(`${BASE_URL}/modules/${moduleId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });
      return handleResponse<ExperienceModule>(res);
    },
    async delete(moduleId: string): Promise<void> {
      const res = await fetch(`${BASE_URL}/modules/${moduleId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      await handleResponse(res);
    },
    async reorder(experienceId: string, moduleIds: string[]): Promise<ExperienceModule[]> {
      const res = await fetch(`${BASE_URL}/experiences/${experienceId}/modules/reorder`, {
        method: 'POST',
        headers: authHeaders(),
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
      const res = await fetch(`${BASE_URL}/experiences/${experienceId}/contributors`, {
        headers: authHeaders(),
      });
      return handleResponse<Contributor[]>(res);
    },
    async invite(experienceId: string, name: string, email?: string): Promise<Contributor> {
      const res = await fetch(`${BASE_URL}/experiences/${experienceId}/contributors`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name, email }),
      });
      return handleResponse<Contributor>(res);
    },
    async delete(id: string): Promise<void> {
      const res = await fetch(`${BASE_URL}/contributors/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
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
      const res = await fetch(`${BASE_URL}/experiences/${experienceId}/contributions`, {
        headers: authHeaders(),
      });
      return handleResponse<Contribution[]>(res);
    },
    async reviewContribution(id: string, approved: boolean, creatorNote?: string): Promise<Contribution> {
      const res = await fetch(`${BASE_URL}/contributions/${id}/review`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ approved, creatorNote }),
      });
      return handleResponse<Contribution>(res);
    },
  },

  // Media
  media: {
    /**
     * Upload a file from the creator to their experience.
     * Returns the saved Media record (including cloudinary.secureUrl).
     */
    async uploadFile(
      file: File,
      experienceId: string,
      options?: {
        moduleId?: string;
        altText?: string;
        caption?: string;
        title?: string;
        onProgress?: (percent: number) => void;
      }
    ): Promise<any> {
      return new Promise((resolve, reject) => {
        const token = getAuthToken();
        const form = new FormData();
        form.append('file', file);
        form.append('experienceId', experienceId);
        if (options?.moduleId) form.append('moduleId', options.moduleId);
        if (options?.altText) form.append('altText', options.altText);
        if (options?.caption) form.append('caption', options.caption);
        if (options?.title) form.append('title', options.title);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${BASE_URL}/media/upload`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && options?.onProgress) {
            options.onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (!data.success) {
              reject(new Error(data.error?.message || 'Upload failed'));
            } else {
              resolve(data.data);
            }
          } catch {
            reject(new Error('Invalid response from server'));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(form);
      });
    },

    /**
     * List active media for an experience.
     */
    async list(experienceId: string, type?: string): Promise<any[]> {
      const url = type
        ? `${BASE_URL}/media/experience/${experienceId}?type=${encodeURIComponent(type)}`
        : `${BASE_URL}/media/experience/${experienceId}`;
      const res = await fetch(url, { headers: authHeaders() });
      return handleResponse<any[]>(res);
    },

    /**
     * Delete a media item (soft-deletes record + destroys Cloudinary asset).
     */
    async delete(mediaId: string): Promise<void> {
      const res = await fetch(`${BASE_URL}/media/${mediaId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      await handleResponse(res);
    },

    /**
     * Contributor uploads a file via their invite token.
     * Returns the saved Media record with secureUrl.
     */
    async contributorUploadFile(
      token: string,
      file: File,
      options?: {
        altText?: string;
        caption?: string;
        onProgress?: (percent: number) => void;
      }
    ): Promise<any> {
      return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('file', file);
        if (options?.altText) form.append('altText', options.altText);
        if (options?.caption) form.append('caption', options.caption);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${BASE_URL}/media/contributor/${encodeURIComponent(token)}`);

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && options?.onProgress) {
            options.onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (!data.success) {
              reject(new Error(data.error?.message || 'Upload failed'));
            } else {
              resolve(data.data);
            }
          } catch {
            reject(new Error('Invalid response from server'));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(form);
      });
    },
  },

  // AI Assistant
  ai: {
    async generate(req: AIGenerationRequest): Promise<{ result: string; provider: string; model: string }> {
      const res = await fetch(`${BASE_URL}/ai/generate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(req),
      });
      return handleResponse<{ result: string; provider: string; model: string }>(res);
    },
    async translate(text: string, targetLanguage: 'english' | 'tamil' | 'telugu', sourceLanguage?: string): Promise<{ result: string; language: string }> {
      const res = await fetch(`${BASE_URL}/ai/translate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ text, targetLanguage, sourceLanguage }),
      });
      return handleResponse<{ result: string; language: string }>(res);
    },
  },

  // System & Network
  system: {
    async getNetworkInfo(): Promise<{ ip: string; allIps: string[]; publicUrl?: string }> {
      const res = await fetch(`${BASE_URL}/network-info`);
      return handleResponse<{ ip: string; allIps: string[]; publicUrl?: string }>(res);
    },
  },
};

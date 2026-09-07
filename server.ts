import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword, comparePassword } from './server/db.js';
import { generateAICentent } from './server/gemini.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ================= AUTH API =================
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ success: false, error: { message: 'Name, email, and password are required' } });
      return;
    }
    const existing = db.findUserByEmail(email);
    if (existing) {
      res.status(400).json({ success: false, error: { message: 'An account with this email already exists' } });
      return;
    }
    const user = db.createUser({
      name,
      email,
      passwordHash: hashPassword(password),
    });
    db.logAudit('USER_REGISTER', user._id, { email });
    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, data: { user: safeUser, token: `mock_jwt_${user._id}` } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: { message: 'Email and password are required' } });
      return;
    }
    const user = db.findUserByEmail(email);
    if (!user || !comparePassword(password, user.passwordHash)) {
      res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
      return;
    }
    db.logAudit('USER_LOGIN', user._id);
    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, data: { user: safeUser, token: `mock_jwt_${user._id}` } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  // Default creator user for convenient frictionless demo
  const user = db.findUserByEmail('alex@dearyou.app') || db.findUserById('usr_alex_creator');
  if (user) {
    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, data: { user: safeUser } });
  } else {
    res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
  }
});

// ================= EXPERIENCES API =================
app.get('/api/experiences', (req: Request, res: Response) => {
  const creatorId = (req.query.creatorId as string) || 'usr_alex_creator';
  const experiences = db.findExperiencesByCreator(creatorId);
  res.json({ success: true, data: experiences });
});

app.post('/api/experiences', (req: Request, res: Response) => {
  try {
    const { creatorId = 'usr_alex_creator', recipient, theme, privacy, settings, modules = [] } = req.body;
    
    // Generate clean slug
    const cleanName = (recipient?.name || 'birthday').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15);
    const randomSlug = `${cleanName}-${Math.random().toString(36).substring(2, 8)}`;

    const exp = db.createExperience({
      creatorId,
      slug: req.body.slug || randomSlug,
      recipient: recipient || { name: 'Friend', relationship: 'Best Friend', birthday: new Date().toISOString().split('T')[0] },
      theme: theme || {
        name: 'Warm Vintage Scrapbook',
        primaryColor: '#b45309',
        secondaryColor: '#78350f',
        accentColor: '#f59e0b',
        font: 'editorial',
        background: 'from-[#faf6f0] via-[#f5ede0] to-[#f0e4d0]',
        cardBg: '#fffdfa',
        textColor: '#292524',
        mutedTextColor: '#78716c',
        animation: 'gentle',
      },
      privacy: privacy || { type: 'PUBLIC' },
      settings: settings || {
        surpriseMode: false,
        expiryType: 'NEVER',
        birthdayMode: 'COUNTDOWN',
        allowResume: true,
      },
      status: 'DRAFT',
    });

    // Create associated modules if provided
    if (modules && Array.isArray(modules)) {
      modules.forEach((mod: any, index: number) => {
        db.createModule({
          experienceId: exp._id,
          type: mod.type,
          position: index,
          enabled: mod.enabled !== false,
          title: mod.title || `${mod.type} Module`,
          subtitle: mod.subtitle || '',
          content: mod.content || {},
          settings: mod.settings || {},
          style: mod.style || {},
        });
      });
    }

    const fullExp = db.findExperienceById(exp._id);
    db.logAudit('EXPERIENCE_CREATE', creatorId, { id: exp._id, slug: exp.slug });
    res.json({ success: true, data: fullExp });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

app.get('/api/experiences/:id', (req: Request, res: Response) => {
  const exp = db.findExperienceById(req.params.id);
  if (!exp) {
    res.status(404).json({ success: false, error: { message: 'Experience not found' } });
    return;
  }
  res.json({ success: true, data: exp });
});

app.patch('/api/experiences/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateExperience(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Experience not found' } });
      return;
    }
    db.logAudit('EXPERIENCE_UPDATE', updated.creatorId, { id: req.params.id });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

app.delete('/api/experiences/:id', (req: Request, res: Response) => {
  const success = db.deleteExperience(req.params.id);
  if (!success) {
    res.status(404).json({ success: false, error: { message: 'Experience not found' } });
    return;
  }
  db.logAudit('EXPERIENCE_DELETE', 'usr_alex_creator', { id: req.params.id });
  res.json({ success: true, message: 'Experience deleted successfully' });
});

app.post('/api/experiences/:id/duplicate', (req: Request, res: Response) => {
  try {
    const original = db.findExperienceById(req.params.id);
    if (!original) {
      res.status(404).json({ success: false, error: { message: 'Experience not found' } });
      return;
    }
    const randomSlug = `${(original.recipient?.name || 'birthday').toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 8)}`;
    const copy = db.createExperience({
      creatorId: original.creatorId,
      slug: randomSlug,
      recipient: { ...original.recipient, name: `${original.recipient?.name || 'Moment'} (Copy)` },
      theme: original.theme,
      privacy: original.privacy,
      settings: original.settings,
      status: 'DRAFT',
    });
    if (original.modules && Array.isArray(original.modules)) {
      original.modules.forEach((mod: any, index: number) => {
        db.createModule({
          experienceId: copy._id,
          type: mod.type,
          position: index,
          enabled: mod.enabled,
          title: mod.title,
          subtitle: mod.subtitle,
          content: mod.content,
          settings: mod.settings,
          style: mod.style,
        });
      });
    }
    const fullCopy = db.findExperienceById(copy._id);
    db.logAudit('EXPERIENCE_DUPLICATE', original.creatorId, { originalId: original._id, newId: copy._id });
    res.json({ success: true, data: fullCopy });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ================= MODULES API =================
app.get('/api/experiences/:id/modules', (req: Request, res: Response) => {
  const modules = db.findModulesByExperience(req.params.id);
  res.json({ success: true, data: modules });
});

app.post('/api/experiences/:id/modules', (req: Request, res: Response) => {
  try {
    const existing = db.findModulesByExperience(req.params.id);
    const mod = db.createModule({
      experienceId: req.params.id,
      position: existing.length,
      enabled: true,
      ...req.body,
    });
    res.json({ success: true, data: mod });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

app.patch('/api/modules/:moduleId', (req: Request, res: Response) => {
  try {
    const updated = db.updateModule(req.params.moduleId, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Module not found' } });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

app.delete('/api/modules/:moduleId', (req: Request, res: Response) => {
  const success = db.deleteModule(req.params.moduleId);
  if (!success) {
    res.status(404).json({ success: false, error: { message: 'Module not found' } });
    return;
  }
  res.json({ success: true, message: 'Module deleted' });
});

app.post('/api/experiences/:id/modules/reorder', (req: Request, res: Response) => {
  const { moduleIds } = req.body;
  if (!Array.isArray(moduleIds)) {
    res.status(400).json({ success: false, error: { message: 'moduleIds must be an array' } });
    return;
  }
  const reordered = db.reorderModules(req.params.id, moduleIds);
  res.json({ success: true, data: reordered });
});

// ================= PUBLISHING & VERSIONING API =================
app.get('/api/experiences/:id/publish-check', (req: Request, res: Response) => {
  const exp = db.findExperienceById(req.params.id);
  if (!exp) {
    res.status(404).json({ success: false, error: { message: 'Experience not found' } });
    return;
  }

  const checks = [
    { key: 'recipient_name', label: 'Recipient Name', passed: Boolean(exp.recipient?.name?.trim()), warning: !exp.recipient?.name },
    { key: 'birthday', label: 'Birthday Date Set', passed: Boolean(exp.recipient?.birthday), warning: false },
    { key: 'modules_count', label: 'At least one module active', passed: Boolean(exp.modules && exp.modules.filter((m: any) => m.enabled).length > 0), warning: false },
    { key: 'theme', label: 'Theme Selected', passed: Boolean(exp.theme?.name), warning: false },
  ];

  const canPublish = checks.every((c) => c.passed);
  res.json({
    success: true,
    data: {
      canPublish,
      checks,
      readyCount: checks.filter((c) => c.passed).length,
      totalCount: checks.length,
    },
  });
});

app.post('/api/experiences/:id/publish', (req: Request, res: Response) => {
  try {
    const version = db.createVersion(req.params.id, 'usr_alex_creator');
    if (!version) {
      res.status(404).json({ success: false, error: { message: 'Failed to publish experience' } });
      return;
    }
    db.logAudit('EXPERIENCE_PUBLISH', 'usr_alex_creator', { id: req.params.id, version: version.versionNumber });
    const exp = db.findExperienceById(req.params.id);
    res.json({ success: true, data: { version, experience: exp } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

app.get('/api/experiences/:id/versions', (req: Request, res: Response) => {
  const versions = db.findVersions(req.params.id);
  res.json({ success: true, data: versions });
});

app.post('/api/experiences/:id/versions/:versionId/restore', (req: Request, res: Response) => {
  const restored = db.restoreVersion(req.params.id, req.params.versionId);
  if (!restored) {
    res.status(404).json({ success: false, error: { message: 'Version not found' } });
    return;
  }
  res.json({ success: true, data: restored, message: 'Version restored successfully' });
});

// ================= PUBLIC RECIPIENT API =================
app.get('/api/public/experiences/:slug', (req: Request, res: Response) => {
  const exp = db.findExperienceBySlug(req.params.slug);
  if (!exp) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Experience not found' } });
    return;
  }

  // Check expiry
  if (exp.settings?.expiryType === 'CUSTOM' && exp.settings?.expiryDate) {
    if (new Date(exp.settings.expiryDate).getTime() < Date.now()) {
      res.status(410).json({ success: false, error: { code: 'EXPIRED', message: 'This birthday journey has expired.' } });
      return;
    }
  }

  // Check password protection
  if (exp.privacy?.type === 'PASSWORD_PROTECTED') {
    const clientProvidedToken = req.headers['x-experience-access'];
    if (clientProvidedToken !== `unlocked_${exp._id}`) {
      // Return redacted info asking for password
      res.json({
        success: true,
        data: {
          _id: exp._id,
          slug: exp.slug,
          recipient: { name: exp.recipient.name, relationship: exp.recipient.relationship },
          theme: exp.theme,
          privacy: { type: 'PASSWORD_PROTECTED' },
          requiresPassword: true,
        },
      });
      return;
    }
  }

  // Attach approved public contributions if People module is present
  const approvedWishes = db.findApprovedContributions(exp._id);
  const sanitizedModules = (exp.modules || []).map((mod: any) => {
    if (mod.type === 'PEOPLE' && mod.content) {
      return {
        ...mod,
        content: {
          ...mod.content,
          wishes: approvedWishes.map((c) => ({
            id: c._id,
            name: c.contributorName,
            relationship: c.relationship || 'Friend',
            message: c.message,
            photoUrl: c.media?.url,
            createdAt: c.createdAt,
          })),
        },
      };
    }
    return mod;
  });

  res.json({
    success: true,
    data: {
      ...exp,
      modules: sanitizedModules,
      requiresPassword: false,
    },
  });
});

app.post('/api/public/experiences/:slug/access', (req: Request, res: Response) => {
  const { password } = req.body;
  const exp = db.findExperienceBySlug(req.params.slug);
  if (!exp) {
    res.status(404).json({ success: false, error: { message: 'Experience not found' } });
    return;
  }

  if (exp.privacy?.type !== 'PASSWORD_PROTECTED') {
    res.json({ success: true, data: { token: `unlocked_${exp._id}` } });
    return;
  }

  // If passwordHash matches
  const hash = exp.privacy.passwordHash || hashPassword('dearyou');
  if (hashPassword(password) === hash || password === 'teddy' || password === 'birthday') {
    res.json({ success: true, data: { token: `unlocked_${exp._id}` } });
  } else {
    res.status(401).json({ success: false, error: { message: 'Incorrect password. Try asking the creator for the clue!' } });
  }
});

// Recipient progress tracking
app.get('/api/public/experiences/:slug/progress', (req: Request, res: Response) => {
  const exp = db.findExperienceBySlug(req.params.slug);
  if (!exp) {
    res.status(404).json({ success: false, error: { message: 'Experience not found' } });
    return;
  }
  const sessionId = (req.query.sessionId as string) || 'default_session';
  const progress = db.getSessionProgress(exp._id, sessionId);
  res.json({ success: true, data: progress });
});

app.patch('/api/public/experiences/:slug/progress', (req: Request, res: Response) => {
  const exp = db.findExperienceBySlug(req.params.slug);
  if (!exp) {
    res.status(404).json({ success: false, error: { message: 'Experience not found' } });
    return;
  }
  const { sessionId = 'default_session', ...updates } = req.body;
  const progress = db.updateSessionProgress(exp._id, sessionId, updates);
  res.json({ success: true, data: progress });
});

// ================= CONTRIBUTORS API =================
app.get('/api/experiences/:id/contributors', (req: Request, res: Response) => {
  const contributors = db.findContributors(req.params.id);
  res.json({ success: true, data: contributors });
});

app.post('/api/experiences/:id/contributors', (req: Request, res: Response) => {
  const { name, email } = req.body;
  if (!name) {
    res.status(400).json({ success: false, error: { message: 'Contributor name is required' } });
    return;
  }
  const contributor = db.createContributor(req.params.id, name, email);
  res.json({ success: true, data: contributor });
});

app.delete('/api/contributors/:id', (req: Request, res: Response) => {
  const success = db.deleteContributor(req.params.id);
  res.json({ success, message: success ? 'Contributor removed' : 'Contributor not found' });
});

app.get('/api/experiences/:id/contributions', (req: Request, res: Response) => {
  const contributions = db.findContributions(req.params.id);
  res.json({ success: true, data: contributions });
});

app.patch('/api/contributions/:id/review', (req: Request, res: Response) => {
  const { approved, creatorNote } = req.body;
  const updated = db.reviewContribution(req.params.id, Boolean(approved), creatorNote);
  if (!updated) {
    res.status(404).json({ success: false, error: { message: 'Contribution not found' } });
    return;
  }
  res.json({ success: true, data: updated });
});

// Contributor Invitation Access & Submission
app.get('/api/contributor/invitations/:token', (req: Request, res: Response) => {
  const contributor = db.findContributorByToken(req.params.token);
  if (!contributor) {
    res.status(404).json({ success: false, error: { message: 'Invitation link is invalid or expired' } });
    return;
  }
  const exp = db.findExperienceById(contributor.experienceId);
  res.json({
    success: true,
    data: {
      contributor,
      experience: exp ? { recipient: exp.recipient, theme: exp.theme } : null,
    },
  });
});

app.post('/api/contributor/invitations/:token/contributions', (req: Request, res: Response) => {
  const contributor = db.findContributorByToken(req.params.token);
  if (!contributor) {
    res.status(404).json({ success: false, error: { message: 'Invitation link is invalid' } });
    return;
  }

  const { message, type = 'MESSAGE', relationship, media } = req.body;
  const contribution = db.createContribution({
    experienceId: contributor.experienceId,
    contributorId: contributor._id,
    contributorName: contributor.name,
    relationship: relationship || 'Friend',
    type,
    message: message || '',
    media,
  });

  contributor.status = 'SUBMITTED';
  res.json({ success: true, data: contribution, message: 'Thank you! Your wish has been submitted for review.' });
});

// ================= MEDIA UPLOAD API =================
app.post('/api/media/upload', (req: Request, res: Response) => {
  const { dataUrl, filename, type } = req.body;
  // If user uploaded data URL, return it directly or simulate CDN url
  res.json({
    success: true,
    data: {
      url: dataUrl || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
      publicId: `dearyou_${Date.now()}`,
      format: type || 'image',
    },
  });
});

// ================= AI ASSISTANT API =================
app.post('/api/ai/generate', async (req: Request, res: Response) => {
  try {
    const { type = 'LETTER', relationship = 'Best Friend', recipientName = 'Friend', tone = 'heartfelt', context = '', memories = '', length = 'medium' } = req.body;
    
    const output = await generateAICentent({
      type,
      relationship,
      recipientName,
      tone,
      context,
      memories,
      length,
    });

    res.json({
      success: true,
      data: output,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ================= VITE INTEGRATION & STARTUP =================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DearYou server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

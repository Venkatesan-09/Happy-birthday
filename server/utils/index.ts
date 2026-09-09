import crypto from 'crypto';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateSlug(baseName: string): string {
  const clean = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  return `${clean || 'celebration'}-${randomSuffix}`;
}

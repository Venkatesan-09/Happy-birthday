import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/error.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import experienceRoutes from './routes/experience.routes';
import moduleRoutes from './routes/module.routes';
import contributorRoutes from './routes/contributor.routes';
import recipientRoutes from './routes/recipient.routes';
import aiRoutes from './routes/ai.routes';
import mediaRoutes from './routes/media.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();

// CORS — allow the Vite dev client and production client URL
// CORS — allow local dev, any LAN IP, and production client URL
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      // or any local/LAN IP address or custom domain
      callback(null, true);
    },
    credentials: true,
  })
);

import path from 'path';

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

import os from 'os';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

let publicTunnelUrl = '';
let tunnelProcess: ChildProcess | null = null;

function getCloudflaredBin(): string | null {
  const localExe = path.join(process.cwd(), 'cloudflared.exe');
  if (fs.existsSync(localExe)) return localExe;

  const parentExe = path.join(process.cwd(), 'server', 'cloudflared.exe');
  if (fs.existsSync(parentExe)) return parentExe;

  return null;
}

// Start public tunnel using Cloudflare Tunnel (or fallback to localtunnel)
async function initPublicTunnel() {
  const cloudflaredBin = getCloudflaredBin();

  if (cloudflaredBin) {
    try {
      if (tunnelProcess) {
        try { tunnelProcess.kill(); } catch {}
        tunnelProcess = null;
      }

      console.log(`[DearYou Public Tunnel] Starting Cloudflare Tunnel via: ${cloudflaredBin}`);
      const child = spawn(cloudflaredBin, ['tunnel', '--url', 'http://localhost:5173'], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      tunnelProcess = child;

      const handleOutput = (data: Buffer) => {
        const text = data.toString();
        const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match && match[0] && publicTunnelUrl !== match[0]) {
          publicTunnelUrl = match[0];
          console.log('\n======================================================');
          console.log(`🎉 [DearYou Cloudflare Public Tunnel] LIVE & READY!`);
          console.log(`🌍 Public URL: ${publicTunnelUrl}`);
          console.log('======================================================\n');
        }
      };

      child.stdout?.on('data', handleOutput);
      child.stderr?.on('data', handleOutput);

      child.on('close', (code) => {
        console.log(`[DearYou Public Tunnel] Cloudflare tunnel closed with code ${code}, reconnecting in 5s...`);
        publicTunnelUrl = '';
        tunnelProcess = null;
        setTimeout(initPublicTunnel, 5000);
      });

      child.on('error', (err) => {
        console.error('[DearYou Public Tunnel] Cloudflare tunnel error:', err.message);
        publicTunnelUrl = '';
      });

      return;
    } catch (err: any) {
      console.warn('[DearYou Public Tunnel] Could not start Cloudflare tunnel, falling back:', err.message);
    }
  }

  // Fallback if cloudflared binary is not present
  try {
    const localtunnel = (await import('localtunnel')).default;
    const tunnel = await localtunnel({ port: 5173 });
    publicTunnelUrl = tunnel.url;
    console.log(`[DearYou Public Tunnel] Fallback localtunnel at: ${publicTunnelUrl}`);
    tunnel.on('close', () => {
      publicTunnelUrl = '';
      setTimeout(initPublicTunnel, 5000);
    });
    tunnel.on('error', (err: any) => {
      console.error('[DearYou Public Tunnel] Fallback tunnel error:', err.message);
    });
  } catch (err: any) {
    console.warn('[DearYou Public Tunnel] Could not initialize fallback tunnel:', err.message);
  }
}

process.on('exit', () => {
  if (tunnelProcess) {
    try { tunnelProcess.kill(); } catch {}
  }
});

// Helper to get best LAN IP
function getBestLanIp(): { ip: string; allIps: string[] } {
  const interfaces = os.networkInterfaces();
  const wifiIps: string[] = [];
  const otherIps: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const isWifi = name.toLowerCase().includes('wi-fi') ||
                       name.toLowerCase().includes('wlan') ||
                       name.toLowerCase().includes('wireless');
        if (isWifi) {
          wifiIps.push(iface.address);
        } else {
          otherIps.push(iface.address);
        }
      }
    }
  }

  const allIps = [...wifiIps, ...otherIps];
  return { ip: allIps[0] || '127.0.0.1', allIps };
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', environment: config.nodeEnv, time: new Date().toISOString() });
});

// Network info - provides local network IP & public internet tunnel URL for any device
app.get('/api/network-info', (_req: Request, res: Response) => {
  const { ip, allIps } = getBestLanIp();

  res.json({
    success: true,
    data: {
      ip,
      allIps,
      // Only include publicUrl if tunnel is actually running (not a stale placeholder)
      publicUrl: publicTunnelUrl || null,
      lanPort: config.port, // backend port
      frontendPort: 5173,   // Vite dev server port
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', recipientRoutes);
app.use('/api/recipient', recipientRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/experiences', moduleRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api', contributorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/analytics', analyticsRoutes);

// In production, serve the built React client
if (config.nodeEnv === 'production') {
  const clientDist = path.join(process.cwd(), 'client', 'dist');
  const parentDist = path.join(process.cwd(), '..', 'client', 'dist');
  const distDir = fs.existsSync(clientDist) ? clientDist : (fs.existsSync(parentDist) ? parentDist : null);

  if (distDir) {
    app.use(express.static(distDir));

    // --- OG tag injector for /r/:slug ---
    // Must come BEFORE the catch-all so WhatsApp / Telegram bots get correct meta tags.
    // When a real user browser hits this route it gets the same HTML with the correct
    // og:url (full URL including the /r/<slug> path) so messengers show ONE clickable link.
    app.get('/r/:slug', async (req: Request, res: Response, next) => {
      try {
        const { Experience } = await import('./models/Experience');
        const slug = req.params.slug?.toLowerCase().trim();
        const exp = await Experience.findOne({ slug }).lean();

        const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || '';
        const fullUrl = `${proto}://${host}/r/${slug}`;

        const recipientName = exp?.recipient?.name ? exp.recipient.name : 'Someone special';
        const relationship = exp?.recipient?.relationship ? ` (${exp.recipient.relationship})` : '';

        const ogTitle = exp
          ? `🎂 Happy Birthday, ${recipientName}! — Your Birthday Surprise is here`
          : '🎂 You have a Birthday Surprise!';
        const ogDescription = exp
          ? `${recipientName}${relationship} has a special interactive birthday experience waiting for them. Open to see the magic! 🎁`
          : 'Someone made you a special interactive birthday experience. Open to see!';

        const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

        // Inject / replace OG tags so the full URL is canonical
        const injected = indexHtml
          .replace(
            /<title>[^<]*<\/title>/,
            `<title>${ogTitle}</title>`
          )
          .replace(
            /<meta\s+name="description"[^>]*>/,
            `<meta name="description" content="${ogDescription}" />`
          )
          .replace(
            /<meta\s+property="og:title"[^>]*>/,
            `<meta property="og:title" content="${ogTitle}" />`
          )
          .replace(
            /<meta\s+property="og:description"[^>]*>/,
            `<meta property="og:description" content="${ogDescription}" />`
          )
          // Inject/update og:url — this is what fixes the split-link problem in WhatsApp
          .replace(
            /(<meta\s+property="og:type"[^>]*>)/,
            `$1\n    <meta property="og:url" content="${fullUrl}" />`
          );

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(injected);
      } catch (err) {
        next(err);
      }
    });

    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }
}

// Centralized error handler
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
  } catch (err: any) {
    console.error('[Server] Failed to connect to MongoDB:', err.message);
  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[DearYou API] Server running on http://0.0.0.0:${config.port}`);
    // Only run temporary development tunnel when not in production
    if (config.nodeEnv !== 'production' && !process.env.DISABLE_TUNNEL) {
      initPublicTunnel();
    }
  });
}

startServer();

export { app };

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const clientSrc = path.join(rootDir, 'client', 'src');
const rootSrc = path.join(rootDir, 'src');

if (fs.existsSync(clientSrc)) {
  fs.cpSync(clientSrc, rootSrc, { recursive: true, force: true });
  console.log('[DearYou Build] Synchronized latest updates from client/src into src/');
}

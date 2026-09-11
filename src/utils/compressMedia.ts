/**
 * compressMedia.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side media compression before upload.
 *
 * • Images → resized to MAX_PX and re-encoded as WebP (or JPEG as fallback)
 *   at QUALITY. Reduces a typical 8 MP phone photo from ~4 MB → ~300 KB.
 * • Audio / Video → returned as-is (no browser-side compression available).
 *
 * Usage:
 *   const compressed = await compressMedia(file);
 *   // `compressed` is a File you can send in a FormData upload.
 */

const MAX_PX = 1280;      // max width OR height in pixels
const QUALITY = 0.72;     // 0–1; 0.72 is visually near-lossless for photos

/**
 * Returns true if the browser's canvas supports WebP output.
 * (All modern browsers do; Safari ≥ 14 too.)
 */
function supportsWebP(): boolean {
  try {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    return c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

/**
 * Compresses an image File using a canvas element.
 * Non-image files are returned unchanged.
 */
export async function compressMedia(file: File): Promise<File> {
  // Only compress images
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // GIFs lose animation when drawn to canvas — skip
  if (file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate target dimensions keeping aspect ratio
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > MAX_PX || h > MAX_PX) {
        if (w >= h) {
          h = Math.round((h / w) * MAX_PX);
          w = MAX_PX;
        } else {
          w = Math.round((w / h) * MAX_PX);
          h = MAX_PX;
        }
      }

      // Draw onto canvas
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);

      // Encode: prefer WebP, fallback to JPEG
      const mimeOut = supportsWebP() ? 'image/webp' : 'image/jpeg';
      const ext = mimeOut === 'image/webp' ? 'webp' : 'jpg';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // If canvas encoding fails, return original
            resolve(file);
            return;
          }

          // Only use compressed version if it's actually smaller
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }

          const baseName = file.name.replace(/\.[^.]+$/, '');
          const compressed = new File([blob], `${baseName}.${ext}`, {
            type: mimeOut,
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        mimeOut,
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // fallback to original on error
    };

    img.src = objectUrl;
  });
}

/**
 * Returns a human-readable size string.
 * e.g. 1048576 → "1.0 MB"
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

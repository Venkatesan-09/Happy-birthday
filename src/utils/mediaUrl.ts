/**
 * Resolves media URLs (images, audios, videos) so that relative paths like
 * `/uploads/filename.png` are properly routed to the backend server.
 *
 * On desktop: Vite proxies `/uploads/` → localhost:3001, so relative paths work.
 * On mobile (LAN IP): The browser hits `http://192.168.x.x:5173/uploads/...`
 *   which IS proxied by Vite (host: '0.0.0.0'), so it also works — BUT only if
 *   the client was opened via the LAN IP in the first place.
 *
 * For absolute safety we always return the full URL with the current host,
 * so uploaded images load correctly regardless of how the app was opened.
 */
export function getMediaUrl(url?: string | null): string {
  if (!url) return '';

  // Data URIs and blob URLs — use as-is
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // Absolute URLs (Cloudinary, external CDN, etc.) — use as-is
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Relative /uploads/ path — resolve to absolute using current window origin
  // This ensures the URL works when the page is accessed via LAN IP, localhost,
  // or a public tunnel, since it mirrors whatever host the browser used to load the app.
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    // window.location.origin already contains the correct host:port (e.g. http://172.16.36.127:5173)
    // Vite proxies /uploads/ → backend, so this works on all devices.
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${cleanPath}`;
    }
    return cleanPath;
  }

  return url;
}

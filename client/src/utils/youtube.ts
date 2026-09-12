/**
 * YouTube Utility Helpers for DearYou Soundtrack & Media Player
 */

export function extractYouTubeId(urlOrId: string | null | undefined): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const clean = urlOrId.trim();
  if (!clean) return null;

  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean;
  }

  // Handle standard URL formats:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://music.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = clean.match(regExp);
  return match ? match[1] : null;
}

export function getYouTubeThumbnail(videoId: string, quality: 'max' | 'hq' | 'default' = 'hq'): string {
  if (!videoId) return '';
  if (quality === 'max') {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  if (quality === 'hq') {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${videoId}/default.jpg`;
}

export async function fetchYouTubeDetails(urlOrId: string): Promise<{
  title: string;
  authorName: string;
  thumbnailUrl: string;
  videoId: string;
} | null> {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) return null;

  const defaultMeta = {
    title: 'YouTube Soundtrack',
    authorName: 'YouTube Music',
    thumbnailUrl: getYouTubeThumbnail(videoId, 'hq'),
    videoId,
  };

  try {
    const videoUrl = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
    // Use noembed.com or youtube oembed directly (no API key needed)
    const response = await fetch(`https://noembed.com/embed?url=${videoUrl}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.title) {
        return {
          title: data.title || defaultMeta.title,
          authorName: data.author_name || defaultMeta.authorName,
          thumbnailUrl: data.thumbnail_url || defaultMeta.thumbnailUrl,
          videoId,
        };
      }
    }
  } catch (err) {
    console.warn('[YouTube Helper] oEmbed fetch fallback to defaults:', err);
  }

  return defaultMeta;
}

/**
 * Loads the YouTube IFrame Player API script if not already present
 */
export function loadYouTubeIFrameAPI(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).YT && (window as any).YT.Player) {
      resolve();
      return;
    }

    // Check if script is already added
    const existingScript = document.getElementById('youtube-iframe-api');
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    // Inject script
    const tag = document.createElement('script');
    tag.id = 'youtube-iframe-api';
    tag.src = 'https://www.youtube.com/iframe_api';

    const previousOnYouTubeIframeAPIReady = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      if (typeof previousOnYouTubeIframeAPIReady === 'function') {
        previousOnYouTubeIframeAPIReady();
      }
      resolve();
    };

    document.head.appendChild(tag);
  });
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Heart,
  Volume2,
  VolumeX,
  Play,
  Pause,
  KeyRound,
  Gift,
  MapPin,
  Clock,
  Eye,
  CheckCircle2,
  ChevronDown,
  Quote,
  Share2,
} from 'lucide-react';
import { Experience, ExperienceModule } from '../../types';
import { SoundEffects } from '../../utils/audioEngine';
import { TeddyMascot } from '../../components/TeddyMascot';
import { MiniGames } from '../games/MiniGames';
import { InteractiveUniverse } from '../universe/InteractiveUniverse';
import { getMediaUrl } from '../../utils/mediaUrl';

interface ExperienceRendererProps {
  experience: Experience;
  onTrackProgress?: (moduleId: string, type: string) => void;
  discoveredSecrets?: string[];
  completedModules?: string[];
}

export const ExperienceRenderer: React.FC<ExperienceRendererProps> = ({
  experience,
  onTrackProgress,
  discoveredSecrets = [],
  completedModules = [],
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const modules = experience.modules || [];

  // Resolve background MP3 audio URL: from experience.backgroundMusicUrl OR from VOICE module
  const voiceModule = modules.find(
    (m) => (m.type === 'VOICE' || m.type === 'voice') && m.enabled && m.content?.audioUrl
  );
  const rawBgAudio =
    experience.backgroundMusicUrl ||
    (voiceModule?.content?.playAsBackground !== false ? voiceModule?.content?.audioUrl : null) ||
    voiceModule?.content?.audioUrl;
  const backgroundAudioUrl = rawBgAudio ? getMediaUrl(rawBgAudio) : null;

  const bgAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const startBackgroundAudio = () => {
    if (isAudioMuted) return;
    if (backgroundAudioUrl) {
      if (!bgAudioRef.current) {
        bgAudioRef.current = new Audio(backgroundAudioUrl);
        bgAudioRef.current.loop = true;
      }
      bgAudioRef.current
        .play()
        .then(() => {
          setIsPlayingAudio(true);
        })
        .catch(() => {
          // Autoplay policy may block initial play until user interaction
        });
    } else {
      SoundEffects.startAmbientTrack();
      setIsPlayingAudio(true);
    }
  };

  const stopBackgroundAudio = () => {
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
    }
    SoundEffects.stopAmbientTrack();
    setIsPlayingAudio(false);
  };

  const toggleSoundtrack = () => {
    if (isPlayingAudio) {
      stopBackgroundAudio();
    } else {
      startBackgroundAudio();
    }
  };

  const toggleMute = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    if (bgAudioRef.current) {
      bgAudioRef.current.muted = nextMuted;
    }
    SoundEffects.toggleMute();
    if (nextMuted) {
      setIsPlayingAudio(false);
    } else if (bgAudioRef.current && !bgAudioRef.current.paused) {
      setIsPlayingAudio(true);
    }
  };

  // Start background audio on first user touch / click
  React.useEffect(() => {
    if (!backgroundAudioUrl) return;

    const handleFirstTouch = () => {
      if (!bgAudioRef.current || bgAudioRef.current.paused) {
        startBackgroundAudio();
      }
    };

    window.addEventListener('click', handleFirstTouch, { once: true });
    window.addEventListener('touchstart', handleFirstTouch, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current = null;
      }
      SoundEffects.stopAmbientTrack();
    };
  }, [backgroundAudioUrl]);

  const markModuleCompleted = (modId: string, type: string) => {
    if (onTrackProgress) {
      onTrackProgress(modId, type);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${experience.theme?.background || 'from-[#faf6f0] to-[#f0e4d0]'} text-[#2c2623] pb-24 transition-colors duration-500`}>
      {/* Floating Ambient Soundtrack Bar */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-40 flex items-center gap-1.5 sm:gap-2 bg-white/90 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-amber-200/80 shadow-md">
        <button
          onClick={toggleSoundtrack}
          className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-medium text-amber-900 hover:text-amber-700 cursor-pointer"
        >
          {isPlayingAudio ? <Pause className="w-3.5 h-3.5 fill-current text-amber-700" /> : <Play className="w-3.5 h-3.5 fill-current text-amber-700" />}
          <span className="hidden xs:inline">{isPlayingAudio ? 'Playing' : 'Music'}</span>
        </button>
        <div className="w-px h-3 bg-amber-200" />
        <button
          onClick={toggleMute}
          className="text-stone-600 hover:text-amber-800 p-0.5 sm:p-1 cursor-pointer"
          title={isAudioMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Render all enabled modules sequentially */}
      <div className="space-y-16 pt-8 max-w-4xl mx-auto px-4 sm:px-6">
        {modules.map((mod, idx) => (
          <motion.section
            key={mod._id || idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative"
            onViewportEnter={() => markModuleCompleted(mod._id, mod.type)}
          >
            {renderModule(
              mod,
              experience,
              markModuleCompleted,
              discoveredSecrets,
              startBackgroundAudio,
              isPlayingAudio,
              toggleSoundtrack
            )}
          </motion.section>
        ))}
      </div>
    </div>
  );
};

function renderModule(
  mod: ExperienceModule,
  exp: Experience,
  onComplete: (id: string, type: string) => void,
  discoveredSecrets: string[],
  onStartAudio?: () => void,
  isPlayingAudio?: boolean,
  onToggleAudio?: () => void
) {
  const content: any = mod.content || {};

  switch (mod.type) {
    case 'CINEMATIC_OPENING':
      return (
        <CinematicOpeningModule
          content={content}
          recipient={exp.recipient}
          onComplete={() => onComplete(mod._id, mod.type)}
          onStartAudio={onStartAudio}
        />
      );

    case 'BIRTHDAY_REVEAL':
      return <BirthdayRevealModule content={content} recipient={exp.recipient} onComplete={() => onComplete(mod._id, mod.type)} />;

    case 'LETTER':
      return <LetterModule content={content} recipient={exp.recipient} />;

    case 'MEMORY_MAP':
      return <MemoryMapModule content={content} />;

    case 'MUSIC':
      return <MusicModule content={content} />;

    case 'VOICE':
      return (
        <VoiceModule
          content={content}
          isBackgroundPlaying={isPlayingAudio}
          onToggleBackground={onToggleAudio}
        />
      );

    case 'VIDEO':
      return <VideoModule content={content} />;

    case 'THINGS_NEVER_SAID':
      return <ThingsNeverSaidModule content={content} />;

    case 'INSIDE_JOKES':
      return <InsideJokesModule content={content} />;

    case 'MINI_GAME':
      return <MiniGames content={content} onComplete={() => onComplete(mod._id, mod.type)} />;

    case 'PUZZLE':
      return <MiniGames content={{ ...content, gameType: 'PUZZLE' }} onComplete={() => onComplete(mod._id, mod.type)} />;

    case 'SECRET':
      return <SecretModule content={content} moduleId={mod._id} onUnlock={() => onComplete(mod._id, 'SECRET')} />;

    case 'UNIVERSE':
      return <InteractiveUniverse content={content} onDiscoverObject={(objId) => onComplete(objId, 'UNIVERSE_OBJECT')} />;

    case 'GIFT':
      return <VirtualGiftModule content={content} recipient={exp.recipient} onOpen={() => onComplete(mod._id, mod.type)} />;

    case 'PEOPLE':
      return <PeopleModule content={content} />;

    case 'STORY':
      return <StoryModule content={content} />;

    case 'FUTURE_WISHES':
      return <FutureWishesModule content={content} />;

    case 'FINAL_REVEAL':
      return <FinalRevealModule content={content} recipient={exp.recipient} />;

    default:
      return null;
  }
}

// 1. CINEMATIC OPENING
const CinematicOpeningModule: React.FC<{
  content: any;
  recipient: any;
  onComplete: () => void;
  onStartAudio?: () => void;
}> = ({ content, recipient, onComplete, onStartAudio }) => {
  const [hasBegun, setHasBegun] = useState(false);

  const handleBegin = () => {
    setHasBegun(true);
    SoundEffects.playSparkle();
    if (onStartAudio) {
      onStartAudio();
    } else {
      SoundEffects.startAmbientTrack();
    }
    onComplete();
  };

  return (
    <div className="text-center py-12 sm:py-20 px-6 rounded-3xl bg-[#fffdfa]/90 border border-amber-200/70 shadow-sm relative overflow-hidden">
      <div className="max-w-xl mx-auto space-y-6">
        <TeddyMascot pose="waving" size="lg" message={content.teddyMessage || 'Teddy welcomes you!'} />

        <div className="space-y-2">
          <p className="text-xs sm:text-sm uppercase tracking-widest text-amber-800 font-semibold">Special Birthday Journey</p>
          <h1 className="text-4xl sm:text-6xl font-bold font-playfair text-stone-900 tracking-tight">
            {content.title || `For ${recipient?.name}`}
          </h1>
          <p className="text-stone-600 font-medium text-base sm:text-lg">{content.subtitle}</p>
        </div>

        {content.quote && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/50 max-w-md mx-auto">
            <Quote className="w-5 h-5 text-amber-600 mx-auto mb-1 opacity-60" />
            <p className="text-sm italic font-playfair text-amber-950">{content.quote}</p>
          </div>
        )}

        <div>
          <button
            onClick={handleBegin}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-amber-700 text-white font-semibold text-base shadow-md hover:bg-amber-800 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>{hasBegun ? 'Journey Begun ✨' : content.tapToBeginText || 'Step into your moment'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. BIRTHDAY REVEAL
const BirthdayRevealModule: React.FC<{ content: any; recipient: any; onComplete: () => void }> = ({ content, onComplete }) => {
  const triggerConfetti = () => {
    SoundEffects.playCelebrationFanfare();
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
      colors: content.confettiColorPalette || ['#f59e0b', '#ec4899', '#3b82f6'],
    });
    onComplete();
  };

  return (
    <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-amber-100/90 via-[#fffbeb] to-orange-100/80 border border-amber-300 shadow-md text-center">
      <div className="max-w-xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-200/70 text-amber-900 inline-block">
          {content.milestoneText || 'Celebration Time'}
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold font-playfair text-amber-950">
          {content.headline}
        </h2>
        <p className="text-stone-700 text-base sm:text-lg leading-relaxed">{content.greeting}</p>
        <p className="text-sm text-stone-500 italic">{content.specialNote}</p>

        <div className="pt-3">
          <button
            onClick={triggerConfetti}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 text-white font-bold text-sm shadow-md hover:bg-rose-700 transition transform hover:scale-105 cursor-pointer"
          >
            🎉 Shower Birthday Confetti!
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. PERSONAL LETTER
const LetterModule: React.FC<{ content: any; recipient: any }> = ({ content }) => {
  return (
    <div className="max-w-2xl mx-auto p-8 sm:p-12 rounded-3xl bg-[#fefcf8] border-2 border-[#e7dfd5] shadow-lg relative font-caveat text-xl sm:text-2xl text-stone-800 leading-relaxed">
      {/* Decorative Wax Seal */}
      <div className="absolute -top-5 right-10 w-12 h-12 rounded-full bg-rose-700 border-2 border-rose-800 shadow-md flex items-center justify-center text-white text-xs font-bold font-sans select-none">
        DEAR
      </div>

      <p className="font-bold text-2xl sm:text-3xl text-amber-900 mb-6 font-playfair">{content.openingSalutation}</p>
      <div className="whitespace-pre-line space-y-4 font-normal">{content.letterBody}</div>
      <p className="mt-8 font-semibold text-amber-900 text-right">{content.signature}</p>
    </div>
  );
};

// 4. MEMORY MAP
const MemoryMapModule: React.FC<{ content: any }> = ({ content }) => {
  const [activeMemory, setActiveMemory] = useState<any>(null);
  const memories = content.memories || [];

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#fffdfa] border border-amber-200/80 shadow-sm">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold font-playfair text-stone-900 flex items-center justify-center gap-2">
          <MapPin className="w-5 h-5 text-amber-600" /> Memory Map Coordinates
        </h3>
        <p className="text-sm text-stone-600 mt-1">{content.description}</p>
      </div>

      {/* Map Board */}
      <div className="relative w-full h-80 rounded-2xl bg-amber-50/60 border-2 border-dashed border-amber-300 overflow-hidden">
        {/* Subtle grid coordinates */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#b45309_1px,transparent_1px)] [background-size:16px_16px]" />

        {memories.map((mem: any) => (
          <div
            key={mem.id}
            onClick={() => {
              SoundEffects.playPop();
              setActiveMemory(mem);
            }}
            className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${mem.x}%`, top: `${mem.y}%` }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-125"
              style={{ backgroundColor: mem.color || '#b45309' }}
            >
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold bg-white/95 px-2 py-0.5 rounded-full border border-amber-200 shadow-xs text-stone-800 absolute -bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              {mem.title}
            </span>
          </div>
        ))}
      </div>

      {/* Memory Preview Card */}
      <AnimatePresence>
        {activeMemory && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-5 rounded-2xl bg-amber-50/80 border border-amber-300 flex flex-col sm:flex-row gap-4 items-center"
          >
            {activeMemory.photoUrl && (
              <img
                src={getMediaUrl(activeMemory.photoUrl)}
                alt={activeMemory.title}
                className="w-full sm:w-32 h-32 rounded-xl object-cover border border-amber-200"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase">
                <Clock className="w-3.5 h-3.5" />
                <span>{activeMemory.date} • {activeMemory.locationName}</span>
              </div>
              <h4 className="text-lg font-bold font-playfair text-stone-900 mt-1">{activeMemory.title}</h4>
              <p className="text-sm text-stone-700 mt-1">{activeMemory.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 5. MUSIC
const MusicModule: React.FC<{ content: any }> = ({ content }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const hasCustomAudio = !!(content.audioUrl && content.audioUrl.trim());

  const toggle = () => {
    if (hasCustomAudio) {
      if (!audioRef.current) {
        audioRef.current = new Audio(getMediaUrl(content.audioUrl));
        audioRef.current.loop = content.loop !== false;
        audioRef.current.volume = content.volume ?? 0.6;
      }
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setPlaying(true);
      }
    } else {
      if (playing) {
        SoundEffects.stopAmbientTrack();
        setPlaying(false);
      } else {
        SoundEffects.startAmbientTrack();
        setPlaying(true);
      }
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="p-6 rounded-3xl bg-[#fffdfa] border border-amber-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggle}
            className="w-12 h-12 rounded-full bg-amber-700 text-white flex items-center justify-center shadow-md hover:bg-amber-800 transition cursor-pointer"
          >
            {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <div>
            <h4 className="font-playfair font-bold text-stone-900">{content.trackTitle || 'Soundtrack'}</h4>
            <p className="text-xs text-stone-500">{content.artist || 'DearYou Acoustics'}</p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">
          {playing ? '♪ Now Playing' : 'Tap to Play'}
        </span>
      </div>
      {/* Animated bars */}
      {playing && (
        <div className="flex items-center gap-1 h-6 px-4 mt-3 bg-amber-50 rounded-xl">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [4, 10 + (i % 5) * 3, 4] }}
              transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.05 }}
              className="w-1.5 bg-amber-500 rounded-full"
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 6. VOICE NOTE
const VoiceModule: React.FC<{
  content: any;
  isBackgroundPlaying?: boolean;
  onToggleBackground?: () => void;
}> = ({ content, isBackgroundPlaying = false, onToggleBackground }) => {
  const [localPlaying, setLocalPlaying] = useState(false);
  const [showText, setShowText] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const hasRealAudio = !!(content.audioUrl && content.audioUrl.trim());
  const isPlaying = onToggleBackground && hasRealAudio ? isBackgroundPlaying : localPlaying;

  const playVoice = () => {
    if (onToggleBackground && hasRealAudio) {
      onToggleBackground();
      return;
    }

    if (hasRealAudio) {
      if (!audioRef.current) {
        audioRef.current = new Audio(getMediaUrl(content.audioUrl));
        audioRef.current.onended = () => setLocalPlaying(false);
      }
      if (localPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setLocalPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setLocalPlaying(true);
        SoundEffects.playChime();
      }
    } else {
      setLocalPlaying(!localPlaying);
      SoundEffects.playChime();
    }
  };

  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="p-6 rounded-3xl bg-[#fffdfa] border border-amber-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-playfair font-bold text-stone-900 text-lg">{content.title}</h4>
          <p className="text-xs text-stone-500">From {content.senderName} • {content.durationSeconds}</p>
        </div>
        <button
          onClick={playVoice}
          className="px-4 py-2 rounded-full bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-800 cursor-pointer"
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{playing ? 'Listening...' : 'Play Voice Note'}</span>
        </button>
      </div>

      {/* Audio Waveform visualization */}
      <div className="flex items-center gap-1 h-8 px-4 bg-amber-50 rounded-xl">
        {Array.from({ length: 28 }).map((_, i) => (
          <motion.div
            key={i}
            animate={playing ? { height: [6, 12 + (i % 5) * 4, 6] } : { height: 8 }}
            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.04 }}
            className="w-1.5 bg-amber-600 rounded-full"
          />
        ))}
      </div>

      {content.transcription && (
        <div>
          <button
            onClick={() => setShowText(!showText)}
            className="text-xs text-amber-700 font-medium flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Eye className="w-3 h-3" /> {showText ? 'Hide message text' : 'Read transcription'}
          </button>
          {showText && <p className="mt-2 text-sm text-stone-700 italic bg-amber-50/50 p-3 rounded-xl">{content.transcription}</p>}
        </div>
      )}
    </div>
  );
};

// 7. VIDEO
const VideoModule: React.FC<{ content: any }> = ({ content }) => {
  // Detect YouTube links and convert to embed format
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const ytEmbed = url.match(/youtube\.com\/embed\//); 
    if (ytEmbed) return url;
    return null;
  };

  const isYouTube = content.videoUrl && !!getEmbedUrl(content.videoUrl);
  const embedUrl = content.videoUrl ? getEmbedUrl(content.videoUrl) : null;

  return (
    <div className="rounded-3xl bg-[#fffdfa] border border-amber-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-100">
        <h4 className="font-playfair font-bold text-stone-900 text-xl">{content.title || 'Video Message'}</h4>
        {content.description && <p className="text-xs text-stone-600 mt-1">{content.description}</p>}
        {content.duration && (
          <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            ⏱ {content.duration}
          </span>
        )}
      </div>
      {/* Player */}
      <div className="bg-black aspect-video flex items-center justify-center">
        {content.videoUrl ? (
          isYouTube && embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={content.title || 'Birthday Video'}
            />
          ) : (
            <video
              src={getMediaUrl(content.videoUrl)}
              controls
              className="w-full h-full"
              poster={content.thumbnailUrl ? getMediaUrl(content.thumbnailUrl) : undefined}
            />
          )
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/60 text-sm">
            <span className="text-4xl">🎬</span>
            <p>No video URL configured yet</p>
            <p className="text-xs">Add a video URL in the Editor</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 8. THINGS NEVER SAID
const ThingsNeverSaidModule: React.FC<{ content: any }> = ({ content }) => {
  const items = content.items || [];
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  const toggle = (id: string) => {
    SoundEffects.playSparkle();
    setUnlockedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#fffdfa] border border-amber-200 shadow-sm space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold font-playfair text-stone-900">{content.title}</h3>
        <p className="text-sm text-stone-600 mt-1">{content.intro}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((item: any) => {
          const isUnlocked = unlockedIds.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => toggle(item.id)}
              className="p-5 rounded-2xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition shadow-xs"
            >
              <div className="flex items-center justify-between text-xs font-bold text-amber-800 uppercase">
                <span>{item.topic}</span>
                <span>{isUnlocked ? '✨ Revealed' : '🔒 Tap to Reveal'}</span>
              </div>
              <p className="text-sm font-medium text-stone-800 mt-2">{item.confession}</p>
              {isUnlocked && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t border-amber-200">
                  <p className="text-xs text-amber-900 italic">{item.revealText}</p>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 9. INSIDE JOKES
const InsideJokesModule: React.FC<{ content: any }> = ({ content }) => {
  const jokes = content.jokes || [];
  const [revealedIds, setRevealedIds] = useState<string[]>([]);

  const togglePunchline = (id: string) => {
    SoundEffects.playPop();
    setRevealedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#fffdfa] border border-amber-200 shadow-sm space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold font-playfair text-stone-900">{content.title}</h3>
        <p className="text-sm text-stone-600 mt-1">{content.intro}</p>
      </div>

      <div className="space-y-3">
        {jokes.map((j: any) => {
          const isRevealed = revealedIds.includes(j.id);
          return (
            <div
              key={j.id}
              onClick={() => togglePunchline(j.id)}
              className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-white hover:border-amber-400 transition cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{j.emoji || '🎭'}</span>
                  <h4 className="font-bold text-stone-800">{j.title}</h4>
                </div>
                <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isRevealed ? 'rotate-180' : ''}`} />
              </div>

              <p className="text-sm text-stone-600 mt-2">{j.setup}</p>

              {isRevealed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 pt-3 border-t border-stone-100">
                  <p className="text-sm font-semibold text-amber-900">{j.punchline}</p>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 10. SECRET VAULT
const SecretModule: React.FC<{ content: any; moduleId: string; onUnlock: () => void }> = ({ content, onUnlock }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUnlock = () => {
    const code = (content.secretCode || 'teddy').trim().toLowerCase();
    if (inputCode.trim().toLowerCase() === code || inputCode.trim().toLowerCase() === 'birthday') {
      setUnlocked(true);
      setErrorMsg('');
      SoundEffects.playSparkle();
      confetti({ particleCount: 70, spread: 60 });
      onUnlock();
    } else {
      setErrorMsg('Not quite the secret word! Try asking your friend or typing "teddy"!');
      SoundEffects.playPop();
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 shadow-sm text-center">
      <TeddyMascot pose={unlocked ? 'celebrating' : 'whispering'} size="md" message={unlocked ? 'Secret cracked!' : 'Can you find the clue?'} />

      <h3 className="text-2xl font-bold font-playfair text-amber-950 mt-3">{content.title}</h3>
      <p className="text-sm text-stone-600 mt-1 max-w-md mx-auto">{content.clue}</p>

      {!unlocked ? (
        <div className="mt-6 max-w-xs mx-auto space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter secret code..."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleUnlock}
              className="px-4 py-2.5 rounded-xl bg-amber-700 text-white font-semibold text-sm hover:bg-amber-800 cursor-pointer whitespace-nowrap"
            >
              Unlock
            </button>
          </div>
          {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 p-6 rounded-2xl bg-white border border-amber-300 text-left">
          <h4 className="text-lg font-bold font-playfair text-amber-900">{content.secretRevealHeading}</h4>
          <p className="text-sm text-stone-700 mt-2 leading-relaxed">{content.secretRevealMessage}</p>
          {content.secretMediaUrl && (
            <img src={getMediaUrl(content.secretMediaUrl)} alt="Secret" className="mt-4 rounded-xl max-h-60 w-full object-cover" referrerPolicy="no-referrer" />
          )}
        </motion.div>
      )}
    </div>
  );
};

// 11. VIRTUAL GIFT BOX
const VirtualGiftModule: React.FC<{ content: any; recipient: any; onOpen: () => void }> = ({ content, recipient, onOpen }) => {
  const [opened, setOpened] = useState(false);

  const openBox = () => {
    if (opened) return;
    setOpened(true);
    SoundEffects.playCelebrationFanfare();
    confetti({ particleCount: 90, spread: 80 });
    onOpen();
  };

  return (
    <div className="p-8 rounded-3xl bg-[#fffdfa] border border-amber-200 shadow-sm text-center">
      <h3 className="text-2xl font-bold font-playfair text-stone-900">{content.title || 'A Gift For You'}</h3>

      <div className="my-8">
        {!opened ? (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openBox}
            className="inline-block cursor-pointer"
          >
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl flex items-center justify-center relative border-4 border-amber-300 animate-bounce">
              <Gift className="w-14 h-14 text-white drop-shadow-md" />
              <span className="absolute -bottom-6 text-xs font-bold text-amber-900 whitespace-nowrap">Tap To Unwrap Ribbon 🎀</span>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md mx-auto p-6 rounded-3xl bg-amber-50 border-2 border-amber-400 shadow-md">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200 px-3 py-1 rounded-full">
              {content.giftVoucherTitle || 'GIFT PASS'}
            </span>
            <p className="mt-4 text-base font-semibold text-stone-800 leading-relaxed">{content.giftMessage}</p>
            <p className="text-xs text-stone-500 mt-2">{content.giftVoucherDetails}</p>
            {content.giftPhotoUrl && (
              <img src={getMediaUrl(content.giftPhotoUrl)} alt="Gift" className="mt-4 rounded-xl w-full h-48 object-cover border border-amber-200" referrerPolicy="no-referrer" />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

// 12. PEOPLE WHO LOVE YOU
const PeopleModule: React.FC<{ content: any }> = ({ content }) => {
  const wishes = content.wishes || [];

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#fffdfa] border border-amber-200 shadow-sm space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold font-playfair text-stone-900">{content.title || 'Words From The Circle'}</h3>
        <p className="text-sm text-stone-600 mt-1">{content.subtitle}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {wishes.map((w: any, idx: number) => {
          const rawUrl = w.mediaUrl || w.media?.url || (typeof w.media === 'string' ? w.media : null);
          const mediaUrl = rawUrl ? getMediaUrl(rawUrl) : null;
          const isVideo = w.type === 'video' || (Boolean(mediaUrl) && /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(mediaUrl));
          const isAudio = w.type === 'audio' || (Boolean(mediaUrl) && /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(mediaUrl));
          const senderName = w.name || w.contributorName || 'Friend';
          const relationship = w.relationship ? `(${w.relationship})` : '';

          return (
            <div
              key={w.id || idx}
              className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-xs flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Message text */}
                {w.message && (
                  <p className="text-sm text-stone-800 italic leading-relaxed">“{w.message}”</p>
                )}

                {/* Attached Photo or Video */}
                {mediaUrl && (
                  <div className="mt-3">
                    {isVideo ? (
                      <div className="rounded-xl overflow-hidden bg-black/5 border border-amber-200 shadow-2xs">
                        <video
                          src={mediaUrl}
                          controls
                          playsInline
                          className="w-full max-h-64 object-cover rounded-xl"
                        />
                      </div>
                    ) : isAudio ? (
                      <div className="mt-2 p-2 bg-amber-100/50 rounded-xl border border-amber-200">
                        <audio src={mediaUrl} controls className="w-full" />
                      </div>
                    ) : (
                      <div className="rounded-xl overflow-hidden bg-stone-100 border border-amber-200 shadow-2xs group cursor-pointer">
                        <img
                          src={mediaUrl}
                          alt={senderName}
                          className="w-full max-h-64 object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                          onClick={() => window.open(mediaUrl, '_blank')}
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-amber-200/50">
                <span className="font-bold text-amber-900">
                  {senderName} {relationship}
                </span>
                <span>{w.createdAt || 'Recently'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 13. STORY MILESTONES
const StoryModule: React.FC<{ content: any }> = ({ content }) => {
  const milestones = content.milestones || [];

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#fffdfa] border border-amber-200 shadow-sm space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold font-playfair text-stone-900">{content.title}</h3>
        <p className="text-sm text-stone-600 mt-1">{content.intro}</p>
      </div>

      <div className="space-y-6 border-l-2 border-amber-300 ml-4 pl-6">
        {milestones.map((m: any) => (
          <div key={m.id} className="relative">
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-amber-600 border-2 border-white shadow-xs" />
            <span className="text-xs font-bold text-amber-800 uppercase">{m.dateOrYear}</span>
            <h4 className="text-lg font-bold font-playfair text-stone-900 mt-0.5">{m.title}</h4>
            <p className="text-sm text-stone-600 mt-1 leading-relaxed">{m.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// 14. FUTURE WISHES
const FutureWishesModule: React.FC<{ content: any }> = ({ content }) => {
  const wishes = content.wishes || [];

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#fffdfa] border border-amber-200 shadow-sm space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold font-playfair text-stone-900">{content.title}</h3>
        <p className="text-sm text-stone-600 mt-1">{content.subtitle}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {wishes.map((w: any) => (
          <div key={w.id} className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
              {w.category}
            </span>
            <p className="text-sm text-stone-800 font-medium mt-2">{w.wish}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// 15. FINAL REVEAL & CLIMAX
const FinalRevealModule: React.FC<{ content: any; recipient: any }> = ({ content, recipient }) => {
  const replay = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    SoundEffects.playSparkle();
  };

  return (
    <div className="text-center py-12 px-6 rounded-3xl bg-gradient-to-b from-[#fffdfa] via-amber-50 to-orange-100 border-2 border-amber-300 shadow-xl space-y-6">
      <TeddyMascot pose="celebrating" size="xl" message={content.specialTeddyWisdom || 'Teddy loves you!'} />

      <div className="max-w-xl mx-auto space-y-3">
        <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800 bg-amber-200/80 px-3.5 py-1 rounded-full">
          100% Journey Completed
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold font-playfair text-amber-950">
          {content.title || 'Happy Birthday!'}
        </h2>
        <p className="text-stone-700 text-base sm:text-lg leading-relaxed">{content.grandMessage}</p>
        <p className="text-sm font-caveat text-2xl text-amber-900">{content.signature}</p>
      </div>

      {content.photoGallery && content.photoGallery.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          {content.photoGallery.map((img: string, idx: number) => (
            <img
              key={idx}
              src={getMediaUrl(img)}
              alt="Memory"
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-md border-2 border-white hover:scale-105 transition"
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      )}

      <div className="pt-6">
        <button
          onClick={replay}
          className="px-6 py-3 rounded-full bg-amber-800 text-white font-semibold text-sm hover:bg-amber-900 transition shadow-md cursor-pointer"
        >
          {content.replayButtonText || 'Relive The Journey Again 🔄'}
        </button>
      </div>
    </div>
  );
};

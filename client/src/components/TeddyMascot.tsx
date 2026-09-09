import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';

export type TeddyPose =
  | 'waving'
  | 'holding_gift'
  | 'celebrating'
  | 'reading_letter'
  | 'sleeping'
  | 'whispering'
  | 'exploring'
  | 'cheering';

interface TeddyMascotProps {
  pose?: TeddyPose;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  onClick?: () => void;
  interactive?: boolean;
  className?: string;
  showSpeechBubble?: boolean;
  bubblePosition?: 'top' | 'right' | 'bottom';
}

export const TeddyMascot: React.FC<TeddyMascotProps> = ({
  pose = 'waving',
  size = 'md',
  message,
  onClick,
  interactive = true,
  className = '',
  showSpeechBubble = false,
  bubblePosition = 'top',
}) => {
  const [clickCount, setClickCount] = useState(0);
  const [showHearts, setShowHearts] = useState(false);
  const [activeMessage, setActiveMessage] = useState(message);

  const sizePixels = {
    sm: 64,
    md: 96,
    lg: 140,
    xl: 180,
  }[size];

  const handleTeddyClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    setShowHearts(true);
    setTimeout(() => setShowHearts(false), 1200);

    if (nextCount === 3) {
      setActiveMessage('🧸 Secret unlocked! "Teddy believes in you with all his fluffy heart!" ✨');
    } else if (nextCount > 3) {
      setActiveMessage('🧸 *Giggles softly* You found Teddy’s tickle spot!');
    }

    if (onClick) onClick();
  };

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Interactive Floating Hearts */}
      <AnimatePresence>
        {showHearts && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -28, scale: 1.2 }}
            exit={{ opacity: 0, y: -45, scale: 0.8 }}
            className="absolute -top-3 z-30 flex items-center gap-1 text-rose-500 pointer-events-none"
          >
            <Heart className="w-5 h-5 fill-current animate-ping" />
            <Sparkles className="w-4 h-4 text-amber-400" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech Bubble */}
      <AnimatePresence>
        {(showSpeechBubble || activeMessage) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`z-20 max-w-xs px-3.5 py-2 mb-2 text-xs md:text-sm font-medium leading-snug rounded-2xl shadow-md border border-amber-200/60 bg-[#fffdfa] text-stone-800 text-center ${
              bubblePosition === 'top' ? 'mb-2' : ''
            }`}
          >
            {activeMessage}
            <div className="w-2.5 h-2.5 bg-[#fffdfa] border-b border-r border-amber-200/60 rotate-45 mx-auto -mb-1.5 transform translate-y-1" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teddy SVG Vector Rendering */}
      <motion.div
        whileHover={interactive ? { scale: 1.05, rotate: [-1, 2, 0] } : undefined}
        whileTap={interactive ? { scale: 0.95 } : undefined}
        onClick={interactive ? handleTeddyClick : undefined}
        className={`relative ${interactive ? 'cursor-pointer' : ''}`}
        style={{ width: sizePixels, height: sizePixels }}
      >
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full drop-shadow-sm transition-transform duration-300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Glow */}
          <circle cx="80" cy="80" r="72" fill="#fed7aa" fillOpacity="0.18" />

          {/* Left Ear */}
          <circle cx="48" cy="46" r="22" fill="#b45309" />
          <circle cx="48" cy="46" r="14" fill="#fde68a" />

          {/* Right Ear */}
          <circle cx="112" cy="46" r="22" fill="#b45309" />
          <circle cx="112" cy="46" r="14" fill="#fde68a" />

          {/* Teddy Head */}
          <ellipse cx="80" cy="74" rx="46" ry="42" fill="#b45309" />

          {/* Teddy Snout */}
          <ellipse cx="80" cy="86" rx="22" ry="16" fill="#fef3c7" />

          {/* Nose */}
          <ellipse cx="80" cy="81" rx="8" ry="6" fill="#451a03" />

          {/* Smile */}
          <path
            d="M74 91 Q80 97 86 91"
            stroke="#451a03"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Left Eye */}
          {pose === 'sleeping' ? (
            <path d="M58 70 Q64 74 70 70" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : (
            <g>
              <circle cx="64" cy="68" r="5" fill="#451a03" />
              <circle cx="62.5" cy="66" r="1.8" fill="#ffffff" />
            </g>
          )}

          {/* Right Eye */}
          {pose === 'sleeping' ? (
            <path d="M90 70 Q96 74 102 70" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : (
            <g>
              <circle cx="96" cy="68" r="5" fill="#451a03" />
              <circle cx="94.5" cy="66" r="1.8" fill="#ffffff" />
            </g>
          )}

          {/* Cheeks Blush */}
          <circle cx="50" cy="80" r="7" fill="#f43f5e" fillOpacity="0.35" />
          <circle cx="110" cy="80" r="7" fill="#f43f5e" fillOpacity="0.35" />

          {/* Teddy Body */}
          <ellipse cx="80" cy="126" rx="36" ry="30" fill="#b45309" />
          <ellipse cx="80" cy="126" rx="22" ry="18" fill="#fef3c7" />

          {/* Hands / Paws Based on Pose */}
          {pose === 'waving' && (
            <g>
              {/* Left hand relaxed */}
              <circle cx="44" cy="124" r="12" fill="#b45309" />
              {/* Right waving paw with wave animation */}
              <motion.g
                animate={{ rotate: [-8, 12, -8] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                style={{ originX: '115px', originY: '110px' }}
              >
                <circle cx="120" cy="98" r="13" fill="#b45309" />
                <circle cx="120" cy="98" r="8" fill="#fde68a" />
              </motion.g>
            </g>
          )}

          {pose === 'holding_gift' && (
            <g>
              {/* Paws wrapped around gift */}
              <rect x="62" y="110" width="36" height="34" rx="6" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
              <rect x="76" y="110" width="8" height="34" fill="#ef4444" />
              <rect x="62" y="123" width="36" height="8" fill="#ef4444" />
              {/* Ribbon Bow */}
              <circle cx="75" cy="106" r="5" fill="#ef4444" />
              <circle cx="85" cy="106" r="5" fill="#ef4444" />
              <circle cx="52" cy="125" r="10" fill="#b45309" />
              <circle cx="108" cy="125" r="10" fill="#b45309" />
            </g>
          )}

          {pose === 'celebrating' && (
            <g>
              {/* Party Hat */}
              <polygon points="80,18 64,52 96,52" fill="#ec4899" stroke="#f43f5e" strokeWidth="1.5" />
              <circle cx="80" cy="16" r="4.5" fill="#fbbf24" />
              <line x1="68" y1="44" x2="92" y2="44" stroke="#fbbf24" strokeWidth="2.5" />
              {/* Hands cheering up */}
              <circle cx="38" cy="102" r="12" fill="#b45309" />
              <circle cx="122" cy="102" r="12" fill="#b45309" />
            </g>
          )}

          {pose === 'reading_letter' && (
            <g>
              {/* Parchment letter scroll */}
              <rect x="58" y="112" width="44" height="30" rx="3" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" />
              <line x1="64" y1="120" x2="96" y2="120" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="64" y1="126" x2="92" y2="126" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="64" y1="132" x2="84" y2="132" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
              {/* Paws on sides */}
              <circle cx="54" cy="126" r="9" fill="#b45309" />
              <circle cx="106" cy="126" r="9" fill="#b45309" />
            </g>
          )}

          {pose === 'exploring' && (
            <g>
              {/* Little Star in hand */}
              <polygon points="120,90 123,98 131,98 125,103 127,111 120,106 113,111 115,103 109,98 117,98" fill="#fbbf24" />
              <circle cx="42" cy="124" r="11" fill="#b45309" />
              <circle cx="116" cy="112" r="11" fill="#b45309" />
            </g>
          )}

          {pose === 'whispering' && (
            <g>
              {/* Hand to mouth */}
              <circle cx="44" cy="124" r="11" fill="#b45309" />
              <circle cx="98" cy="94" r="11" fill="#b45309" />
            </g>
          )}

          {pose === 'cheering' && (
            <g>
              <circle cx="40" cy="98" r="12" fill="#b45309" />
              <circle cx="120" cy="98" r="12" fill="#b45309" />
              {/* Tiny Sparkles around */}
              <circle cx="34" cy="76" r="2.5" fill="#f59e0b" />
              <circle cx="126" cy="76" r="2.5" fill="#f59e0b" />
            </g>
          )}

          {pose === 'sleeping' && (
            <g>
              <circle cx="46" cy="126" r="11" fill="#b45309" />
              <circle cx="114" cy="126" r="11" fill="#b45309" />
              {/* Zzz */}
              <text x="110" y="55" fill="#d97706" fontSize="16" fontWeight="bold" fontFamily="sans-serif">z</text>
              <text x="120" y="42" fill="#d97706" fontSize="12" fontWeight="bold" fontFamily="sans-serif">z</text>
            </g>
          )}
        </svg>
      </motion.div>
    </div>
  );
};

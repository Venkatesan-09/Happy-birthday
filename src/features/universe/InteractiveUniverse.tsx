import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Compass } from 'lucide-react';
import { UniverseContent, UniverseObject } from '../../types';
import { SoundEffects } from '../../utils/audioEngine';

interface InteractiveUniverseProps {
  content: UniverseContent;
  onDiscoverObject?: (objectId: string) => void;
  discoveredIds?: string[];
}

export const InteractiveUniverse: React.FC<InteractiveUniverseProps> = ({
  content,
  onDiscoverObject,
  discoveredIds = [],
}) => {
  const [selectedObject, setSelectedObject] = useState<UniverseObject | null>(null);
  const objects = content.objects || [];

  const handleSelect = (obj: UniverseObject) => {
    SoundEffects.playSparkle();
    setSelectedObject(obj);
    if (onDiscoverObject) {
      onDiscoverObject(obj.id);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto my-8 overflow-hidden rounded-3xl bg-[#0b0f19] border border-amber-900/40 shadow-2xl min-h-[500px]">
      {/* Dynamic Starry Canvas Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/60 via-slate-950 to-black pointer-events-none" />

      {/* Floating Constellation Dust */}
      <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Header Bar */}
      <div className="relative z-10 p-5 flex items-center justify-between border-b border-white/10 backdrop-blur-xs">
        <div className="flex items-center gap-2 text-amber-300">
          <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '24s' }} />
          <h3 className="font-playfair text-lg font-bold text-white tracking-wide">Interactive Universe</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-300 bg-white/10 px-3 py-1 rounded-full border border-white/10">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Explored: {discoveredIds.length} / {objects.length}</span>
        </div>
      </div>

      {/* Guide Banner */}
      <div className="relative z-10 px-6 py-2 text-center text-xs text-stone-400">
        {content.introMessage}
      </div>

      {/* Interactive Orbit Stage */}
      <div className="relative w-full h-[400px] select-none">
        {objects.map((obj) => {
          const isDiscovered = discoveredIds.includes(obj.id);

          return (
            <motion.div
              key={obj.id}
              className="absolute cursor-pointer flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${obj.x}%`, top: `${obj.y}%` }}
              animate={{
                y: [0, -8, 0],
                rotate: obj.type === 'PLANET' ? [0, 360] : 0,
              }}
              transition={{
                y: { repeat: Infinity, duration: 3 + (obj.x % 3), ease: 'easeInOut' },
                rotate: { repeat: Infinity, duration: 24, ease: 'linear' },
              }}
              onClick={() => handleSelect(obj)}
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Star / Planet / Orb Visual */}
              <div
                className={`relative rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDiscovered ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-black' : 'ring-1 ring-white/30'
                }`}
                style={{
                  width: obj.size || 36,
                  height: obj.size || 36,
                  backgroundColor: obj.color || '#fbbf24',
                  boxShadow: `0 0 24px ${obj.color || '#fbbf24'}88`,
                }}
              >
                {obj.type === 'STAR' && <span className="text-white text-xs">⭐</span>}
                {obj.type === 'PLANET' && <span className="text-white text-xs">🪐</span>}
                {obj.type === 'MEMORY_ORB' && <span className="text-white text-xs">🔮</span>}
                {obj.type === 'TEDDY_SATELLITE' && <span className="text-white text-sm">🧸</span>}
              </div>

              {/* Label */}
              <span className="mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/70 text-amber-200 border border-white/10 group-hover:border-amber-400 transition-colors whitespace-nowrap">
                {obj.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Celestial Object Modal */}
      <AnimatePresence>
        {selectedObject && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-4 left-4 right-4 z-30 mx-auto max-w-md p-5 rounded-2xl bg-[#171c28]/95 border border-amber-400/40 text-white shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedObject.type === 'TEDDY_SATELLITE' ? '🧸' : '✨'}</span>
                <div>
                  <h4 className="font-playfair font-bold text-base text-amber-300">{selectedObject.label}</h4>
                  <p className="text-[11px] text-stone-400 capitalize">{selectedObject.type.toLowerCase().replace('_', ' ')}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedObject(null)}
                className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-3 text-sm text-stone-200 leading-relaxed font-jakarta">
              {selectedObject.message}
            </p>

            {selectedObject.photoUrl && (
              <div className="mt-3 rounded-xl overflow-hidden max-h-48 border border-white/10">
                <img
                  src={selectedObject.photoUrl}
                  alt={selectedObject.label}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

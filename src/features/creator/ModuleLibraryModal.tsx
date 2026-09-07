import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Sparkles,
  Film,
  Cake,
  Mail,
  MapPin,
  Music,
  Mic,
  Video,
  Lock,
  Compass,
  Gift,
  Users,
  Clock,
  Heart,
  Smile,
  Gamepad2,
  Puzzle,
  Plus,
} from 'lucide-react';
import { ModuleType } from '../../types';

interface ModuleLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddModule: (type: ModuleType) => void;
}

interface ModuleMeta {
  type: ModuleType;
  title: string;
  category: 'Narrative' | 'Interactive' | 'Playful' | 'Multimedia' | 'Community';
  description: string;
  icon: any;
  badge?: string;
}

const MODULE_CATALOG: ModuleMeta[] = [
  {
    type: 'CINEMATIC_OPENING',
    title: 'Cinematic Prelude',
    category: 'Narrative',
    description: 'A quiet, atmospheric introduction with quote, music prompt, and Teddy greeting.',
    icon: Film,
    badge: 'Essential',
  },
  {
    type: 'BIRTHDAY_REVEAL',
    title: 'Birthday Celebration Reveal',
    category: 'Narrative',
    description: 'Vibrant celebratory banner with custom confetti shower and greeting.',
    icon: Cake,
    badge: 'Essential',
  },
  {
    type: 'LETTER',
    title: 'Wax-Sealed Personal Letter',
    category: 'Narrative',
    description: 'An authentic handwritten letter with parchment textures and wax seal.',
    icon: Mail,
  },
  {
    type: 'MEMORY_MAP',
    title: 'Interactive Memory Map',
    category: 'Interactive',
    description: 'Plot milestone coordinates, stories, dates, and photos on a shared landscape.',
    icon: MapPin,
  },
  {
    type: 'UNIVERSE',
    title: 'Interactive Universe',
    category: 'Interactive',
    description: 'Explore a celestial constellation of orbiting stars, planets, and memories.',
    icon: Compass,
    badge: 'Popular',
  },
  {
    type: 'GIFT',
    title: 'Virtual Gift Box',
    category: 'Interactive',
    description: 'An unwrapable digital box revealing a voucher, promise, or photo prize.',
    icon: Gift,
  },
  {
    type: 'PUZZLE',
    title: 'Memory Puzzle Challenge',
    category: 'Interactive',
    description: 'Tile-swapping photo puzzle that rewards the recipient upon completion.',
    icon: Puzzle,
  },
  {
    type: 'MINI_GAME',
    title: 'Mini-Game Center',
    category: 'Playful',
    description: 'Balloon pop, memory match cards, trivia quiz, or heart catching games.',
    icon: Gamepad2,
    badge: 'Gamified',
  },
  {
    type: 'INSIDE_JOKES',
    title: 'Inside-Joke Archive',
    category: 'Playful',
    description: 'Hidden punchline accordions for moments only you and they will ever understand.',
    icon: Smile,
  },
  {
    type: 'THINGS_NEVER_SAID',
    title: "Things Never Said Out Loud",
    category: 'Playful',
    description: 'Quiet confessions and unspoken truths revealed one card at a time.',
    icon: Sparkles,
  },
  {
    type: 'SECRET',
    title: 'Secret Vault & Clues',
    category: 'Playful',
    description: 'A password-locked or Teddy-tap vault protecting a grand secret.',
    icon: Lock,
  },
  {
    type: 'MUSIC',
    title: 'Soundtrack & Ambient Track',
    category: 'Multimedia',
    description: 'Gentle acoustic, piano, or lofi sound loop to accompany the experience.',
    icon: Music,
  },
  {
    type: 'VOICE',
    title: 'Heartfelt Voice Note',
    category: 'Multimedia',
    description: 'Playable audio greeting with animated waveform and transcription.',
    icon: Mic,
  },
  {
    type: 'VIDEO',
    title: 'Video Reel Montage',
    category: 'Multimedia',
    description: 'Embedded video greeting or memories montage player.',
    icon: Video,
  },
  {
    type: 'PEOPLE',
    title: 'People Who Love You',
    category: 'Community',
    description: 'Wall of wishes submitted by friends and family via contributor links.',
    icon: Users,
    badge: 'Collaborative',
  },
  {
    type: 'STORY',
    title: 'Our Story Timeline',
    category: 'Narrative',
    description: 'A chapter-by-chapter timeline highlighting memorable life seasons.',
    icon: Clock,
  },
  {
    type: 'FUTURE_WISHES',
    title: 'Future Bucket List',
    category: 'Community',
    description: 'Promises, future trips, and goals you want to conquer together.',
    icon: Heart,
  },
  {
    type: 'FINAL_REVEAL',
    title: 'The Grand Climax & 100%',
    category: 'Narrative',
    description: 'The final emotional closing, photo gallery, Teddy blessing, and replay.',
    icon: Sparkles,
    badge: 'Essential',
  },
];

export const ModuleLibraryModal: React.FC<ModuleLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddModule,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const categories = ['ALL', 'Narrative', 'Interactive', 'Playful', 'Multimedia', 'Community'];

  const filtered = selectedCategory === 'ALL'
    ? MODULE_CATALOG
    : MODULE_CATALOG.filter((m) => m.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl rounded-3xl bg-[#fffdfa] border border-amber-200 shadow-2xl p-6 sm:p-7 relative max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h3 className="font-playfair font-bold text-xl text-stone-900">Add an Experience Module</h3>
            <p className="text-xs text-stone-500">Pick from 18 specialized modules to weave your story</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 py-3 overflow-x-auto text-xs no-scrollbar border-b border-stone-100">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-800 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        <div className="mt-4 flex-1 overflow-y-auto grid sm:grid-cols-2 gap-3 pr-1">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.type}
                className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-amber-400 transition flex flex-col justify-between group shadow-2xs hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 uppercase">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-stone-800 group-hover:text-amber-900 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end">
                  <button
                    onClick={() => {
                      onAddModule(item.type);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-700 hover:text-white transition text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Journey</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

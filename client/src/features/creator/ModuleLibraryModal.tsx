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
  Puzzle,
  Plus,
  CheckCircle2,
  Filter,
  Layers,
} from 'lucide-react';
import { ModuleType } from '../../types';

interface ModuleLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddModule: (type: ModuleType) => void;
  existingModuleTypes?: ModuleType[];
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
    title: 'Personal Soundtrack & Song',
    category: 'Multimedia',
    description: 'Upload a custom soundtrack or select an ambient melody that plays in the background throughout the journey.',
    icon: Music,
    badge: 'Ambient Audio',
  },
  {
    type: 'VOICE',
    title: 'Live Voice Recording',
    category: 'Multimedia',
    description: 'Record your voice live in the browser and send it directly to the recipient as a personal audio message.',
    icon: Mic,
    badge: 'Live',
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
  existingModuleTypes = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewFilter, setViewFilter] = useState<'UNADDED' | 'ALL'>('UNADDED');

  if (!isOpen) return null;

  const categories = ['ALL', 'Narrative', 'Interactive', 'Playful', 'Multimedia', 'Community'];

  const existingSet = new Set(existingModuleTypes);
  const unaddedCount = MODULE_CATALOG.filter((m) => !existingSet.has(m.type)).length;

  const filtered = MODULE_CATALOG.filter((m) => {
    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
    const matchesView = viewFilter === 'ALL' || !existingSet.has(m.type);
    return matchesCategory && matchesView;
  });

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
            <div className="flex items-center gap-2">
              <h3 className="font-playfair font-bold text-xl text-stone-900">Add an Experience Module</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                {unaddedCount} Available to Add
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Choose from unused features to expand your birthday experience timeline
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Toggle: Remaining Features vs All Features */}
        <div className="pt-3 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-100">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setViewFilter('UNADDED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewFilter === 'UNADDED'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Remaining Features ({unaddedCount})</span>
            </button>
            <button
              onClick={() => setViewFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewFilter === 'ALL'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-stone-500" />
              <span>All Catalog ({MODULE_CATALOG.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-stone-500 font-medium">
            Timeline currently has <strong>{existingModuleTypes.length}</strong> active features
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto text-xs no-scrollbar border-b border-stone-100">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
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
        <div className="mt-3 flex-1 overflow-y-auto grid sm:grid-cols-2 gap-3 pr-1">
          {filtered.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-stone-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-700">You've added all features in this category!</p>
              <p className="text-xs text-stone-500 mt-1">Switch to "All Catalog" to add extra instances of existing modules.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              const alreadyAdded = existingSet.has(item.type);

              return (
                <div
                  key={item.type}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between group shadow-2xs hover:shadow-xs ${
                    alreadyAdded
                      ? 'border-stone-200 bg-stone-50/70'
                      : 'border-amber-200/80 bg-white hover:border-amber-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {alreadyAdded && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>In Timeline</span>
                          </span>
                        )}
                        {item.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 uppercase">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <h4 className="font-bold text-sm text-stone-800 group-hover:text-amber-900 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                      {item.category}
                    </span>

                    <button
                      onClick={() => {
                        onAddModule(item.type);
                        onClose();
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition text-xs font-semibold cursor-pointer ${
                        alreadyAdded
                          ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          : 'bg-amber-700 text-white hover:bg-amber-800 shadow-xs'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{alreadyAdded ? 'Add Another' : 'Add to Journey'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};

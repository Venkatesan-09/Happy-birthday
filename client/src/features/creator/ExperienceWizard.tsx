import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, ArrowRight, ArrowLeft, Check,
  User, Calendar, Star, Zap, BookOpen, Film,
  Gift
} from 'lucide-react';
import { RelationshipType } from '../../types';
import { DEFAULT_THEMES, TEMPLATE_PRESETS, createDefaultModule } from '../../data/defaults';
import { api } from '../../services/api';

interface ExperienceWizardProps {
  onCancel: () => void;
  onCreated: (experienceId: string) => void;
}

const RELATIONSHIP_OPTIONS: { label: RelationshipType; emoji: string }[] = [
  { label: 'Best Friend', emoji: '🤝' },
  { label: 'Partner',     emoji: '💑' },
  { label: 'Mother',      emoji: '👩' },
  { label: 'Father',      emoji: '👨' },
  { label: 'Parent',      emoji: '👪' },
  { label: 'Sibling',     emoji: '👫' },
  { label: 'Friend',      emoji: '😊' },
  { label: 'Cousin',      emoji: '🧑' },
  { label: 'Mentor',      emoji: '🎓' },
  { label: 'Colleague',   emoji: '💼' },
  { label: 'Other',       emoji: '✨' },
];

const PRESET_ICONS: Record<string, React.ReactNode> = {
  cinematic_story:    <Film className="w-5 h-5" />,
  playful_bestie:     <Zap className="w-5 h-5" />,
  scrapbook_nostalgia:<BookOpen className="w-5 h-5" />,
  celestial_universe: <Star className="w-5 h-5" />,
};

const MODULE_LABELS: Record<string, string> = {
  CINEMATIC_OPENING: '🎬 Cinematic Opening',
  BIRTHDAY_REVEAL:   '🎂 Birthday Reveal',
  LETTER:            '✉️ Personal Letter',
  MEMORY_MAP:        '🗺️ Memory Map',
  MUSIC:             '🎵 Soundtrack',
  UNIVERSE:          '🌌 Interactive Universe',
  FINAL_REVEAL:      '✨ Grand Finale',
  INSIDE_JOKES:      '😂 Inside Jokes Vault',
  MINI_GAME:         '🎮 Mini-Game',
  SECRET:            '🔒 Secret Vault',
  GIFT:              '🎁 Virtual Gift',
  PEOPLE:            '💕 People Who Love You',
  VOICE:             '🎙️ Voice Note',
  THINGS_NEVER_SAID: '💬 Things Never Said',
  STORY:             '📖 Story Timeline',
  FUTURE_WISHES:     '🌠 Future Wishes',
  VIDEO:             '🎥 Video Reel',
  PUZZLE:            '🧩 Puzzle Reveal',
};

export const ExperienceWizard: React.FC<ExperienceWizardProps> = ({ onCancel, onCreated }) => {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('Best Friend');
  const [birthday, setBirthday] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPreset, setSelectedPreset] = useState<string>('cinematic_story');
  const [selectedThemeKey, setSelectedThemeKey] = useState<string>('dreamy_dusk');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const goNext = () => {
    if (step === 1 && !name.trim()) return;
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const preset = TEMPLATE_PRESETS.find((p) => p.id === selectedPreset) || TEMPLATE_PRESETS[0];
      const theme  = DEFAULT_THEMES[selectedThemeKey] || DEFAULT_THEMES.warm_scrapbook;
      const initialModules = preset.modules.map((type, idx) => createDefaultModule(type, idx, name));
      const exp = await api.experiences.create({
        recipient: { name: name.trim(), nickname: nickname.trim() || undefined, relationship, birthday },
        theme,
        modules: initialModules,
      });
      onCreated(exp._id);
    } catch (err) {
      console.error(err);
      alert('Failed to create experience. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = ['About Them', 'Story Preset', 'Visual Theme'];
  const stepIcons  = [<User className="w-3.5 h-3.5" />, <Star className="w-3.5 h-3.5" />, <Sparkles className="w-3.5 h-3.5" />];

  const variants = {
    enter:  (d: number) => ({ opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d * -40 }),
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{
        background: 'radial-gradient(ellipse at 20% 50%, #fef9ee 0%, #fff5f7 40%, #f0f4ff 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div className="fixed top-16 left-16 w-64 h-64 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }} />
      <div className="fixed bottom-24 right-20 w-80 h-80 rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #ec4899, transparent 70%)' }} />

      <div className="w-full max-w-xl relative z-10">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl overflow-hidden shadow-2xl border border-white/60"
          style={{ background: 'rgba(255,253,250,0.92)', backdropFilter: 'blur(20px)' }}
        >
          {/* Gradient Header Bar */}
          <div className="relative px-7 pt-7 pb-5 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #ede9fe 100%)' }}
          >
            {/* Floating sparkles */}
            {['✨','🎂','🎈','🎉'].map((e, i) => (
              <motion.span key={i} className="absolute text-lg select-none pointer-events-none"
                style={{ top: `${10 + i * 14}%`, left: `${72 + i * 7}%`, opacity: 0.5 }}
                animate={{ y: [0, -6, 0], rotate: [0, 8, -8, 0] }}
                transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.6 }}
              >{e}</motion.span>
            ))}

            {/* Step Progress */}
            <div className="flex items-center gap-0 mb-5">
              {stepLabels.map((label, i) => {
                const s = i + 1;
                const done    = step > s;
                const current = step === s;
                return (
                  <React.Fragment key={s}>
                    <div className="flex flex-col items-center gap-1">
                      <motion.div
                        animate={{
                          backgroundColor: done ? '#059669' : current ? '#b45309' : '#d6d3d1',
                          scale: current ? 1.15 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm"
                      >
                        {done ? <Check className="w-3.5 h-3.5" /> : stepIcons[i]}
                      </motion.div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${current ? 'text-amber-800' : 'text-stone-400'}`}>
                        {label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div className="flex-1 mx-1.5 mb-4">
                        <div className="h-0.5 bg-stone-200 rounded-full overflow-hidden">
                          <motion.div
                            animate={{ width: step > s ? '100%' : '0%' }}
                            transition={{ duration: 0.4 }}
                            className="h-full bg-emerald-500 rounded-full"
                          />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
              <button
                onClick={onCancel}
                className="ml-auto text-[11px] font-semibold text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                ✕ Cancel
              </button>
            </div>
          </div>

          {/* Step Content */}
          <div className="px-7 pb-7 pt-5 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              {/* ─── STEP 1 ─── */}
              {step === 1 && (
                <motion.div key="step1" custom={direction}
                  variants={variants} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Step 1</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-stone-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Who is this birthday<br />moment for?
                    </h2>
                    <p className="text-sm text-stone-500 mt-1.5">
                      Tell us about the person whose story we're celebrating.
                    </p>
                  </div>

                  {/* Name */}
                  <div className="relative">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 block mb-1.5">
                      Their Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                      <input
                        type="text"
                        placeholder="e.g. Sam, Maya, Alex…"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-stone-200 text-sm bg-white text-stone-800 transition focus:outline-none focus:border-amber-400 focus:shadow-[0_0_0_4px_rgba(251,191,36,0.12)]"
                        required
                      />
                    </div>
                  </div>

                  {/* Nickname + Birthday */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 block mb-1.5">
                        Nickname <span className="text-stone-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sammy"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 text-sm bg-white text-stone-800 transition focus:outline-none focus:border-amber-400 focus:shadow-[0_0_0_4px_rgba(251,191,36,0.12)]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 block mb-1.5">
                        Birthday Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                        <input
                          type="date"
                          value={birthday}
                          onChange={(e) => setBirthday(e.target.value)}
                          className="w-full pl-10 pr-3 py-3 rounded-2xl border-2 border-stone-200 text-sm bg-white text-stone-800 transition focus:outline-none focus:border-amber-400 focus:shadow-[0_0_0_4px_rgba(251,191,36,0.12)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Relationship Chips */}
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 block mb-2">
                      Your Relationship to Them
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {RELATIONSHIP_OPTIONS.map(({ label, emoji }) => {
                        const active = relationship === label;
                        return (
                          <motion.button
                            key={label}
                            type="button"
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setRelationship(label)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border-2 transition cursor-pointer ${
                              active
                                ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm'
                                : 'border-stone-200 bg-white text-stone-600 hover:border-amber-300 hover:bg-amber-50/50'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span>{label}</span>
                            {active && <Check className="w-3 h-3 text-amber-600" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={goNext}
                      disabled={!name.trim()}
                      className="px-6 py-3 rounded-full font-semibold text-sm text-white flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                      style={{
                        background: name.trim()
                          ? 'linear-gradient(135deg, #d97706, #b45309)'
                          : '#d6d3d1',
                      }}
                    >
                      <span>Choose Story Preset</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ─── STEP 2 ─── */}
              {step === 2 && (
                <motion.div key="step2" custom={direction}
                  variants={variants} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Step 2</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-stone-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Choose a Narrative<br />Preset
                    </h2>
                    <p className="text-sm text-stone-500 mt-1.5">
                      Customize, reorder, or add any module later in the Studio.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {TEMPLATE_PRESETS.map((preset) => {
                      const isSelected = selectedPreset === preset.id;
                      return (
                        <motion.div
                          key={preset.id}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedPreset(preset.id);
                            // Auto-apply this preset's recommended theme
                            if (preset.theme && DEFAULT_THEMES[preset.theme]) {
                              setSelectedThemeKey(preset.theme);
                            }
                          }}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
                            isSelected
                              ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md'
                              : 'border-stone-200 bg-white hover:border-amber-300 hover:shadow-sm'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="preset-selected"
                              className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                          <div>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${
                              isSelected ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-500'
                            }`}>
                              {PRESET_ICONS[preset.id] || <Gift className="w-5 h-5" />}
                            </div>
                            <h4 className="font-bold text-sm text-stone-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                              {preset.name}
                            </h4>
                            <p className="text-[11px] font-semibold text-amber-700 mt-0.5">{preset.tagline}</p>
                            <p className="text-[11px] text-stone-500 leading-relaxed mt-1">{preset.description}</p>
                            {/* Module preview list */}
                            {isSelected && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-2 space-y-0.5"
                              >
                                {preset.modules.map((m, i) => (
                                  <div key={i} className="text-[10px] text-stone-600 flex items-center gap-1">
                                    <span className="text-amber-500">›</span>
                                    {MODULE_LABELS[m] || m}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </div>
                          <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                              {preset.modules.length} modules
                            </span>
                            {DEFAULT_THEMES[preset.theme] && (
                              <span
                                className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                                style={{ background: DEFAULT_THEMES[preset.theme].primaryColor }}
                              >
                                {DEFAULT_THEMES[preset.theme].name.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button onClick={goBack}
                      className="px-4 py-2 text-stone-500 hover:text-stone-800 text-sm font-semibold flex items-center gap-1 cursor-pointer transition">
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={goNext}
                      className="px-6 py-3 rounded-full font-semibold text-sm text-white flex items-center gap-2 shadow-lg cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}
                    >
                      <span>Select Visual Theme</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ─── STEP 3 ─── */}
              {step === 3 && (
                <motion.div key="step3" custom={direction}
                  variants={variants} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Step 3</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-stone-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Set the Atmosphere
                    </h2>
                    <p className="text-sm text-stone-500 mt-1.5">
                      Select the visual color palette and typography aesthetic.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {Object.entries(DEFAULT_THEMES).map(([key, theme]) => {
                      const isSelected = selectedThemeKey === key;
                      return (
                        <motion.div
                          key={key}
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedThemeKey(key)}
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                            isSelected
                              ? 'border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm'
                              : 'border-stone-200 bg-white hover:border-amber-200'
                          }`}
                        >
                          {/* Color swatch */}
                          <div className="relative flex-shrink-0">
                            <div
                              className="w-12 h-12 rounded-xl shadow-sm flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                              style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor || theme.primaryColor}cc)` }}
                            >
                              Aa
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-stone-900">{theme.name}</h4>
                            <p className="text-[11px] text-stone-500 capitalize">
                              Font: <span className="font-semibold">{theme.font}</span> · Vibe: <span className="font-semibold">{theme.animation}</span>
                            </p>
                          </div>
                          <motion.div
                            animate={{ scale: isSelected ? 1 : 0.5, opacity: isSelected ? 1 : 0 }}
                            className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0"
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button onClick={goBack}
                      className="px-4 py-2 text-stone-500 hover:text-stone-800 text-sm font-semibold flex items-center gap-1 cursor-pointer transition">
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={handleCreate}
                      disabled={isSubmitting}
                      className="px-7 py-3 rounded-full font-semibold text-sm text-white flex items-center gap-2 shadow-xl cursor-pointer disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #ec4899, #b45309)' }}
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>Weaving Experience…</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Launch in Studio</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Bottom hint */}
        <p className="text-center text-[11px] text-stone-400 mt-4">
          🔒 Your data stays private until you share it
        </p>
      </div>
    </div>
  );
};

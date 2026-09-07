import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft, Heart, Check, Palette, User, Calendar, BookOpen } from 'lucide-react';
import { RelationshipType, ThemeConfig } from '../../types';
import { DEFAULT_THEMES, TEMPLATE_PRESETS, createDefaultModule } from '../../data/defaults';
import { api } from '../../services/api';
import { TeddyMascot } from '../../components/TeddyMascot';

interface ExperienceWizardProps {
  onCancel: () => void;
  onCreated: (experienceId: string) => void;
}

export const ExperienceWizard: React.FC<ExperienceWizardProps> = ({
  onCancel,
  onCreated,
}) => {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('Best Friend');
  const [birthday, setBirthday] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPreset, setSelectedPreset] = useState<string>('cinematic_story');
  const [selectedThemeKey, setSelectedThemeKey] = useState<string>('warm_scrapbook');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const relationships: RelationshipType[] = [
    'Best Friend',
    'Partner',
    'Parent',
    'Mother',
    'Father',
    'Sibling',
    'Friend',
    'Cousin',
    'Mentor',
    'Colleague',
    'Other',
  ];

  const handleNext = () => {
    if (step === 1 && !name.trim()) return;
    setStep((s) => s + 1);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const preset = TEMPLATE_PRESETS.find((p) => p.id === selectedPreset) || TEMPLATE_PRESETS[0];
      const theme = DEFAULT_THEMES[selectedThemeKey] || DEFAULT_THEMES.warm_scrapbook;

      // Construct initial modules from preset
      const initialModules = preset.modules.map((type, idx) => createDefaultModule(type, idx, name));

      const exp = await api.experiences.create({
        recipient: {
          name: name.trim(),
          nickname: nickname.trim() || undefined,
          relationship,
          birthday,
        },
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

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl rounded-3xl bg-[#fffdfa] border border-amber-200 shadow-xl p-6 sm:p-10 relative">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s
                    ? 'bg-amber-700 text-white shadow-xs'
                    : step > s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-100 text-stone-400'
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* STEP 1: Recipient Information */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-left">
              <TeddyMascot pose="waving" size="sm" />
              <h2 className="text-2xl sm:text-3xl font-bold font-playfair text-stone-900 mt-2">
                Who is this birthday moment for?
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                Tell us about the person whose story we are celebrating.
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                  Their Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sam, Maya, Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3 rounded-xl border border-stone-300 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                    Nickname (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sammy"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 rounded-xl border border-stone-300 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                    Birthday Date
                  </label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full mt-1.5 px-4 py-3 rounded-xl border border-stone-300 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                  Your Relationship to Them
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value as RelationshipType)}
                  className="w-full mt-1.5 px-4 py-3 rounded-xl border border-stone-300 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {relationships.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleNext}
                disabled={!name.trim()}
                className="px-6 py-3 rounded-full bg-amber-700 text-white font-semibold text-sm hover:bg-amber-800 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <span>Choose Archetype & Preset</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Choose Template Preset */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-left">
              <h2 className="text-2xl sm:text-3xl font-bold font-playfair text-stone-900">
                Choose a Narrative Preset
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                You can customize, reorder, or add any module later in the Studio.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-left">
              {TEMPLATE_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/70 shadow-xs'
                        : 'border-stone-200 bg-white hover:border-amber-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-sm text-stone-900 font-playfair">{preset.name}</h4>
                        {isSelected && <Check className="w-4 h-4 text-amber-700" />}
                      </div>
                      <p className="text-xs font-semibold text-amber-800 mb-1">{preset.tagline}</p>
                      <p className="text-[11px] text-stone-600 leading-relaxed">{preset.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-100 text-[10px] text-stone-400">
                      {preset.modules.length} modules included
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 text-sm font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-full bg-amber-700 text-white font-semibold text-sm hover:bg-amber-800 transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Select Visual Theme</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Choose Visual Theme */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-left">
              <h2 className="text-2xl sm:text-3xl font-bold font-playfair text-stone-900">
                Set the Atmosphere
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                Select the visual color palette and typography aesthetic.
              </p>
            </div>

            <div className="space-y-3 text-left">
              {Object.entries(DEFAULT_THEMES).map(([key, theme]) => {
                const isSelected = selectedThemeKey === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedThemeKey(key)}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/60 shadow-xs'
                        : 'border-stone-200 bg-white hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl shadow-xs border border-white flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        Aa
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-stone-900">{theme.name}</h4>
                        <p className="text-xs text-stone-500 capitalize">Font: {theme.font} • Vibe: {theme.animation}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-amber-700" />}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 text-sm font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="px-7 py-3 rounded-full bg-amber-700 text-white font-semibold text-sm hover:bg-amber-800 transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Weaving Experience...' : 'Launch in Studio'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

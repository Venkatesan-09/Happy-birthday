import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Lock, Sparkles, Heart, CheckCircle2, MessageCircle, Send } from 'lucide-react';
import { Experience } from '../../types';
import { api } from '../../services/api';
import { SoundEffects } from '../../utils/audioEngine';
import { TeddyMascot } from '../../components/TeddyMascot';
import { ExperienceRenderer } from './ExperienceRenderer';

interface PublicRecipientViewProps {
  slug: string;
  onExit?: () => void;
}

export const PublicRecipientView: React.FC<PublicRecipientViewProps> = ({
  slug,
  onExit,
}) => {
  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordNeeded, setPasswordNeeded] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [discoveredSecrets, setDiscoveredSecrets] = useState<string[]>([]);
  const [thankYouSent, setThankYouSent] = useState(false);
  const [thankYouNote, setThankYouNote] = useState('');

  const loadPublicExperience = async (pwd?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.recipient.getBySlug(slug, pwd);
      setExperience(data);
      setPasswordNeeded(false);
      // Track view
      api.recipient.trackInteraction(data._id, 'VIEW');
    } catch (err: any) {
      if (err.message && err.message.includes('Password')) {
        setPasswordNeeded(true);
      } else {
        setError('This birthday experience could not be found or has not been published yet.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublicExperience();
  }, [slug]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    try {
      await loadPublicExperience(passwordInput.trim());
    } catch (err) {
      setPasswordError('Incorrect password. Try again!');
    }
  };

  const handleTrackProgress = (moduleId: string, type: string) => {
    if (!completedModules.includes(moduleId)) {
      setCompletedModules((prev) => [...prev, moduleId]);
    }
    if (type === 'SECRET' || type === 'UNIVERSE_OBJECT') {
      if (!discoveredSecrets.includes(moduleId)) {
        setDiscoveredSecrets((prev) => [...prev, moduleId]);
      }
    }
    if (experience) {
      api.recipient.trackInteraction(experience._id, 'MODULE_COMPLETED', { moduleId, type });
    }
  };

  const handleSendThankYou = () => {
    if (!thankYouNote.trim()) return;
    setThankYouSent(true);
    SoundEffects.playSparkle();
    confetti({ particleCount: 50, spread: 60 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-center">
        <TeddyMascot pose="sleeping" size="lg" message="Waking up your birthday universe..." />
        <p className="text-sm text-stone-500 mt-4 font-playfair">Preparing something extraordinary...</p>
      </div>
    );
  }

  if (passwordNeeded) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-amber-200 shadow-xl text-center space-y-5">
          <TeddyMascot pose="whispering" size="md" message="Shh... this journey is protected!" />
          <div>
            <h3 className="font-playfair font-bold text-2xl text-stone-900">Protected Birthday Moment</h3>
            <p className="text-xs text-stone-500 mt-1">Please enter the secret password provided by the creator.</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            {passwordError && <p className="text-xs text-rose-600">{passwordError}</p>}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-700 text-white font-semibold text-sm hover:bg-amber-800 transition cursor-pointer"
            >
              Unlock My Birthday Experience
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <TeddyMascot pose="sleeping" size="md" />
        <h3 className="font-playfair font-bold text-2xl text-stone-900">Moment Not Found</h3>
        <p className="text-sm text-stone-600 max-w-sm">{error || 'Experience not available'}</p>
        {onExit && (
          <button
            onClick={onExit}
            className="px-5 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold cursor-pointer"
          >
            Go to Studio Home
          </button>
        )}
      </div>
    );
  }

  const totalModules = experience.modules?.length || 1;
  const progressPercent = Math.min(100, Math.round((completedModules.length / totalModules) * 100));

  return (
    <div className="relative">
      {/* Sticky Journey Progress Floating Bar */}
      <div className="fixed top-3 left-3 sm:top-4 sm:left-4 z-40 bg-white/90 backdrop-blur-md px-3 sm:px-3.5 py-1.5 rounded-full border border-amber-200/80 shadow-md flex items-center gap-2 text-[11px] sm:text-xs text-stone-700 max-w-[calc(100vw-120px)] sm:max-w-none truncate">
        <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        <span className="font-medium truncate">
          {experience.recipient?.name}: {progressPercent}%
        </span>
        <div className="w-12 sm:w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden flex-shrink-0">
          <div
            className="h-full bg-amber-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Experience Renderer */}
      <ExperienceRenderer
        experience={experience}
        onTrackProgress={handleTrackProgress}
        discoveredSecrets={discoveredSecrets}
        completedModules={completedModules}
      />

      {/* Bottom Floating Thank You Drawer / Card */}
      <div className="max-w-xl mx-auto px-4 pb-12 text-center">
        <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-amber-200 shadow-md space-y-3">
          <TeddyMascot pose="celebrating" size="sm" />
          <h4 className="font-playfair font-bold text-lg text-stone-900">
            Did this touch your heart?
          </h4>

          {!thankYouSent ? (
            <div className="space-y-2">
              <p className="text-xs text-stone-500">Leave a quick reaction or message for the creator:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="I loved the universe and memories! Thank you so much..."
                  value={thankYouNote}
                  onChange={(e) => setThankYouNote(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={handleSendThankYou}
                  className="px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 py-2 rounded-xl border border-emerald-200">
              💌 Your love has been sent to the creator!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

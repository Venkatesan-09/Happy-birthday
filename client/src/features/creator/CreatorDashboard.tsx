import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Sparkles, Share2, Edit3, Trash2, Copy, Calendar, Heart, ExternalLink, Search, User } from 'lucide-react';
import { Experience } from '../../types';
import { api } from '../../services/api';
import { TeddyMascot } from '../../components/TeddyMascot';
import { ShareModal } from './ShareModal';

interface CreatorDashboardProps {
  onCreateNew: () => void;
  onOpenExperience: (id: string) => void;
  onOpenProfile?: () => void;
  onLogout?: () => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  onCreateNew,
  onOpenExperience,
  onOpenProfile,
  onLogout,
}) => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sharingExp, setSharingExp] = useState<Experience | null>(null);

  const fetchExperiences = async () => {
    try {
      const data = await api.experiences.list();
      setExperiences(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}’s experience?`)) return;
    try {
      await api.experiences.delete(id);
      fetchExperiences();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.experiences.duplicate(id);
      fetchExperiences();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = experiences.filter((exp) =>
    (exp.recipient?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (exp.recipient?.relationship || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Top Banner & Mascot Greeting */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#fffdfa] via-amber-50 to-[#faf5ee] border border-amber-200/80 shadow-xs mb-10">
        <div className="flex items-center gap-5 text-left">
          <TeddyMascot pose="waving" size="lg" message="Ready to make someone smile today?" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
              Creator Studio
            </span>
            <h1 className="text-2xl sm:text-4xl font-bold font-playfair text-stone-900 mt-1">
              DearYou Experiences
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-md">
              Not another plain card. Create immersive, interactive birthday journeys filled with memories, games, and secrets.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={onCreateNew}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-700 text-white font-semibold text-sm hover:bg-amber-800 transition shadow-md flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Experience</span>
          </button>
          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="w-full sm:w-auto px-4 py-3.5 rounded-2xl border border-stone-200 bg-white text-stone-700 font-semibold text-sm hover:bg-stone-50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4 text-amber-700" />
              <span>Profile</span>
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full sm:w-auto px-4 py-3.5 rounded-2xl border border-stone-300 text-stone-600 font-semibold text-sm hover:bg-stone-100 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by recipient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <span className="text-xs text-stone-500 font-medium">
          {filtered.length} {filtered.length === 1 ? 'experience' : 'experiences'}
        </span>
      </div>

      {/* Experience Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm text-stone-400">Loading experiences...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-stone-200 space-y-4">
          <TeddyMascot pose="sleeping" size="md" message="No journeys found yet!" />
          <h3 className="font-playfair font-bold text-lg text-stone-800">Start Your First Birthday Journey</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Design an interactive experience for your best friend, partner, parent, or colleague.
          </p>
          <div>
            <button
              onClick={onCreateNew}
              className="px-5 py-2.5 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 cursor-pointer"
            >
              Start Creating Now
            </button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((exp) => (
            <motion.div
              key={exp._id}
              whileHover={{ y: -3 }}
              className="rounded-3xl border border-stone-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between text-left"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      exp.status === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {exp.status}
                  </span>
                  <span className="text-[11px] text-stone-400 font-medium">
                    {exp.modules?.length || 0} modules
                  </span>
                </div>

                <h3 className="font-playfair font-bold text-xl text-stone-900 line-clamp-1">
                  {exp.recipient?.name || 'Untitled Journey'}
                </h3>
                <p className="text-xs text-amber-800 font-medium mt-0.5">
                  {exp.recipient?.relationship || 'Friend'} {exp.recipient?.nickname ? `• "${exp.recipient.nickname}"` : ''}
                </p>

                {exp.recipient?.birthday && (
                  <p className="text-[11px] text-stone-500 mt-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Birthday: {exp.recipient.birthday}</span>
                  </p>
                )}

                {/* Theme Tag */}
                <div className="mt-4 flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-stone-300"
                    style={{ backgroundColor: exp.theme?.primaryColor || '#b45309' }}
                  />
                  <span className="text-[11px] text-stone-500 font-medium">
                    {exp.theme?.name || 'Warm Scrapbook'}
                  </span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="px-6 py-3.5 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenExperience(exp._id)}
                    className="px-3 py-1.5 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Studio</span>
                  </button>
                  <button
                    onClick={() => setSharingExp(exp)}
                    className="p-1.5 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-200 cursor-pointer transition"
                    title="Share & QR Code"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(exp._id)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                    title="Duplicate Journey"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(exp._id, exp.recipient?.name || 'this')}
                    className="p-1.5 text-stone-400 hover:text-rose-600 cursor-pointer"
                    title="Delete Journey"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Share Modal */}
      {sharingExp && (
        <ShareModal
          isOpen={!!sharingExp}
          onClose={() => setSharingExp(null)}
          experience={sharingExp}
          onUpdatePrivacy={async (priv) => {
            await api.experiences.update(sharingExp._id, { privacy: priv });
            fetchExperiences();
          }}
        />
      )}
    </div>
  );
};

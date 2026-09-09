import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, LogOut, Heart, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { User as UserType } from '../../types';

interface ProfileViewProps {
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.getMe()
      .then((data) => setUser(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 font-medium text-sm mb-6 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden"
      >
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 p-8 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-2xl font-bold font-playfair shadow-inner">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-playfair">
                  {user?.name || 'Creator Profile'}
                </h1>
                <p className="text-amber-100 text-xs sm:text-sm flex items-center gap-1.5 mt-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>DearYou Journey Creator</span>
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Active Account</span>
            </div>
          </div>
        </div>

        {/* Profile details */}
        <div className="p-6 sm:p-8 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-stone-400 text-sm">Loading profile...</div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-100/70 text-amber-800">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Full Name</span>
                    <p className="text-sm font-semibold text-stone-800 mt-0.5">{user?.name || '—'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-100/70 text-amber-800">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Email Address</span>
                    <p className="text-sm font-semibold text-stone-800 mt-0.5">{user?.email || '—'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-100/70 text-amber-800">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Member Since</span>
                    <p className="text-sm font-semibold text-stone-800 mt-0.5">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently joined'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-100/70 text-amber-800">
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Plan</span>
                    <p className="text-sm font-semibold text-stone-800 mt-0.5">DearYou Free Tier (Unlimited)</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200 transition cursor-pointer"
                >
                  Manage Experiences
                </button>

                <button
                  onClick={onLogout}
                  className="px-5 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

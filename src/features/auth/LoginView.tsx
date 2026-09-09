import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, User, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface LoginViewProps {
  initialMode?: 'login' | 'register';
  onAuthenticated: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ initialMode = 'login', onAuthenticated }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await api.auth.login(email.trim(), password);
      } else {
        if (name.trim().length < 2) {
          setError('Name must be at least 2 characters.');
          setLoading(false);
          return;
        }
        await api.auth.register(name.trim(), email.trim(), password);
      }
      onAuthenticated();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    navigate(newMode === 'login' ? '/login' : '/register');
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6f0] via-[#f7efe4] to-[#f0e4d0] flex items-center justify-center p-4">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="relative w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-700 shadow-lg mb-3 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/')}
          >
            <Heart className="w-7 h-7 text-white fill-white" />
          </motion.div>
          <h1 className="text-3xl font-bold font-playfair text-stone-900">DearYou</h1>
          <p className="text-xs text-stone-500 mt-1">Don't just wish them. Give them a moment they'll remember.</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-amber-100 p-7">
          {/* Mode toggle */}
          <div className="flex rounded-xl bg-stone-100 p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === m
                    ? 'bg-white text-amber-800 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={{ opacity: 0, x: mode === 'login' ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 12 : -12 }}
              transition={{ duration: 0.2 }}
            >
              {/* Name field (register only) */}
              {mode === 'register' && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Your full name"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder:text-stone-400"
                  />
                </div>
              )}

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder:text-stone-400"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder:text-stone-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">{error}</p>
                </motion.div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-amber-700 text-white font-bold text-sm hover:bg-amber-800 active:scale-95 transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                whileTap={{ scale: 0.97 }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {mode === 'login' ? 'Sign In' : 'Create My Account'}
                  </>
                )}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          {/* Switch mode */}
          <p className="mt-5 text-center text-xs text-stone-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-amber-700 font-semibold hover:underline cursor-pointer"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-[11px] text-stone-400 mt-5">
          By signing in you agree to create something beautiful ✨
        </p>
      </motion.div>
    </div>
  );
};

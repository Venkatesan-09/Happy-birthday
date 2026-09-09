import React, { useState, useRef, useEffect } from 'react';
import { Languages, Loader2, Check, ChevronDown } from 'lucide-react';
import { api } from '../services/api';

type SupportedLang = 'english' | 'tamil' | 'telugu';

interface Language {
  id: SupportedLang;
  label: string;
  native: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { id: 'english', label: 'English', native: 'English', flag: '🇬🇧' },
  { id: 'tamil', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { id: 'telugu', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
];

interface TranslateButtonProps {
  /** Current text value to translate */
  value: string;
  /** Called with the translated text */
  onTranslated: (translated: string) => void;
  /** Optional CSS class overrides for the trigger button */
  className?: string;
}

export const TranslateButton: React.FC<TranslateButtonProps> = ({
  value,
  onTranslated,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<SupportedLang>('tamil');
  const [isTranslating, setIsTranslating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleTranslate = async () => {
    if (!value.trim()) {
      setError('Please enter some text first.');
      return;
    }
    setError('');
    setIsTranslating(true);
    try {
      const res = await api.ai.translate(value.trim(), selectedLang);
      onTranslated(res.result);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 1200);
    } catch (err: any) {
      setError('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-flex ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((v) => !v);
          setError('');
          setSuccess(false);
        }}
        title="Translate with AI"
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
      >
        <Languages className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Translate</span>
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-2xl bg-white border border-violet-200 shadow-xl p-3 flex flex-col gap-2.5"
          style={{ minWidth: '200px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-1.5 border-b border-stone-100 pb-2">
            <Languages className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">AI Translate</span>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <label className="text-[10px] font-semibold text-stone-500 uppercase block mb-1">Target Language</label>
            <div className="relative">
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as SupportedLang)}
                className="w-full appearance-none px-2.5 py-2 rounded-xl border border-stone-200 text-xs bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-violet-400 pr-7 cursor-pointer"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.flag} {lang.label} — {lang.native}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-[10px] text-rose-600 font-medium">{error}</p>
          )}

          {/* Translate Button */}
          <button
            type="button"
            onClick={handleTranslate}
            disabled={isTranslating || success}
            className={`w-full py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              success
                ? 'bg-emerald-500'
                : 'bg-violet-600 hover:bg-violet-700 disabled:opacity-60'
            }`}
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Translating…</span>
              </>
            ) : success ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Translated!</span>
              </>
            ) : (
              <>
                <Languages className="w-3.5 h-3.5" />
                <span>Translate Text</span>
              </>
            )}
          </button>

          <p className="text-[9px] text-stone-400 text-center leading-relaxed">
            Powered by Gemini AI · Replaces current text
          </p>
        </div>
      )}
    </div>
  );
};

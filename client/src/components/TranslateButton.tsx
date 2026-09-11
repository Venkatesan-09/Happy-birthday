import React, { useState, useRef, useEffect } from 'react';
import { Languages, Loader2, Check, Sparkles, AlertCircle, Undo2 } from 'lucide-react';
import { api } from '../services/api';

export type SupportedLang = 'english' | 'tamil' | 'telugu';

export interface LanguageOption {
  id: SupportedLang;
  label: string;
  native: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
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
  const [activeLang, setActiveLang] = useState<SupportedLang | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [successLang, setSuccessLang] = useState<SupportedLang | null>(null);
  const [error, setError] = useState('');
  const [previousText, setPreviousText] = useState<string | null>(null);
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

  const handleTranslate = async (lang: SupportedLang) => {
    if (!value || !value.trim()) {
      setError('Please type some text in the field first.');
      return;
    }

    setError('');
    setActiveLang(lang);
    setIsTranslating(true);
    setSuccessLang(null);

    const originalToSave = value;

    try {
      const res = await api.ai.translate(value.trim(), lang);
      if (res && res.result && res.result.trim().length > 0) {
        // Save previous text so user can undo anytime
        setPreviousText(originalToSave);
        onTranslated(res.result);
        setSuccessLang(lang);
        setTimeout(() => {
          setSuccessLang(null);
          setIsOpen(false);
        }, 1500);
      } else {
        // NEVER destroy user content: retain previous text
        setError('Translation engine returned incomplete text. Your original text is safe.');
      }
    } catch (err: any) {
      console.error('[TranslateButton error]', err);
      setError(err?.message || 'Translation failed. Your text was not modified.');
    } finally {
      setIsTranslating(false);
      setActiveLang(null);
    }
  };

  const handleUndo = () => {
    if (previousText !== null) {
      onTranslated(previousText);
      setPreviousText(null);
      setError('');
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-flex items-center gap-1.5 ${className}`}>
      {/* Undo Button if translated */}
      {previousText && previousText !== value && (
        <button
          type="button"
          onClick={handleUndo}
          title="Undo translation (Restore original)"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium border border-stone-300 transition cursor-pointer"
        >
          <Undo2 className="w-3 h-3 text-stone-600" />
          <span className="hidden sm:inline">Undo</span>
        </button>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((v) => !v);
          setError('');
          setSuccessLang(null);
        }}
        title="Translate full message into Tamil, Telugu, or English"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs select-none ${
          isOpen
            ? 'bg-violet-600 text-white shadow-violet-500/20'
            : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200'
        }`}
      >
        <Languages className="w-3.5 h-3.5" />
        <span>Translate</span>
      </button>

      {/* Instant 1-Click Translation Popover */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl bg-white border border-violet-100 shadow-2xl p-3.5 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150"
          style={{ minWidth: '260px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div className="flex items-center gap-1.5 text-violet-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-800">
                Full-Length Translate
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">
              No Word Limit
            </span>
          </div>

          <p className="text-[11px] text-stone-500 leading-snug">
            Choose a language to translate this field immediately:
          </p>

          {/* Quick-Action Language Buttons */}
          <div className="flex flex-col gap-1.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isThisTranslating = isTranslating && activeLang === lang.id;
              const isThisSuccess = successLang === lang.id;

              return (
                <button
                  key={lang.id}
                  type="button"
                  disabled={isTranslating}
                  onClick={() => handleTranslate(lang.id)}
                  className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between text-xs font-semibold transition-all cursor-pointer border ${
                    isThisSuccess
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                      : isThisTranslating
                      ? 'bg-violet-50 border-violet-300 text-violet-800'
                      : 'bg-stone-50/70 hover:bg-violet-50/80 border-stone-200/80 hover:border-violet-200 text-stone-800 hover:text-violet-900'
                  } disabled:opacity-60`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs">{lang.label}</span>
                      <span className="text-[10px] text-stone-400 font-normal">{lang.native}</span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {isThisTranslating ? (
                      <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                    ) : isThisSuccess ? (
                      <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold">
                        <Check className="w-4 h-4" />
                        <span>Translated</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-violet-600 font-medium">
                        Translate →
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Undo action inside menu if available */}
          {previousText && previousText !== value && (
            <button
              type="button"
              onClick={handleUndo}
              className="w-full py-1.5 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5 text-stone-600" />
              <span>Restore original text</span>
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-1.5 text-rose-700 text-[11px] font-medium leading-tight">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-1 border-t border-stone-100 flex items-center justify-between text-[9px] text-stone-400">
            <span>Gemini 3.6 Flash AI Engine</span>
            <span>English • தமிழ் • తెలుగు</span>
          </div>
        </div>
      )}
    </div>
  );
};

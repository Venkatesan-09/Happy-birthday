import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, X, Copy, Check, Wand2, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { RelationshipType } from '../../types';
import { TeddyMascot } from '../../components/TeddyMascot';
import { TranslateButton } from '../../components/TranslateButton';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyContent: (content: string) => void;
  initialType?: 'LETTER' | 'WISH' | 'JOKE' | 'STORY' | 'FINAL_MESSAGE' | 'FUTURE_WISH' | 'SECRET_MESSAGE';
  recipientName: string;
  relationship: RelationshipType;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyContent,
  initialType = 'LETTER',
  recipientName,
  relationship,
}) => {
  const [type, setType] = useState(initialType);
  const [tone, setTone] = useState<'heartfelt' | 'playful' | 'nostalgic' | 'poetic' | 'funny' | 'uplifting'>('heartfelt');
  const [memories, setMemories] = useState('');
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedText('');
    try {
      const res = await api.ai.generate({
        type,
        relationship,
        recipientName: recipientName || 'Friend',
        tone,
        memories,
        context,
      });
      setGeneratedText(res.result);
    } catch (err: any) {
      console.error(err);
      setGeneratedText('Could not generate at the moment. Please try again or refine your prompt.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleApply = () => {
    onApplyContent(generatedText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl rounded-3xl bg-[#fffdfa] border border-amber-200 shadow-2xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-playfair font-bold text-lg text-stone-900">DearYou AI Message Craft</h3>
              <p className="text-xs text-stone-500">Gemini-powered personalized emotional resonance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Parameters */}
        <div className="mt-5 space-y-4 text-left">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700">Message Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="LETTER">Personal Letter</option>
                <option value="WISH">Warm Birthday Wish</option>
                <option value="JOKE">Playful Inside Joke</option>
                <option value="STORY">Timeline Story Milestone</option>
                <option value="SECRET_MESSAGE">Secret Confession</option>
                <option value="FUTURE_WISH">Future Bucket List</option>
                <option value="FINAL_MESSAGE">Grand Finale Benediction</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="heartfelt">Heartfelt & Tender</option>
                <option value="playful">Playful & Witty</option>
                <option value="nostalgic">Nostalgic & Reflective</option>
                <option value="poetic">Poetic & Deep</option>
                <option value="funny">Funny & Sarcastic</option>
                <option value="uplifting">Uplifting & Inspiring</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Specific Memories or Inside References</label>
              <TranslateButton value={memories} onTranslated={setMemories} />
            </div>
            <textarea
              rows={2}
              placeholder="e.g. The late-night road trip to the beach, eating diner waffles at 2 AM, how they helped me during college..."
              value={memories}
              onChange={(e) => setMemories(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-stone-400"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 rounded-2xl bg-amber-700 text-white font-semibold text-sm hover:bg-amber-800 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Crafting words with warmth...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Tailored Words for {recipientName}</span>
              </>
            )}
          </button>
        </div>

        {/* Results Area */}
        {generatedText && (
          <div className="mt-5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Crafted Draft</span>
              <button
                onClick={handleCopy}
                className="text-xs flex items-center gap-1 text-amber-800 hover:text-amber-950 font-medium cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-stone-800 whitespace-pre-line leading-relaxed font-jakarta">
              {generatedText}
            </p>

            <div className="mt-4 pt-3 border-t border-amber-200/60 flex justify-end gap-2">
              <button
                onClick={handleApply}
                className="px-4 py-2 rounded-xl bg-amber-800 text-white text-xs font-semibold hover:bg-amber-900 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to Module Content</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

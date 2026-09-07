import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import { X, Copy, Check, ExternalLink, QrCode, Lock, Globe, Share2 } from 'lucide-react';
import { Experience } from '../../types';
import { TeddyMascot } from '../../components/TeddyMascot';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience: Experience;
  onUpdatePrivacy?: (privacy: any) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  experience,
  onUpdatePrivacy,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [privacyType, setPrivacyType] = useState(experience.privacy?.type || 'PUBLIC');
  const [password, setPassword] = useState('');
  const [savedPrivacy, setSavedPrivacy] = useState(false);

  const fullUrl = `${window.location.origin}/birthday/${experience.slug}`;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(fullUrl, { width: 220, margin: 2, color: { dark: '#451a03', light: '#ffffff' } })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [isOpen, fullUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePrivacy = () => {
    if (onUpdatePrivacy) {
      onUpdatePrivacy({
        type: privacyType,
        passwordHash: privacyType === 'PASSWORD_PROTECTED' ? password : undefined,
      });
      setSavedPrivacy(true);
      setTimeout(() => setSavedPrivacy(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl bg-[#fffdfa] border border-amber-200 shadow-2xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto text-center"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <TeddyMascot pose="holding_gift" size="md" message="Ready to share with them!" />

        <h3 className="font-playfair font-bold text-2xl text-stone-900 mt-2">
          Share {experience.recipient?.name}’s Journey
        </h3>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          Send the secret link or let them scan this QR code on their birthday.
        </p>

        {/* QR Code */}
        {qrDataUrl && (
          <div className="my-5 inline-block p-3 bg-white rounded-2xl border border-stone-200 shadow-xs">
            <img src={qrDataUrl} alt="QR Code" className="w-44 h-44 mx-auto rounded-lg" />
          </div>
        )}

        {/* Link Bar */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-stone-300 bg-stone-50">
          <input
            type="text"
            readOnly
            value={fullUrl}
            className="flex-1 bg-transparent px-3 text-xs text-stone-700 font-mono focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-xl bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-amber-800 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Open Direct Button */}
        <div className="mt-3 flex justify-center">
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-950 underline"
          >
            <span>Open Recipient Experience in New Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Privacy Settings Accordion */}
        <div className="mt-6 pt-5 border-t border-stone-200 text-left">
          <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-2">
            Access & Privacy Protection
          </label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => setPrivacyType('PUBLIC')}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition ${
                privacyType === 'PUBLIC'
                  ? 'bg-amber-50 border-amber-500 text-amber-900 font-semibold'
                  : 'bg-white border-stone-200 text-stone-600'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Public Link</span>
            </button>
            <button
              onClick={() => setPrivacyType('PASSWORD_PROTECTED')}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition ${
                privacyType === 'PASSWORD_PROTECTED'
                  ? 'bg-amber-50 border-amber-500 text-amber-900 font-semibold'
                  : 'bg-white border-stone-200 text-stone-600'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Password Locked</span>
            </button>
          </div>

          {privacyType === 'PASSWORD_PROTECTED' && (
            <div className="space-y-2 mt-2">
              <input
                type="text"
                placeholder="Set secret password (e.g. teddy)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-stone-500 italic">Recipient will need to enter this password to enter.</p>
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <button
              onClick={handleSavePrivacy}
              className="px-3.5 py-1.5 rounded-xl bg-stone-800 text-white text-xs font-semibold hover:bg-stone-900 cursor-pointer"
            >
              {savedPrivacy ? 'Saved ✓' : 'Save Privacy Setting'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

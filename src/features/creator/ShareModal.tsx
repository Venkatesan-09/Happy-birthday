import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import { X, Copy, Check, ExternalLink, Globe, Lock, Smartphone, Laptop, Wifi, AlertCircle, Sparkles } from 'lucide-react';
import { Experience } from '../../types';
import { TeddyMascot } from '../../components/TeddyMascot';
import { api } from '../../services/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience: Experience;
  onUpdatePrivacy?: (privacy: any) => void;
  initialTab?: 'recipient' | 'dashboard';
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  experience,
  onUpdatePrivacy,
  initialTab = 'recipient',
}) => {
  const [activeShareTab, setActiveShareTab] = useState<'recipient' | 'dashboard'>(initialTab);
  const [copied, setCopied] = useState(false);
  const [copiedDashboard, setCopiedDashboard] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [privacyType, setPrivacyType] = useState(experience.privacy?.type || 'PUBLIC');
  const isProduction = typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  const [password, setPassword] = useState('');
  const [savedPrivacy, setSavedPrivacy] = useState(false);
  // Default link mode: if production or if public tunnel available, use public, else local/lan
  const [linkMode, setLinkMode] = useState<'lan' | 'public' | 'local'>('local');
  const [publicTunnelUrl, setPublicTunnelUrl] = useState<string>('');
  const [detectedLanIp, setDetectedLanIp] = useState<string>('');
  const [allLanIps, setAllLanIps] = useState<string[]>([]);
  const [customHost, setCustomHost] = useState<string>('');
  const [networkLoading, setNetworkLoading] = useState(true);

  // Automatically discover public tunnel & LAN / Wi-Fi IP from backend
  useEffect(() => {
    if (isOpen) {
      setNetworkLoading(true);
      api.system.getNetworkInfo()
        .then((res) => {
          if (res?.publicUrl) {
            setPublicTunnelUrl(res.publicUrl);
            setLinkMode('public');
          } else if (isProduction) {
            setLinkMode('public');
          } else if (res?.ip && res.ip !== '127.0.0.1') {
            setDetectedLanIp(res.ip);
            setLinkMode('lan');
          } else {
            setLinkMode('local');
          }
          if (res?.ip && res.ip !== '127.0.0.1') {
            setDetectedLanIp(res.ip);
          }
          if (res?.allIps?.length > 0) {
            setAllLanIps(res.allIps.filter((ip: string) => ip !== '127.0.0.1'));
          }
        })
        .catch(() => {})
        .finally(() => setNetworkLoading(false));
    }
  }, [isOpen, isProduction]);

  // Compute URL based on target mode (LAN IP, Public tunnel, or localhost)
  const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  const protocol = window.location.protocol.replace(':', '');

  let baseOrigin = window.location.origin;
  if (isProduction || linkMode === 'public') {
    baseOrigin = (linkMode === 'public' && publicTunnelUrl) ? publicTunnelUrl : window.location.origin;
  } else if (linkMode === 'lan') {
    const hostIp = customHost.trim() || detectedLanIp;
    if (hostIp) {
      baseOrigin = hostIp.startsWith('http') ? hostIp : `${protocol}://${hostIp}:${currentPort}`;
    } else {
      baseOrigin = window.location.origin;
    }
  } else {
    baseOrigin = window.location.origin;
  }

  const expSlug = (experience.slug || (experience as any)._id || (experience as any).id || '').trim();
  // /r/:slug is the standalone recipient-only page — zero auth, zero router, works on any device
  const fullUrl = `${baseOrigin}/r/${expSlug}`;
  const dashboardStudioUrl = `${baseOrigin}/experience/${experience._id}/edit`;
  const activeCopyUrl = activeShareTab === 'recipient' ? fullUrl : dashboardStudioUrl;

  useEffect(() => {
    setActiveShareTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (isOpen && activeCopyUrl) {
      QRCode.toDataURL(activeCopyUrl, { width: 240, margin: 2, color: { dark: '#451a03', light: '#ffffff' } })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [isOpen, activeCopyUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeCopyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePrivacy = () => {
    if (onUpdatePrivacy) {
      // Map UI labels to DB schema values (lowercase to match backend enum)
      const privacyTypeMap: Record<string, string> = {
        'PUBLIC': 'public',
        'PASSWORD_PROTECTED': 'password',
        'UNLISTED': 'unlisted',
      };
      onUpdatePrivacy({
        type: privacyTypeMap[privacyType] || privacyType.toLowerCase(),
        passwordHash: privacyType === 'PASSWORD_PROTECTED' ? password : undefined,
      });
      setSavedPrivacy(true);
      setTimeout(() => setSavedPrivacy(false), 2000);
    }
  };

  const hasTunnel = isProduction || !!publicTunnelUrl;
  const hasLanIp = !!detectedLanIp;

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

        <TeddyMascot
          pose={activeShareTab === 'recipient' ? 'holding_gift' : 'thinking'}
          size="md"
          message={activeShareTab === 'recipient' ? 'Ready for the birthday star!' : 'Manage your journey in Studio!'}
        />

        <h3 className="font-playfair font-bold text-2xl text-stone-900 mt-2">
          {activeShareTab === 'recipient' ? `Share ${experience.recipient?.name}'s Journey` : 'Share Studio / Dashboard Link'}
        </h3>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          {activeShareTab === 'recipient'
            ? 'This public link directly opens the live birthday experience (no login required).'
            : 'This link opens the Creator Studio editor to edit cards, modules, and soundtrack.'}
        </p>

        {/* Share Purpose Tabs */}
        <div className="grid grid-cols-2 gap-2 mt-4 mb-3 p-1 bg-stone-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveShareTab('recipient')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeShareTab === 'recipient'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🎁 Recipient Preview Link</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveShareTab('dashboard')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeShareTab === 'dashboard'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>⚙️ Studio / Dashboard Link</span>
          </button>
        </div>

        {/* Link Target Mode Selector */}
        <div className="mt-4 mb-4 p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-left">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-700" />
              <span>Link Type</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-amber-100/60 rounded-xl mb-2.5">
            <button
              type="button"
              onClick={() => setLinkMode('lan')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                linkMode === 'lan'
                  ? 'bg-white text-amber-900 shadow-sm font-extrabold'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <Wifi className="w-3.5 h-3.5 text-amber-600" />
              <span>Wi-Fi</span>
            </button>
            <button
              type="button"
              onClick={() => hasTunnel ? setLinkMode('public') : null}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                hasTunnel ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
              } ${
                linkMode === 'public'
                  ? 'bg-white text-emerald-900 shadow-sm font-extrabold'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
              title={hasTunnel ? 'Public internet link (any device, anywhere)' : 'Public tunnel not available yet — use Wi-Fi mode'}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Internet</span>
            </button>
            <button
              type="button"
              onClick={() => setLinkMode('local')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                linkMode === 'local'
                  ? 'bg-white text-amber-900 shadow-sm'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <Laptop className="w-3.5 h-3.5 text-amber-700" />
              <span>This PC</span>
            </button>
          </div>

          {/* Mode descriptions */}
          {linkMode === 'lan' && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-amber-900 font-medium">
                📶 <strong>Same Wi-Fi:</strong> Works on any phone connected to the same Wi-Fi/home network as this PC.
                {networkLoading && <span className="text-amber-600 ml-1">Detecting your IP…</span>}
              </p>
              {!networkLoading && (
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder={detectedLanIp ? detectedLanIp : 'Enter your PC IP (e.g. 192.168.1.100)'}
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value.trim())}
                    className="w-full px-3 py-1.5 rounded-xl border border-amber-300 text-xs bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  {allLanIps.length > 1 && (
                    <div className="flex flex-wrap gap-1">
                      {allLanIps.map((ip) => (
                        <button
                          key={ip}
                          onClick={() => setCustomHost(ip)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                            (customHost || detectedLanIp) === ip
                              ? 'border-amber-500 bg-amber-100 text-amber-900'
                              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {ip}
                        </button>
                      ))}
                    </div>
                  )}
                  {!hasLanIp && !customHost && (
                    <p className="text-[10px] text-rose-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Could not detect LAN IP. Enter it manually above.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {linkMode === 'public' && hasTunnel && (
            <p className="text-[11px] text-emerald-800 font-medium">
              🌍 <strong>Public Internet:</strong> Openable from <em>any device worldwide</em> on any network (4G/5G or any Wi-Fi). Powered by Cloudflare with direct instant loading!
            </p>
          )}

          {linkMode === 'local' && (
            <p className="text-[11px] text-stone-600">
              💻 <strong>This PC only:</strong> Only works in the browser on this same computer.
            </p>
          )}
        </div>

        {/* QR Code */}
        {qrDataUrl && (
          <div className="my-3 inline-block p-3 bg-white rounded-2xl border border-stone-200 shadow-xs">
            <img src={qrDataUrl} alt="QR Code" className="w-44 h-44 mx-auto rounded-lg" />
            <p className="text-[10px] text-stone-400 mt-1 font-medium">
              {linkMode === 'lan' ? 'Scan on same Wi-Fi network' : linkMode === 'public' ? 'Scan from anywhere' : 'Scan on this device'}
            </p>
          </div>
        )}

        {/* Link Bar */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-stone-300 bg-stone-50">
          <input
            type="text"
            readOnly
            value={activeCopyUrl}
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

        {/* Helpful tip for mobile */}
        {activeShareTab === 'recipient' ? (
          <>
            {linkMode === 'lan' && hasLanIp && (
              <p className="text-[10px] text-amber-700 mt-2 text-center font-medium">
                ✅ Send this recipient link via WhatsApp — directly opens the birthday preview (no sign-in needed)
              </p>
            )}
            {linkMode === 'public' && (
              <p className="text-[10px] text-emerald-700 mt-2 text-center font-medium">
                ✅ This recipient link works anywhere worldwide — zero login required
              </p>
            )}
          </>
        ) : (
          <p className="text-[10px] text-stone-600 mt-2 text-center font-medium">
            🔒 This Studio link allows you to manage modules, edit theme, and update soundtrack.
          </p>
        )}

        {/* Open Direct Button */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
          <a
            href={activeCopyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <span>{activeShareTab === 'recipient' ? '✨ Open Live Recipient Preview' : '🛠️ Open Studio Editor'}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Privacy Settings */}
        <div className="mt-6 pt-5 border-t border-stone-200 text-left">
          <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-2">
            Access &amp; Privacy Protection
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

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, Check, X, Copy, Mail, Sparkles, MessageSquare, Trash2, Film, Image as ImageIcon } from 'lucide-react';
import { api } from '../../services/api';
import { Contributor, Contribution } from '../../types';
import { getMediaUrl } from '../../utils/mediaUrl';

interface ContributorsManagerProps {
  experienceId: string;
  recipientName: string;
}

export const ContributorsManager: React.FC<ContributorsManagerProps> = ({
  experienceId,
  recipientName,
}) => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      const [cnts, ctbs] = await Promise.all([
        api.contributors.list(experienceId),
        api.contributors.listContributions(experienceId),
      ]);
      setContributors(cnts);
      setContributions(ctbs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [experienceId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsLoading(true);
    try {
      await api.contributors.invite(experienceId, newName, newEmail);
      setNewName('');
      setNewEmail('');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await api.contributors.delete(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const handleReview = async (id: string, approved: boolean) => {
    setReviewingId(id);
    try {
      await api.contributors.reviewContribution(id, approved);
      await loadData();
    } catch (err) {
      console.error('Review failed:', err);
      alert('Failed to update contribution status. Please try again.');
    } finally {
      setReviewingId(null);
    }
  };

  const [detectedLanIp, setDetectedLanIp] = useState<string>('');
  const [publicTunnelUrl, setPublicTunnelUrl] = useState<string>('');

  useEffect(() => {
    api.system.getNetworkInfo()
      .then((res) => {
        if (res?.publicUrl) {
          setPublicTunnelUrl(res.publicUrl);
        }
        if (res?.ip && res.ip !== '127.0.0.1') {
          setDetectedLanIp(res.ip);
        }
      })
      .catch(() => {});
  }, []);

  // Build the best invite link: Production domain works anywhere globally on mobile/desktop,
  // Cloudflare tunnel works anywhere, LAN IP works on local WiFi, last resort localhost.
  const buildInviteLink = (token: string): string => {
    // If running on a live deployed domain (Render, Vercel, custom domain)
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `${window.location.origin}/contribute/${token}`;
    }
    // Cloudflare public tunnel: works anywhere on any device (cellular 4G/5G or WiFi)
    if (publicTunnelUrl) {
      return `${publicTunnelUrl}/contribute/${token}`;
    }
    // LAN IP: works on any phone on the same home/office Wi-Fi
    if (detectedLanIp) {
      return `http://${detectedLanIp}:5173/contribute/${token}`;
    }
    // Fallback: same-device localhost
    return `${window.location.origin}/contribute/${token}`;
  };

  const copyInviteLink = (token: string) => {
    const link = buildInviteLink(token);
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  return (
    <div className="space-y-6 text-left">
      {/* Invite Form */}
      <div className="p-5 rounded-2xl bg-[#fffdfa] border border-stone-200 shadow-xs">
        <h4 className="font-playfair font-bold text-stone-900 text-base flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-amber-700" />
          <span>Invite Friends & Family to Contribute</span>
        </h4>
        <p className="text-xs text-stone-500 mt-0.5">
          Each person gets a private link to submit their birthday wish, photo, or voice note for {recipientName}.
        </p>

        <form onSubmit={handleInvite} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Contributor Name (e.g. Maya)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-amber-700 text-white font-semibold text-xs hover:bg-amber-800 transition cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            Generate Link
          </button>
        </form>

        {/* Network info note */}
        {isProduction ? (
          <p className="text-[10px] text-emerald-700 mt-2.5 font-medium flex items-center gap-1">
            <span>🌐</span>
            <span>Live Public Link — openable from any phone, laptop, or tablet worldwide.</span>
          </p>
        ) : publicTunnelUrl ? (
          <p className="text-[10px] text-emerald-700 mt-2.5 font-medium">
            🌍 Links use the public Cloudflare tunnel — openable from any phone worldwide (cellular data or Wi-Fi).
          </p>
        ) : detectedLanIp ? (
          <p className="text-[10px] text-blue-700 mt-2.5 font-medium">
            📶 Links use your Wi-Fi IP (<span className="font-mono">{detectedLanIp}</span>) — works on any phone on the same Wi-Fi.
          </p>
        ) : (
          <p className="text-[10px] text-stone-500 mt-2.5">
            ℹ️ Links use localhost — only works on this computer.
          </p>
        )}
      </div>

      {/* Contributors List */}
      <div className="p-5 rounded-2xl bg-[#fffdfa] border border-stone-200 shadow-xs">
        <h4 className="font-playfair font-bold text-stone-900 text-base mb-3 flex items-center justify-between">
          <span>Invited Circle ({contributors.length})</span>
        </h4>

        {contributors.length === 0 ? (
          <p className="text-xs text-stone-400 py-3 text-center">No contributors invited yet.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {contributors.map((c) => {
              const token = c.token || (c as any).inviteToken || '';
              const inviteLink = buildInviteLink(token);
              return (
                <div key={c._id} className="py-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-xs text-stone-800">{c.name}</p>
                      <p className="text-[11px] text-stone-500">{c.email || 'Direct Link Invite'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.status}
                      </span>
                      <button
                        onClick={() => copyInviteLink(token)}
                        className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white text-[11px] font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedToken === token ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedToken === token ? 'Copied' : 'Copy Link'}</span>
                      </button>
                      <button
                        onClick={() => handleRemove(c._id)}
                        className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                        title="Remove contributor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Show the actual link so user can see/copy it */}
                  <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5">
                    <span className="text-[10px] font-mono text-stone-600 break-all flex-1">{inviteLink}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Incoming Contributions Review */}
      <div className="p-5 rounded-2xl bg-[#fffdfa] border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <h4 className="font-playfair font-bold text-stone-900 text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-700" />
            <span>Wishes & Submissions ({contributions.length})</span>
          </h4>
          <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            ✨ Approved wishes upload directly to "People Who Love You"
          </span>
        </div>

        {contributions.length === 0 ? (
          <p className="text-xs text-stone-400 py-3 text-center">No wishes submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {contributions.map((ctb) => {
              const rawUrl = ctb.media?.url || (typeof ctb.media === 'string' ? ctb.media : null);
              const mediaUrl = rawUrl ? getMediaUrl(rawUrl) : null;
              const isVideo = ctb.type === 'VIDEO' || (Boolean(mediaUrl) && /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(mediaUrl));

              return (
                <div
                  key={ctb._id}
                  className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-stone-800">{ctb.contributorName}</span>
                      <span className="text-[10px] text-stone-500">({ctb.relationship || 'Friend'})</span>
                    </div>
                    {ctb.message && (
                      <p className="text-xs text-stone-700 italic">“{ctb.message}”</p>
                    )}

                    {/* Attached Photo or Video preview */}
                    {mediaUrl && (
                      <div className="pt-1">
                        {isVideo ? (
                          <div className="mt-1">
                            <video
                              src={mediaUrl}
                              controls
                              playsInline
                              className="max-h-36 max-w-xs rounded-lg border border-stone-300 shadow-2xs"
                            />
                            <span className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                              <Film className="w-3 h-3 text-amber-700" /> Attached Video
                            </span>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <img
                              src={mediaUrl}
                              alt="Attached photo"
                              className="max-h-28 rounded-lg border border-stone-300 shadow-2xs object-cover cursor-pointer hover:opacity-90"
                              onClick={() => window.open(mediaUrl, '_blank')}
                            />
                            <span className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                              <ImageIcon className="w-3 h-3 text-amber-700" /> Click to view full image
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {reviewingId === ctb._id ? (
                    <span className="text-xs text-stone-400 animate-pulse px-3 py-1.5">Saving…</span>
                  ) : ctb.reviewStatus?.toLowerCase() === 'approved' || ctb.approved === true ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Approved
                    </span>
                  ) : ctb.reviewStatus?.toLowerCase() === 'rejected' ? (
                    <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <X className="w-3 h-3" /> Rejected
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleReview(ctb._id, true)}
                        disabled={reviewingId !== null}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => handleReview(ctb._id, false)}
                        disabled={reviewingId !== null}
                        className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 font-semibold text-xs hover:bg-rose-200 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};

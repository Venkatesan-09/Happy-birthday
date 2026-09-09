import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Send, Upload, X } from 'lucide-react';
import { api } from '../../services/api';
import { SoundEffects } from '../../utils/audioEngine';
import { TeddyMascot } from '../../components/TeddyMascot';
import { TranslateButton } from '../../components/TranslateButton';

interface ContributorSubmissionViewProps {
  token: string;
  onExit?: () => void;
}

export const ContributorSubmissionView: React.FC<ContributorSubmissionViewProps> = ({
  token,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [relationship, setRelationship] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaPreview, setMediaPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.contributors
      .getByToken(token)
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setIsUploading(true);
    setUploadProgress(0);

    // Immediate local preview (images only; audio won't render but that's fine)
    const objectUrl = URL.createObjectURL(file);
    setMediaPreview(objectUrl);

    try {
      const result = await api.media.contributorUploadFile(token, file, {
        onProgress: (pct) => setUploadProgress(pct),
      });
      setMediaUrl(result?.cloudinary?.secureUrl || result?.secureUrl || '');
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed. Please try again.');
      setMediaPreview('');
      setMediaUrl('');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearMedia = () => {
    setMediaUrl('');
    setMediaPreview('');
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSubmitting(true);
    try {
      await api.contributors.submit(token, {
        message: message.trim(),
        relationship: relationship.trim() || undefined,
        mediaUrl: mediaUrl || undefined,
      });
      setSubmitted(true);
      SoundEffects.playCelebrationFanfare();
      confetti({ particleCount: 90, spread: 70 });
    } catch (err) {
      console.error(err);
      alert('Failed to submit wish. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6">
        <TeddyMascot pose="sleeping" size="md" message="Loading invitation..." />
      </div>
    );
  }

  if (!data || !data.contributor) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-center">
        <TeddyMascot pose="sleeping" size="md" />
        <h3 className="font-playfair font-bold text-xl text-stone-900 mt-3">Invitation Not Found</h3>
        <p className="text-xs text-stone-500 mt-1">
          This contributor invite link may have expired or is invalid.
        </p>
      </div>
    );
  }

  const { contributor, experience } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf6f0] to-[#f0e4d0] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg rounded-3xl bg-[#fffdfa] border border-amber-200 shadow-xl p-6 sm:p-8 text-center">
        <TeddyMascot
          pose={submitted ? 'celebrating' : 'holding_gift'}
          size="md"
          message={submitted ? 'Wish delivered!' : 'Add your love!'}
        />

        {!submitted ? (
          <>
            <div className="mt-3 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full">
                Secret Birthday Circle
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-playfair text-stone-900">
                A Birthday Surprise for {experience?.recipient?.name}
              </h2>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">
                Hi {contributor.name}! Write a personal wish, memory, or loving message that will be
                featured in {experience?.recipient?.name}'s interactive birthday experience.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
              {/* Message */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                    Your Birthday Message or Memory *
                  </label>
                  <TranslateButton value={message} onTranslated={setMessage} />
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder={`Dear ${experience?.recipient?.name}, wishing you the happiest birthday...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed placeholder:text-stone-400"
                />
              </div>

              {/* Relationship */}
              <div>
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                  How do you know them? (e.g. College Friend, Sister, Colleague)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Childhood Bestie"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Photo / Media Upload */}
              <div>
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                  Attach a Photo or Voice Note (Optional)
                </label>

                {!mediaPreview ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="mt-1.5 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 text-xs font-semibold hover:bg-amber-50 transition cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading
                      ? `Uploading… ${uploadProgress}%`
                      : 'Choose Photo or Audio File'}
                  </button>
                ) : (
                  <div className="mt-1.5 relative rounded-xl overflow-hidden border border-amber-200">
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full h-40 object-cover"
                      onError={() => setMediaPreview('')}
                    />
                    <button
                      type="button"
                      onClick={clearMedia}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {mediaUrl && (
                      <div className="absolute bottom-2 left-2 bg-green-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ✓ Uploaded
                      </div>
                    )}
                  </div>
                )}

                {/* Upload progress bar */}
                {isUploading && (
                  <div className="mt-1.5 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-amber-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: 'linear' }}
                    />
                  </div>
                )}

                {uploadError && (
                  <p className="mt-1 text-xs text-red-600">{uploadError}</p>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/wav,audio/ogg,audio/webm"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading || !message.trim()}
                  className="w-full py-3 rounded-2xl bg-amber-700 text-white font-semibold text-sm hover:bg-amber-800 transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting...' : 'Send My Birthday Wish'}</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="mt-4 space-y-3">
            <h3 className="font-playfair font-bold text-2xl text-stone-900">
              Thank you, {contributor.name}!
            </h3>
            <p className="text-xs text-stone-600 max-w-sm mx-auto">
              Your message has been safely sealed into {experience?.recipient?.name}'s interactive
              birthday experience. They will get to experience it on their special day!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

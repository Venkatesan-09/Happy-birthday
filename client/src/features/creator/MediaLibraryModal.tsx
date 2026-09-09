import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Trash2, Image as ImageIcon, Music, Video, Mic, Check, AlertCircle, Loader } from 'lucide-react';
import { api } from '../../services/api';
import { getMediaUrl } from '../../utils/mediaUrl';

interface MediaItem {
  _id: string;
  type: 'image' | 'audio' | 'voice' | 'video';
  originalFilename: string;
  cloudinary: {
    secureUrl: string;
    publicId: string;
    width?: number;
    height?: number;
    format: string;
    bytes: number;
  };
  metadata?: { altText?: string; caption?: string; title?: string };
  createdAt: string;
}

interface MediaLibraryModalProps {
  experienceId: string;
  /** If provided, only show this type in the library and upload to it */
  filterType?: 'image' | 'audio' | 'voice' | 'video';
  /** Module to associate uploads with */
  moduleId?: string;
  /** Called when the user selects a media item */
  onSelect: (item: MediaItem) => void;
  onClose: () => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  image: <ImageIcon className="w-4 h-4" />,
  audio: <Music className="w-4 h-4" />,
  voice: <Mic className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
};

const ACCEPT_MAP: Record<string, string> = {
  image: 'image/jpeg,image/png,image/webp,image/gif',
  audio: 'audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4',
  voice: 'audio/mpeg,audio/wav,audio/ogg,audio/webm',
  video: 'video/mp4,video/webm,video/quicktime',
  any: 'image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/wav,audio/ogg,audio/webm,video/mp4,video/webm,video/quicktime',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  experienceId,
  filterType,
  moduleId,
  onSelect,
  onClose,
}) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.media.list(experienceId, filterType);
      setItems(data as MediaItem[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [experienceId, filterType]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    setUploadProgress(0);
    try {
      await api.media.uploadFile(file, experienceId, {
        moduleId,
        onProgress: (pct) => setUploadProgress(pct),
      });
      await loadMedia();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!window.confirm('Delete this media item? This cannot be undone.')) return;
    setDeleting(mediaId);
    try {
      await api.media.delete(mediaId);
      setItems((prev) => prev.filter((i) => i._id !== mediaId));
      if (selected === mediaId) setSelected(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete media');
    } finally {
      setDeleting(null);
    }
  };

  const handleConfirmSelect = () => {
    const item = items.find((i) => i._id === selected);
    if (item) onSelect(item);
  };

  const acceptTypes = filterType ? ACCEPT_MAP[filterType] : ACCEPT_MAP.any;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-2xl max-h-[85vh] bg-[#fffdfa] rounded-2xl shadow-2xl border border-amber-200 flex flex-col overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100">
            <div>
              <h2 className="font-playfair font-bold text-lg text-stone-900">Media Library</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {filterType ? `Showing ${filterType} files` : 'All media'} · {items.length} item{items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 transition text-stone-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Upload area */}
          <div className="px-5 py-3 border-b border-amber-100 bg-amber-50/60">
            {uploading ? (
              <div className="space-y-1">
                <p className="text-xs text-amber-800 font-semibold flex items-center gap-1.5">
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                  Uploading to Cloudinary… {uploadProgress}%
                </p>
                <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ ease: 'linear' }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Upload New File
              </button>
            )}
            {uploadError && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {uploadError}
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptTypes}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
                <p className="text-sm text-stone-600">{error}</p>
                <button onClick={loadMedia} className="mt-2 text-xs text-amber-700 underline">
                  Retry
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <ImageIcon className="w-8 h-8 text-stone-300 mb-2" />
                <p className="text-sm text-stone-500">No media yet. Upload your first file above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {items.map((item) => (
                  <motion.div
                    key={item._id}
                    className={`relative group rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                      selected === item._id
                        ? 'border-amber-500 ring-2 ring-amber-300'
                        : 'border-stone-200 hover:border-amber-300'
                    }`}
                    onClick={() => setSelected(item._id === selected ? null : item._id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Preview */}
                    {item.type === 'image' ? (
                      <img
                        src={getMediaUrl(item.cloudinary?.secureUrl || '')}
                        alt={item.metadata?.altText || item.metadata?.title || item.originalFilename || 'Media image'}
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <div className="w-full h-24 bg-stone-100 flex flex-col items-center justify-center gap-1 text-stone-400">
                        {TYPE_ICONS[item.type]}
                        <span className="text-[9px] uppercase font-bold">{item.type}</span>
                      </div>
                    )}

                    {/* Selected checkmark */}
                    {selected === item._id && (
                      <div className="absolute top-1.5 right-1.5 bg-amber-500 text-white rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    )}

                    {/* Info bar */}
                    <div className="bg-white/90 px-1.5 py-1 text-[9px] text-stone-600 truncate border-t border-stone-100">
                      {item.originalFilename || item.cloudinary?.format?.toUpperCase() || 'FILE'}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item._id);
                      }}
                      className="absolute bottom-5 right-1.5 opacity-0 group-hover:opacity-100 transition bg-red-500 text-white rounded-full p-0.5"
                      title="Delete"
                    >
                      {deleting === item._id ? (
                        <Loader className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="px-5 py-3 border-t border-amber-100 flex items-center justify-between bg-stone-50">
            <p className="text-xs text-stone-500">
              {selected ? '1 item selected' : 'Click an item to select it'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelect}
                disabled={!selected}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-700 text-white hover:bg-amber-800 transition disabled:opacity-50"
              >
                Use Selected
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

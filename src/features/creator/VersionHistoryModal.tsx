import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { History, X, RotateCcw, Check, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { ExperienceVersion } from '../../types';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  experienceId: string;
  onVersionRestored: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  experienceId,
  onVersionRestored,
}) => {
  const [versions, setVersions] = useState<ExperienceVersion[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.experiences.getVersions(experienceId).then((data) => setVersions(data));
    }
  }, [isOpen, experienceId]);

  if (!isOpen) return null;

  const handleRestore = async (versionId: string) => {
    setRestoringId(versionId);
    try {
      await api.experiences.restoreVersion(experienceId, versionId);
      onVersionRestored();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl bg-[#fffdfa] border border-amber-200 shadow-2xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-800" />
            <h3 className="font-playfair font-bold text-xl text-stone-900">Version History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {versions.length === 0 ? (
            <p className="text-xs text-stone-500 py-6 text-center">No published versions yet. Publish your experience to create a version snapshot.</p>
          ) : (
            versions.map((ver) => (
              <div
                key={ver._id}
                className="p-4 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900">Version {ver.versionNumber}</span>
                    <span className="text-[11px] text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(ver.publishedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {ver.snapshot?.modules?.length || 0} modules • Theme: {ver.snapshot?.theme?.name}
                  </p>
                </div>

                <button
                  onClick={() => handleRestore(ver._id)}
                  disabled={restoringId === ver._id}
                  className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{restoringId === ver._id ? 'Restoring...' : 'Restore'}</span>
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Sparkles,
  Eye,
  Edit3,
  Share2,
  Users,
  History,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Save,
  Palette,
  Settings,
  Upload,
  Gamepad2,
  Trophy,
  HelpCircle,
  HeartHandshake,
  Puzzle,
  Menu,
  MapPin,
  Star,
  Image,
  Heart,
  Globe,
  BookOpen,
  Music2,
  Mic,
  Video,
  Link,
  Pause,
  Play,
} from 'lucide-react';
import { Experience, ExperienceModule, ModuleType } from '../../types';
import { api } from '../../services/api';
import { createDefaultModule, DEFAULT_THEMES } from '../../data/defaults';
import { TeddyMascot } from '../../components/TeddyMascot';
import { ExperienceRenderer } from '../recipient/ExperienceRenderer';
import { ModuleLibraryModal } from './ModuleLibraryModal';
import { SoundEffects } from '../../utils/audioEngine';
import { AIAssistantModal } from './AIAssistantModal';
import { ShareModal } from './ShareModal';
import { VersionHistoryModal } from './VersionHistoryModal';
import { ContributorsManager } from './ContributorsManager';
import { TranslateButton } from '../../components/TranslateButton';
import { MediaLibraryModal } from './MediaLibraryModal';
import { getMediaUrl } from '../../utils/mediaUrl';

interface ExperienceBuilderProps {
  experienceId: string;
  onBack: () => void;
  onViewPublic: (slug: string) => void;
}

export const ExperienceBuilder: React.FC<ExperienceBuilderProps> = ({
  experienceId,
  onBack,
  onViewPublic,
}) => {
  const [experience, setExperience] = useState<Experience | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'contributors' | 'settings'>('editor');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('Saved');

  const loadExperience = async () => {
    try {
      const data = await api.experiences.get(experienceId);
      setExperience(data);
      if (data.modules && data.modules.length > 0 && !selectedModuleId) {
        setSelectedModuleId(data.modules[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadExperience();
  }, [experienceId]);

  if (!experience) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <TeddyMascot pose="sleeping" size="md" message="Gathering your story..." />
        <p className="text-sm text-stone-500 mt-2">Loading Studio...</p>
      </div>
    );
  }

  const modules = experience.modules || [];
  const activeModule = modules.find((m) => m._id === selectedModuleId) || modules[0];

  // Module actions
  const handleAddModule = async (type: ModuleType) => {
    const newMod = createDefaultModule(type, modules.length, experience.recipient?.name);
    try {
      const created = await api.modules.create(experience._id, newMod);
      await loadExperience();
      setSelectedModuleId(created._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateActiveModuleContent = async (updatedContent: any) => {
    if (!activeModule) return;
    setSaveStatus('Saving...');
    try {
      await api.modules.update(activeModule._id, { content: updatedContent });
      setExperience((prev) => {
        if (!prev) return prev;
        const updatedMods = (prev.modules || []).map((m) =>
          m._id === activeModule._id ? { ...m, content: updatedContent } : m
        );
        return { ...prev, modules: updatedMods };
      });
      setSaveStatus('Saved');
    } catch (err) {
      console.error(err);
      setSaveStatus('Error');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (modules.length <= 1) {
      alert('Your journey needs at least one module.');
      return;
    }
    try {
      await api.modules.delete(moduleId);
      await loadExperience();
      const remaining = modules.filter((m) => m._id !== moduleId);
      if (remaining.length > 0) {
        setSelectedModuleId(remaining[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveModule = async (moduleId: string, direction: 'up' | 'down') => {
    const idx = modules.findIndex((m) => m._id === moduleId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === modules.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newIds = [...modules.map((m) => m._id)];
    const temp = newIds[idx];
    newIds[idx] = newIds[targetIdx];
    newIds[targetIdx] = temp;

    try {
      await api.modules.reorder(experience._id, newIds);
      await loadExperience();
    } catch (err) {
      console.error(err);
    }
  };

  // Publish
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const check = await api.experiences.checkPublish(experience._id);
      if (!check.canPublish) {
        const failedChecks = (check.checks || []).filter((c: any) => c.severity === 'error' && !c.passed).map((c: any) => c.label);
        alert(failedChecks.length > 0 ? `Cannot publish yet:\n• ${failedChecks.join('\n• ')}` : 'Please complete all required fields before publishing.');
        setIsPublishing(false);
        return;
      }
      await api.experiences.publish(experience._id);
      SoundEffects.playCelebrationFanfare();
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
      await loadExperience();
      setIsShareOpen(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to publish experience. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col">
      {/* Top Studio Bar */}
      <header className="h-16 px-4 sm:px-6 bg-[#fffdfa] border-b border-stone-200 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 cursor-pointer transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-playfair font-bold text-base text-stone-900 leading-tight">
                {experience.recipient?.name}’s Birthday Journey
              </h2>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  String(experience.status).toUpperCase() === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {experience.status}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {experience.recipient?.relationship} • {saveStatus}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'editor' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'preview' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Recipient Preview</span>
          </button>
          <button
            onClick={() => setActiveTab('contributors')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'contributors' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contributors</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setIsVersionsOpen(true)}
            className="p-2 rounded-xl text-stone-600 hover:bg-stone-100 cursor-pointer"
            title="Version Snapshots"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsShareOpen(true)}
            className="px-2.5 sm:px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share & QR</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className={`px-3 sm:px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 ${
              String(experience.status).toUpperCase() === 'PUBLISHED'
                ? 'bg-emerald-700 hover:bg-emerald-800'
                : 'bg-amber-700 hover:bg-amber-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isPublishing
                ? 'Publishing...'
                : String(experience.status).toUpperCase() === 'PUBLISHED'
                ? 'Published ✓ (Update)'
                : 'Publish'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Mode Switcher Sub-header */}
      <div className="md:hidden bg-[#fffdfa] border-b border-stone-200 px-3 py-2 flex items-center justify-around overflow-x-auto gap-1 text-xs sticky top-16 z-30">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'editor' ? 'bg-amber-100 text-amber-900' : 'text-stone-600'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Studio</span>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'preview' ? 'bg-amber-100 text-amber-900' : 'text-stone-600'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview</span>
        </button>
        <button
          onClick={() => setActiveTab('contributors')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'contributors' ? 'bg-amber-100 text-amber-900' : 'text-stone-600'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Circle</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'settings' ? 'bg-amber-100 text-amber-900' : 'text-stone-600'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Main Studio Body */}
      {activeTab === 'preview' && (
        <div className="flex-1 overflow-y-auto">
          <div className="bg-amber-100/70 border-b border-amber-200 py-2 text-center text-xs text-amber-900 font-medium">
            👀 Live Recipient Experience Simulation — Changes you make update here instantly
          </div>
          <ExperienceRenderer experience={experience} />
        </div>
      )}

      {activeTab === 'contributors' && (
        <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
          <ContributorsManager experienceId={experience._id} recipientName={experience.recipient?.name} />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="flex-1 p-6 max-w-2xl mx-auto w-full text-left space-y-6">
          <div className="p-6 rounded-3xl bg-[#fffdfa] border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-playfair font-bold text-lg text-stone-900">Experience Settings</h3>

            <div>
              <label className="text-xs font-bold text-stone-700 uppercase">Theme Palette</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(DEFAULT_THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={async () => {
                      await api.experiences.update(experience._id, { theme: t });
                      loadExperience();
                    }}
                    className={`p-3 rounded-xl border text-xs text-left cursor-pointer transition ${
                      experience.theme?.name === t.name
                        ? 'border-amber-600 bg-amber-50/70 font-semibold'
                        : 'border-stone-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.primaryColor }} />
                      <span>{t.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200">
              <label className="text-xs font-bold text-stone-700 uppercase">Recipient Details</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <input
                  type="text"
                  value={experience.recipient?.name || ''}
                  onChange={async (e) => {
                    const nextRec = { ...experience.recipient, name: e.target.value };
                    await api.experiences.update(experience._id, { recipient: nextRec });
                    setExperience({ ...experience, recipient: nextRec });
                  }}
                  placeholder="Recipient Name"
                  className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
                />
                <input
                  type="date"
                  value={experience.recipient?.birthday || ''}
                  onChange={async (e) => {
                    const nextRec = { ...experience.recipient, birthday: e.target.value };
                    await api.experiences.update(experience._id, { recipient: nextRec });
                    setExperience({ ...experience, recipient: nextRec });
                  }}
                  className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'editor' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Module Sidebar */}
          <aside className="w-full md:w-72 bg-[#fffdfa] border-r border-stone-200 flex flex-col flex-shrink-0 h-auto md:h-[calc(100vh-64px)]">
            <div className="p-3.5 border-b border-stone-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Timeline Modules ({modules.length})
              </span>
              <button
                onClick={() => setIsLibraryOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {modules.map((m, idx) => {
                const isSelected = m._id === selectedModuleId;
                return (
                  <div
                    key={m._id}
                    onClick={() => setSelectedModuleId(m._id)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs group ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-400 text-stone-900 shadow-2xs font-medium'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-stone-400 font-mono">{idx + 1}</span>
                      <span className="truncate">{m.title || m.type}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveModule(m._id, 'up');
                        }}
                        disabled={idx === 0}
                        className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveModule(m._id, 'down');
                        }}
                        disabled={idx === modules.length - 1}
                        className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModule(m._id);
                        }}
                        className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Teddy Helper Footer */}
            <div className="p-3 bg-amber-50/50 border-t border-stone-200 flex items-center gap-2">
              <TeddyMascot pose="waving" size="sm" />
              <p className="text-[11px] text-amber-900 leading-tight">
                Tip: Use <strong>AI Craft</strong> to draft words tailored to {experience.recipient?.name}!
              </p>
            </div>
          </aside>

          {/* Right Module Content Inspector */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8">
            {activeModule ? (
              <div className="max-w-2xl mx-auto space-y-6 text-left">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      {activeModule.type}
                    </span>
                    <h3 className="text-xl font-bold font-playfair text-stone-900 mt-1">
                      {activeModule.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => setIsAIOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 hover:bg-amber-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Rewrite with AI</span>
                  </button>
                </div>

                {/* Dynamic Inspector Form based on Module Type */}
                <ModuleFormInspector
                  module={activeModule}
                  recipientName={experience.recipient?.name}
                  experienceId={experience._id}
                  onChange={handleUpdateActiveModuleContent}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-400 text-sm">
                Select a module from the left to edit its content.
              </div>
            )}
          </main>
        </div>
      )}

      {/* Modals */}
      <ModuleLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onAddModule={handleAddModule}
        existingModuleTypes={modules.map((m) => m.type)}
      />

      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        recipientName={experience.recipient?.name || 'Friend'}
        relationship={experience.recipient?.relationship || 'Best Friend'}
        initialType={getAITypeForModule(activeModule?.type)}
        onApplyContent={(text) => {
          if (!activeModule) return;
          const currentContent = activeModule.content || {};
          if (activeModule.type === 'LETTER') {
            handleUpdateActiveModuleContent({ ...currentContent, letterBody: text });
          } else if (activeModule.type === 'BIRTHDAY_REVEAL') {
            handleUpdateActiveModuleContent({ ...currentContent, greeting: text });
          } else if (activeModule.type === 'CINEMATIC_OPENING') {
            handleUpdateActiveModuleContent({ ...currentContent, subtitle: text });
          } else if (activeModule.type === 'FINAL_REVEAL') {
            handleUpdateActiveModuleContent({ ...currentContent, grandMessage: text });
          } else if (activeModule.type === 'GIFT') {
            handleUpdateActiveModuleContent({ ...currentContent, giftMessage: text });
          } else if (activeModule.type === 'SECRET') {
            handleUpdateActiveModuleContent({ ...currentContent, secretRevealMessage: text });
          }
        }}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        experience={experience}
        onUpdatePrivacy={async (priv) => {
          await api.experiences.update(experience._id, { privacy: priv });
          loadExperience();
        }}
      />

      <VersionHistoryModal
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
        experienceId={experience._id}
        onVersionRestored={loadExperience}
      />
    </div>
  );
};

function getAITypeForModule(type?: ModuleType): any {
  switch (type) {
    case 'LETTER':
      return 'LETTER';
    case 'INSIDE_JOKES':
      return 'JOKE';
    case 'STORY':
      return 'STORY';
    case 'SECRET':
      return 'SECRET_MESSAGE';
    case 'FUTURE_WISHES':
      return 'FUTURE_WISH';
    case 'FINAL_REVEAL':
      return 'FINAL_MESSAGE';
    default:
      return 'WISH';
  }
}

// Voice Note module fast MP3 editor with background playback controls
const VoiceNoteEditor: React.FC<{
  content: any;
  updateField: (field: string, value: any) => void;
  experienceId: string;
  moduleId?: string;
  MediaPickButton: any;
}> = ({ content, updateField, experienceId, moduleId, MediaPickButton }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const handleAudioFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|webm)$/i)) {
      setUploadError('Please select a valid audio file (.mp3, .wav, .m4a, .ogg)');
      return;
    }

    setUploadError('');
    setUploading(true);
    setUploadProgress(0);

    // Instant local duration readout via HTML5 Audio
    try {
      const tempAudio = new Audio(URL.createObjectURL(file));
      tempAudio.onloadedmetadata = () => {
        if (tempAudio.duration && !isNaN(tempAudio.duration)) {
          const mins = Math.floor(tempAudio.duration / 60);
          const secs = Math.floor(tempAudio.duration % 60);
          updateField('durationSeconds', `${mins}:${secs < 10 ? '0' : ''}${secs}`);
        }
      };
    } catch {
      // ignore
    }

    try {
      const result: any = await api.media.uploadFile(file, experienceId, {
        moduleId,
        onProgress: (pct) => setUploadProgress(pct),
      });

      const audioUrl = result?.cloudinary?.secureUrl || result?.secureUrl || result?.url || '';
      if (audioUrl) {
        updateField('audioUrl', audioUrl);
        if (content.playAsBackground !== false) {
          updateField('playAsBackground', true);
        }
      }
    } catch (err: any) {
      console.error('Audio upload error:', err);
      setUploadError(err.message || 'Upload failed. Please check connection and try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleAudioPreview = () => {
    if (!content.audioUrl) return;
    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio(getMediaUrl(content.audioUrl));
      audioPreviewRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioPreviewRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPreviewRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, [content.audioUrl]);

  return (
    <div className="space-y-5">
      <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50/80 via-[#fffdfa] to-amber-50/60 border border-rose-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
            <Mic className="w-4 h-4 text-rose-600" />
            <span>Voice Note From My Heart</span>
          </h4>
          <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/70 border border-rose-200 px-2 py-0.5 rounded-full">
            Plays to Receiver
          </span>
        </div>
        <p className="text-xs text-stone-500">
          Upload your MP3 voice note or song. It will display as an animated waveform card and play in the background for the recipient!
        </p>

        {/* Fast Direct 1-Click MP3 Uploader */}
        <div className="p-4 rounded-xl bg-white border-2 border-dashed border-rose-300 hover:border-rose-400 transition-colors">
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/m4a,audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAudioFile(file);
            }}
          />

          {uploading ? (
            <div className="py-4 text-center space-y-2">
              <div className="w-8 h-8 mx-auto border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
              <p className="text-xs font-semibold text-rose-800">
                Uploading MP3 Audio ({uploadProgress}%)...
              </p>
              <div className="w-48 max-w-full mx-auto h-2 bg-rose-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-stone-400">Saving and preparing audio player...</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                  <Music2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-800">
                    {content.audioUrl ? 'Replace / Change MP3 File' : 'Upload MP3 Voice Note / Song'}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    Select any .mp3, .wav, or .m4a file from your device
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 shadow-xs flex items-center gap-1.5 cursor-pointer transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Choose MP3 File</span>
              </button>
            </div>
          )}

          {uploadError && (
            <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Active Audio Preview Player */}
        {content.audioUrl && (
          <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Audio Uploaded Successfully</span>
              </span>
              <button
                type="button"
                onClick={toggleAudioPreview}
                className="px-3 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 text-xs font-semibold hover:bg-rose-100 flex items-center gap-1 cursor-pointer transition shadow-2xs"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-rose-600" /> : <Play className="w-3.5 h-3.5 text-rose-600" />}
                <span>{isPlaying ? 'Pause Preview' : 'Test Audio'}</span>
              </button>
            </div>
            <audio src={getMediaUrl(content.audioUrl)} controls className="w-full h-8 mt-1" />
          </div>
        )}

        {/* Play Background to Receiver Toggle */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
          <input
            type="checkbox"
            id="playAsBackgroundCheckbox"
            checked={content.playAsBackground !== false}
            onChange={(e) => updateField('playAsBackground', e.target.checked)}
            className="mt-0.5 w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer"
          />
          <label htmlFor="playAsBackgroundCheckbox" className="text-xs text-stone-700 cursor-pointer">
            <span className="font-bold text-stone-900 block">
              🎵 Play in background for receiver
            </span>
            <span className="text-[11px] text-stone-500">
              When enabled, this MP3 will automatically start playing in the background as the receiver steps into their birthday journey.
            </span>
          </label>
        </div>

        {/* Text Details */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-stone-700">Card Title</label>
            <TranslateButton value={content.title || ''} onTranslated={(t) => updateField('title', t)} />
          </div>
          <input
            type="text"
            value={content.title || ''}
            placeholder="e.g. A Voice Wish For You"
            onChange={(e) => updateField('title', e.target.value)}
            className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-rose-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-stone-700">Sender Signature</label>
            <input
              type="text"
              value={content.senderName || ''}
              placeholder="e.g. With love, from Priya"
              onChange={(e) => updateField('senderName', e.target.value)}
              className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Duration Label</label>
            <input
              type="text"
              value={content.durationSeconds || ''}
              placeholder="e.g. 0:42"
              onChange={(e) => updateField('durationSeconds', e.target.value)}
              className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-stone-700">Message Transcription</label>
            <TranslateButton value={content.transcription || ''} onTranslated={(t) => updateField('transcription', t)} />
          </div>
          <textarea
            rows={3}
            value={content.transcription || ''}
            placeholder="Type what you said in the audio — shown as an optional quote to the recipient."
            onChange={(e) => updateField('transcription', e.target.value)}
            className="w-full mt-1.5 p-2.5 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-rose-400 focus:outline-none leading-relaxed"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-700">Recorded Date Label</label>
          <input
            type="text"
            value={content.recordedDate || ''}
            placeholder="e.g. Today, or Last night"
            onChange={(e) => updateField('recordedDate', e.target.value)}
            className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
          />
        </div>

        {/* External audio URL or Library picker option */}
        <div className="pt-2 border-t border-rose-200/50">
          <MediaPickButton
            fieldKey="audioUrl"
            label="Or enter direct audio URL / pick from library:"
            filterType="audio"
            currentUrl={content.audioUrl}
            placeholder="https://example.com/my-voice-note.mp3"
            helpText="Optionally paste a direct .mp3 link if hosted elsewhere."
          />
        </div>
      </div>
    </div>
  );
};

// Module Form Inspector for editing content fields
const ModuleFormInspector: React.FC<{
  module: ExperienceModule;
  recipientName?: string;
  experienceId: string;
  onChange: (content: any) => void;
}> = ({ module, recipientName = 'Friend', experienceId, onChange }) => {
  const [content, setContent] = useState<any>(module.content || {});
  const [mediaPickerOpen, setMediaPickerOpen] = useState<string | null>(null); // key of field being picked
  const latestContentRef = useRef<any>(module.content || {});
  const debounceTimerRef = useRef<any>(null);

  // Sync internal state whenever active module changes
  useEffect(() => {
    // Flush any pending changes for the previous module before switching
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const freshContent = module.content || {};
    setContent(freshContent);
    latestContentRef.current = freshContent;
  }, [module._id]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const updateField = (key: string, value: any) => {
    setContent((prev: any) => {
      const updated = { ...(prev || {}), [key]: value };
      latestContentRef.current = updated;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChange(latestContentRef.current);
      }, 350);

      return updated;
    });
  };

  const updateFields = (patch: Record<string, any>) => {
    setContent((prev: any) => {
      const updated = { ...(prev || {}), ...patch };
      latestContentRef.current = updated;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChange(latestContentRef.current);
      }, 350);

      return updated;
    });
  };

  // Helper: inline upload button that opens the media library modal
  const MediaPickButton = ({
    fieldKey,
    label,
    filterType,
    currentUrl,
    placeholder,
    helpText,
    onDirectUpdate,
  }: {
    fieldKey: string;
    label: string;
    filterType: 'image' | 'audio' | 'video';
    currentUrl?: string;
    placeholder?: string;
    helpText?: string;
    onDirectUpdate?: (url: string) => void;
  }) => (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-stone-700">{label}</label>
        <button
          type="button"
          onClick={() => setMediaPickerOpen(fieldKey)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-semibold cursor-pointer transition shadow-2xs"
        >
          <Upload className="w-3 h-3" />
          <span>Upload / Pick</span>
        </button>
      </div>
      <input
        type="url"
        value={currentUrl || ''}
        placeholder={placeholder || `https://example.com/${filterType}-file`}
        onChange={(e) => {
          if (onDirectUpdate) onDirectUpdate(e.target.value);
          else updateField(fieldKey, e.target.value);
        }}
        className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-amber-400 focus:outline-none"
      />
      {helpText && <p className="text-[10px] text-stone-400 mt-1">{helpText}</p>}
      {currentUrl && filterType === 'image' && (
        <img
          src={getMediaUrl(currentUrl)}
          alt="preview"
          className="mt-2 w-full h-24 object-cover rounded-xl border border-stone-200 shadow-2xs"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      {currentUrl && filterType === 'audio' && (
        <audio src={getMediaUrl(currentUrl)} controls className="mt-2 w-full h-8" />
      )}
      {mediaPickerOpen === fieldKey && (
        <MediaLibraryModal
          experienceId={experienceId}
          moduleId={module._id}
          filterType={filterType}
          onSelect={(item) => {
            if (onDirectUpdate) onDirectUpdate(item.cloudinary.secureUrl);
            else updateField(fieldKey, item.cloudinary.secureUrl);
            setMediaPickerOpen(null);
          }}
          onClose={() => setMediaPickerOpen(null)}
        />
      )}
    </div>
  );

  switch (module.type) {
    case 'CINEMATIC_OPENING':
      return (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Display Heading</label>
              <TranslateButton value={content.title || ''} onTranslated={(t) => updateField('title', t)} />
            </div>
            <input
              type="text"
              value={content.title || ''}
              placeholder="e.g. A Chapter Dedicated to You"
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Opening Subtitle</label>
              <TranslateButton value={content.subtitle || ''} onTranslated={(t) => updateField('subtitle', t)} />
            </div>
            <input
              type="text"
              value={content.subtitle || ''}
              placeholder="e.g. Take a deep breath and step inside your birthday story..."
              onChange={(e) => updateField('subtitle', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Philosophical / Poetic Quote</label>
              <TranslateButton value={content.quote || ''} onTranslated={(t) => updateField('quote', t)} />
            </div>
            <textarea
              rows={2}
              value={content.quote || ''}
              placeholder="e.g. The world is softer and warmer because you are in it."
              onChange={(e) => updateField('quote', e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">CTA Button Text</label>
              <TranslateButton value={content.tapToBeginText || ''} onTranslated={(t) => updateField('tapToBeginText', t)} />
            </div>
            <input
              type="text"
              value={content.tapToBeginText || ''}
              placeholder="e.g. Begin Celebration ✨"
              onChange={(e) => updateField('tapToBeginText', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Teddy's Welcome Message</label>
              <TranslateButton value={content.teddyMessage || ''} onTranslated={(t) => updateField('teddyMessage', t)} />
            </div>
            <input
              type="text"
              value={content.teddyMessage || ''}
              placeholder="e.g. Teddy is waiting to walk with you through this story."
              onChange={(e) => updateField('teddyMessage', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
        </div>
      );

    case 'BIRTHDAY_REVEAL':
      return (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Headline</label>
              <TranslateButton value={content.headline || ''} onTranslated={(t) => updateField('headline', t)} />
            </div>
            <input
              type="text"
              value={content.headline || ''}
              placeholder="e.g. Happy 25th Birthday! 🎉"
              onChange={(e) => updateField('headline', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Celebration Greeting</label>
              <TranslateButton value={content.greeting || ''} onTranslated={(t) => updateField('greeting', t)} />
            </div>
            <textarea
              rows={3}
              value={content.greeting || ''}
              placeholder="e.g. Today the spotlight is entirely yours! Wishing you unending joy and wonders."
              onChange={(e) => updateField('greeting', e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Special Milestone Note</label>
              <TranslateButton value={content.specialNote || ''} onTranslated={(t) => updateField('specialNote', t)} />
            </div>
            <input
              type="text"
              value={content.specialNote || ''}
              placeholder="e.g. Here is to another chapter of making unforgettable memories together."
              onChange={(e) => updateField('specialNote', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
        </div>
      );

    case 'LETTER':
      return (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Opening Salutation</label>
              <TranslateButton value={content.openingSalutation || ''} onTranslated={(t) => updateField('openingSalutation', t)} />
            </div>
            <input
              type="text"
              value={content.openingSalutation || ''}
              placeholder="e.g. My Dearest Friend,"
              onChange={(e) => updateField('openingSalutation', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Letter Body</label>
              <TranslateButton value={content.letterBody || ''} onTranslated={(t) => updateField('letterBody', t)} />
            </div>
            <textarea
              rows={8}
              value={content.letterBody || ''}
              placeholder="e.g. As I sit down to write this, I am reminded of all the small moments that made this year so special..."
              onChange={(e) => updateField('letterBody', e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 leading-relaxed font-sans"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Signature</label>
              <TranslateButton value={content.signature || ''} onTranslated={(t) => updateField('signature', t)} />
            </div>
            <input
              type="text"
              value={content.signature || ''}
              placeholder="e.g. With all my love, always"
              onChange={(e) => updateField('signature', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
        </div>
      );

    case 'GIFT':
      return (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Gift Heading</label>
              <TranslateButton value={content.title || ''} onTranslated={(t) => updateField('title', t)} />
            </div>
            <input
              type="text"
              value={content.title || ''}
              placeholder="e.g. A Special Surprise Just For You 🎁"
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Voucher / Ticket Badge</label>
            <input
              type="text"
              value={content.giftVoucherTitle || ''}
              placeholder="e.g. GOLDEN DINNER PASS"
              onChange={(e) => updateField('giftVoucherTitle', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Gift Message / Promise</label>
              <TranslateButton value={content.giftMessage || ''} onTranslated={(t) => updateField('giftMessage', t)} />
            </div>
            <textarea
              rows={3}
              value={content.giftMessage || ''}
              placeholder="e.g. This pass entitles you to any adventure of your choice, completely on me!"
              onChange={(e) => updateField('giftMessage', e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <MediaPickButton
            fieldKey="giftPhotoUrl"
            label="Gift Image (Upload or Paste URL)"
            filterType="image"
            currentUrl={content.giftPhotoUrl}
            placeholder="https://images.unsplash.com/photo-..."
            helpText="Add a photo of the gift or gift pass for the recipient."
          />
        </div>
      );

    case 'SECRET':
      return (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Vault Title</label>
              <TranslateButton value={content.title || ''} onTranslated={(t) => updateField('title', t)} />
            </div>
            <input
              type="text"
              value={content.title || ''}
              placeholder="e.g. The Secret Vault 🔒"
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Clue for Recipient</label>
              <TranslateButton value={content.clue || ''} onTranslated={(t) => updateField('clue', t)} />
            </div>
            <input
              type="text"
              value={content.clue || ''}
              placeholder="e.g. What is the name of the cafe where we first met?"
              onChange={(e) => updateField('clue', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Secret Password (Code)</label>
            <input
              type="text"
              value={content.secretCode || 'teddy'}
              placeholder="e.g. teddy"
              onChange={(e) => updateField('secretCode', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Secret Revelation Text</label>
              <TranslateButton value={content.secretRevealMessage || ''} onTranslated={(t) => updateField('secretRevealMessage', t)} />
            </div>
            <textarea
              rows={3}
              value={content.secretRevealMessage || ''}
              placeholder="e.g. You cracked the code! Here is what was locked away..."
              onChange={(e) => updateField('secretRevealMessage', e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <MediaPickButton
            fieldKey="secretMediaUrl"
            label="Secret Surprise Image / Photo (Upload / URL)"
            filterType="image"
            currentUrl={content.secretMediaUrl}
            placeholder="https://images.unsplash.com/photo-..."
            helpText="Revealed only after the recipient unlocks the secret code!"
          />
        </div>
      );

    case 'MUSIC':
      return (
        <div className="space-y-5">
          {/* Ambient Preset Selector */}
          <div>
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              🎵 Ambient Sound Preset
            </label>
            <p className="text-xs text-stone-500 mb-3">
              Select a built-in ambient loop or paste your own audio URL below.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'piano_lullaby', label: 'Piano Lullaby', desc: 'Soft, gentle ivory keys drifting in warmth', emoji: '🎹' },
                { id: 'acoustic_morning', label: 'Acoustic Morning', desc: 'Strumming guitar, sunlit and nostalgic', emoji: '🎸' },
                { id: 'lofi_dreamy', label: 'Lo-fi Dreamy', desc: 'Smooth lo-fi beats with a cozy vinyl crackle', emoji: '☁️' },
                { id: 'orchestral_cinematic', label: 'Orchestral Cinematic', desc: 'Grand strings for an epic emotional moment', emoji: '🎻' },
                { id: 'jazz_velvet', label: 'Jazz Velvet', desc: 'Intimate jazz piano and muted trumpet', emoji: '🎷' },
                { id: 'custom_url', label: 'Custom Audio URL', desc: 'Paste your own hosted .mp3 or .m4a link', emoji: '🔗' },
              ].map((preset) => {
                const isSelected = (content.ambientPreset || 'piano_lullaby') === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => updateField('ambientPreset', preset.id)}
                    className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-violet-50 border-violet-400 ring-2 ring-violet-400/30 shadow-sm'
                        : 'bg-white border-stone-200 hover:border-violet-300 hover:bg-violet-50/40 shadow-2xs'
                    }`}
                  >
                    <span className="text-xl">{preset.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-stone-900 leading-tight">{preset.label}</h4>
                      <p className="text-[10px] text-stone-500 leading-snug mt-0.5 line-clamp-2">{preset.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
                      isSelected ? 'border-violet-600 bg-violet-600 text-white' : 'border-stone-300 bg-white'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Audio URL */}
          <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/80 space-y-4">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Soundtrack Details</span>
            </h4>
            <div>
              <label className="text-xs font-semibold text-stone-700">Track Title</label>
              <input
                type="text"
                value={content.trackTitle || ''}
                placeholder="e.g. Golden Hour Birthday Symphony"
                onChange={(e) => updateField('trackTitle', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-violet-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700">Artist / Source Name</label>
              <input
                type="text"
                value={content.artist || ''}
                placeholder="e.g. DearYou Ambient Ensemble"
                onChange={(e) => updateField('artist', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-violet-400 focus:outline-none"
              />
            </div>
            <MediaPickButton
              fieldKey="audioUrl"
              label="Custom Audio Track (Upload or Paste URL)"
              filterType="audio"
              currentUrl={content.audioUrl}
              placeholder="https://example.com/birthday-song.mp3"
              helpText="Upload an MP3/WAV/M4A file or paste a public audio URL. Leave blank to use the ambient preset."
            />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-white cursor-pointer hover:border-violet-300 transition">
                <input
                  type="checkbox"
                  checked={content.autoplay || false}
                  onChange={(e) => updateField('autoplay', e.target.checked)}
                  className="w-3.5 h-3.5 accent-violet-600"
                />
                <div>
                  <span className="text-xs font-semibold text-stone-800 block">Auto-play</span>
                  <span className="text-[10px] text-stone-400">Start on page load</span>
                </div>
              </label>
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-white cursor-pointer hover:border-violet-300 transition">
                <input
                  type="checkbox"
                  checked={content.loop !== false}
                  onChange={(e) => updateField('loop', e.target.checked)}
                  className="w-3.5 h-3.5 accent-violet-600"
                />
                <div>
                  <span className="text-xs font-semibold text-stone-800 block">Loop Track</span>
                  <span className="text-[10px] text-stone-400">Repeat continuously</span>
                </div>
              </label>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700">Default Volume (0 – 1.0)</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={content.volume ?? 0.6}
                onChange={(e) => updateField('volume', parseFloat(e.target.value))}
                className="w-full mt-1.5 accent-violet-600"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
                <span>🔇 Muted</span>
                <span className="font-semibold text-stone-600">{Math.round((content.volume ?? 0.6) * 100)}%</span>
                <span>🔊 Max</span>
              </div>
            </div>
          </div>
        </div>
      );

    case 'VOICE':
      return (
        <VoiceNoteEditor
          content={content}
          updateField={updateField}
          experienceId={experienceId}
          moduleId={module._id}
          MediaPickButton={MediaPickButton}
        />
      );

    case 'VIDEO':
      return (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-4">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              🎬 Video Reel Setup
            </h4>
            <p className="text-xs text-stone-500">
              Embed a video greeting or memories montage. The recipient gets a beautiful full-width video player with your caption.
            </p>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Video Title</label>
                <TranslateButton value={content.title || ''} onTranslated={(t) => updateField('title', t)} />
              </div>
              <input
                type="text"
                value={content.title || ''}
                placeholder="e.g. A Birthday Surprise From Your Crew"
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Caption / Description</label>
                <TranslateButton value={content.description || ''} onTranslated={(t) => updateField('description', t)} />
              </div>
              <textarea
                rows={2}
                value={content.description || ''}
                placeholder="e.g. A few clips and smiles recorded just to bring a smile to your face."
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>
            <MediaPickButton
              fieldKey="videoUrl"
              label="Video File or Link (Upload / YouTube / MP4)"
              filterType="video"
              currentUrl={content.videoUrl}
              placeholder="https://www.youtube.com/watch?v=... or .mp4 link"
              helpText="Upload an MP4 video or paste a YouTube / Vimeo / CDN link."
            />
            <MediaPickButton
              fieldKey="thumbnailUrl"
              label="Video Thumbnail / Poster (Upload / URL)"
              filterType="image"
              currentUrl={content.thumbnailUrl}
              placeholder="https://example.com/poster.jpg"
              helpText="Preview cover image shown before the video starts."
            />
            <div>
              <label className="text-xs font-semibold text-stone-700">Duration Label <span className="text-stone-400 font-normal">(e.g. "2:30")</span></label>
              <input
                type="text"
                value={content.duration || ''}
                placeholder="e.g. 1:15"
                onChange={(e) => updateField('duration', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      );

    case 'MINI_GAME': {

      const gameOptions = [
        {
          id: 'BALLOON_POP',
          name: 'Balloon Popper',
          emoji: '🎈',
          badge: 'Fast & Fun',
          tagline: 'Tap colorful floating balloons before time runs out',
          bgGradient: 'from-amber-50 to-orange-50 border-amber-200',
          accent: 'text-amber-700',
        },
        {
          id: 'MEMORY_MATCH',
          name: 'Card Memory Match',
          emoji: '🃏',
          badge: 'Brain Teaser',
          tagline: 'Flip & match pairs of cheerful birthday icons',
          bgGradient: 'from-blue-50 to-indigo-50 border-blue-200',
          accent: 'text-blue-700',
        },
        {
          id: 'BIRTHDAY_QUIZ',
          name: 'Birthday Trivia Quiz',
          emoji: '❓',
          badge: 'Personalized',
          tagline: 'Fun questions celebrating their quirky traits & memories',
          bgGradient: 'from-purple-50 to-pink-50 border-purple-200',
          accent: 'text-purple-700',
        },
        {
          id: 'CATCH_HEARTS',
          name: 'Catch Falling Hearts',
          emoji: '💖',
          badge: 'Gentle & Sweet',
          tagline: 'Catch shimmering love hearts drifting from the top',
          bgGradient: 'from-rose-50 to-red-50 border-rose-200',
          accent: 'text-rose-700',
        },
        {
          id: 'PUZZLE',
          name: 'Memory Tile Puzzle',
          emoji: '🧩',
          badge: 'Interactive',
          tagline: 'Slide and swap scrambled photo tiles into place',
          bgGradient: 'from-emerald-50 to-teal-50 border-emerald-200',
          accent: 'text-emerald-700',
        },
      ];

      const currentGameType = content.gameType || 'BALLOON_POP';

      return (
        <div className="space-y-6">
          {/* Game Selection Grid Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-amber-700" />
                <span>Choose Challenge Mini-Game</span>
              </label>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                5 Interactive Games
              </span>
            </div>
            <p className="text-xs text-stone-500 mb-3">
              Pick the interactive game your recipient will play to unlock celebration surprises.
            </p>

            {/* Interactive Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gameOptions.map((opt) => {
                const isSelected = currentGameType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      const patch: Record<string, any> = {
                        gameType: opt.id,
                        title: `${opt.name} ${opt.emoji}`,
                        instructions: opt.tagline,
                      };
                      if (opt.id === 'BALLOON_POP') patch.targetScore = 8;
                      else if (opt.id === 'CATCH_HEARTS') patch.targetScore = 10;
                      else if (opt.id === 'MEMORY_MATCH') patch.targetScore = 6;
                      else if (opt.id === 'BIRTHDAY_QUIZ') patch.targetScore = (content.questions?.length || 2);
                      else if (opt.id === 'PUZZLE') patch.targetScore = 9;

                      updateFields(patch);
                    }}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-50/90 border-amber-600 ring-2 ring-amber-500/30 shadow-sm'
                        : 'bg-white border-stone-200 hover:border-amber-300 hover:bg-stone-50/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-1.5 rounded-xl bg-stone-100/90 shadow-2xs">
                          {opt.emoji}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-stone-900 leading-tight">
                            {opt.name}
                          </h4>
                          <span className="text-[10px] font-semibold text-stone-400">
                            {opt.badge}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-amber-700 bg-amber-700 text-white'
                            : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                      {opt.tagline}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Game Customization Details */}
          <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/80 space-y-4">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Game Title & Rules</span>
            </h4>

            <div>
              <label className="text-xs font-semibold text-stone-700">Display Game Title</label>
              <input
                type="text"
                value={content.title || ''}
                placeholder="e.g. Birthday Balloon Popper 🎈"
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700">Instructions For Recipient</label>
              <input
                type="text"
                value={content.instructions || ''}
                placeholder="e.g. Pop all balloons to reveal your secret birthday message!"
                onChange={(e) => updateField('instructions', e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-700">Target Score / Goal</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={content.targetScore || 8}
                  onChange={(e) => updateField('targetScore', parseInt(e.target.value) || 8)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700">Completion Reward Text</label>
                <input
                  type="text"
                  value={content.rewardMessage || ''}
                  placeholder="✨ Amazing! You unlocked a special memory!"
                  onChange={(e) => updateField('rewardMessage', e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'MEMORY_MAP': {
      const memories = content.memories || [];
      const updateMemory = (idx: number, patch: any) => {
        const next = [...memories];
        next[idx] = { ...next[idx], ...patch };
        updateField('memories', next);
      };
      const addMemory = () => {
        const newMem = {
          id: `mem_${Date.now()}`,
          title: 'A Special Memory',
          date: 'That Unforgettable Day',
          locationName: 'Our Favorite Spot',
          description: 'Write about what made this memory so unforgettable...',
          photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
          x: Math.floor(20 + Math.random() * 60),
          y: Math.floor(20 + Math.random() * 60),
          color: '#f59e0b',
        };
        updateField('memories', [...memories, newMem]);
      };
      const removeMemory = (idx: number) => {
        updateField('memories', memories.filter((_: any, i: number) => i !== idx));
      };

      return (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>Memory Map Settings</span>
            </h4>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Map Title</label>
                <TranslateButton value={content.title || ''} onTranslated={(t) => updateField('title', t)} />
              </div>
              <input
                type="text"
                value={content.title || ''}
                placeholder="e.g. Memory Map Coordinates"
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Map Description / Subtitle</label>
                <TranslateButton value={content.description || ''} onTranslated={(t) => updateField('description', t)} />
              </div>
              <textarea
                rows={2}
                value={content.description || ''}
                placeholder="e.g. Tap on any memory star below to unlock a cherished moment in time."
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Memory Coordinates ({memories.length})
              </label>
              <button
                type="button"
                onClick={addMemory}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-700 text-white hover:bg-amber-800 text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Memory Pin</span>
              </button>
            </div>

            <div className="space-y-4">
              {memories.map((mem: any, idx: number) => (
                <div key={mem.id || idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      {mem.title || 'Untitled Memory'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMemory(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remove Pin"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600">Memory Title</label>
                      <input
                        type="text"
                        value={mem.title || ''}
                        placeholder="e.g. Stargazing on the Rooftop"
                        onChange={(e) => updateMemory(idx, { title: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600">Date / Season</label>
                      <input
                        type="text"
                        value={mem.date || ''}
                        placeholder="e.g. Autumn Breeze, 2023"
                        onChange={(e) => updateMemory(idx, { date: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600">Location Name</label>
                    <input
                      type="text"
                      value={mem.locationName || ''}
                      placeholder="e.g. The Cozy Corner Cafe"
                      onChange={(e) => updateMemory(idx, { locationName: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600">Story / Description</label>
                    <textarea
                      rows={2}
                      value={mem.description || ''}
                      placeholder="e.g. We talked for four hours straight until the staff gently told us they were closing..."
                      onChange={(e) => updateMemory(idx, { description: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                    />
                  </div>

                  <MediaPickButton
                    fieldKey={`mem_${idx}_photo`}
                    label="Memory Image (Upload / URL)"
                    filterType="image"
                    currentUrl={mem.photoUrl}
                    placeholder="https://images.unsplash.com/photo-..."
                    onDirectUpdate={(url) => updateMemory(idx, { photoUrl: url })}
                  />

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-stone-500">Horizontal Position ({mem.x ?? 50}%)</label>
                      <input
                        type="range"
                        min={10}
                        max={90}
                        value={mem.x ?? 50}
                        onChange={(e) => updateMemory(idx, { x: parseInt(e.target.value) })}
                        className="w-full accent-amber-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-stone-500">Vertical Position ({mem.y ?? 50}%)</label>
                      <input
                        type="range"
                        min={10}
                        max={90}
                        value={mem.y ?? 50}
                        onChange={(e) => updateMemory(idx, { y: parseInt(e.target.value) })}
                        className="w-full accent-amber-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'UNIVERSE': {
      const objects = content.objects || [];
      const updateObject = (idx: number, patch: any) => {
        const next = [...objects];
        next[idx] = { ...next[idx], ...patch };
        updateField('objects', next);
      };
      const addObject = () => {
        const newObj = {
          id: `obj_${Date.now()}`,
          label: 'New Memory Star',
          type: 'STAR',
          x: Math.floor(20 + Math.random() * 60),
          y: Math.floor(20 + Math.random() * 60),
          size: 32,
          color: '#fbbf24',
          message: 'May this year be filled with unforgettable wonders.',
        };
        updateField('objects', [...objects, newObj]);
      };
      const removeObject = (idx: number) => {
        updateField('objects', objects.filter((_: any, i: number) => i !== idx));
      };

      return (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-700" />
              <span>Interactive Universe Settings</span>
            </h4>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Universe Title</label>
                <TranslateButton value={content.title || ''} onTranslated={(t) => updateField('title', t)} />
              </div>
              <input
                type="text"
                value={content.title || ''}
                placeholder="e.g. Interactive Universe"
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Intro / Instruction Message</label>
                <TranslateButton value={content.introMessage || ''} onTranslated={(t) => updateField('introMessage', t)} />
              </div>
              <textarea
                rows={2}
                value={content.introMessage || ''}
                placeholder="e.g. Drag your finger or mouse to glide through your personal galaxy. Tap stars and memory orbs..."
                onChange={(e) => updateField('introMessage', e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Celestial Objects & Orbs ({objects.length})
              </label>
              <button
                type="button"
                onClick={addObject}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-700 text-white hover:bg-indigo-800 text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Celestial Object</span>
              </button>
            </div>

            <div className="space-y-4">
              {objects.map((obj: any, idx: number) => (
                <div key={obj.id || idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-900 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      {obj.label || 'Celestial Object'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeObject(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remove Object"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600">Object Label</label>
                      <input
                        type="text"
                        value={obj.label || ''}
                        placeholder="e.g. Star of Kindness"
                        onChange={(e) => updateObject(idx, { label: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600">Object Type</label>
                      <select
                        value={obj.type || 'STAR'}
                        onChange={(e) => updateObject(idx, { type: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                      >
                        <option value="STAR">⭐ Star</option>
                        <option value="PLANET">🪐 Planet</option>
                        <option value="MEMORY_ORB">🔮 Memory Orb</option>
                        <option value="TEDDY_SATELLITE">🧸 Teddy Satellite</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-stone-600">Revealed Message</label>
                      <TranslateButton
                        value={obj.message || ''}
                        onTranslated={(t) => updateObject(idx, { message: t })}
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={obj.message || ''}
                      placeholder="e.g. Your generosity touches people in ways you rarely see."
                      onChange={(e) => updateObject(idx, { message: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                    />
                  </div>

                  <MediaPickButton
                    fieldKey={`obj_${idx}_photo`}
                    label="Memory Orb Image (Optional)"
                    filterType="image"
                    currentUrl={obj.photoUrl}
                    placeholder="https://images.unsplash.com/photo-..."
                    onDirectUpdate={(url) => updateObject(idx, { photoUrl: url })}
                  />

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-stone-500">Horizontal ({obj.x ?? 50}%)</label>
                      <input
                        type="range"
                        min={10}
                        max={90}
                        value={obj.x ?? 50}
                        onChange={(e) => updateObject(idx, { x: parseInt(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-stone-500">Vertical ({obj.y ?? 50}%)</label>
                      <input
                        type="range"
                        min={10}
                        max={90}
                        value={obj.y ?? 50}
                        onChange={(e) => updateObject(idx, { y: parseInt(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'PUZZLE': {
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-4">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Puzzle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Puzzle Challenge Setup</span>
            </h4>
            <p className="text-xs text-stone-500">
              Your recipient will unscramble a 3×3 photo puzzle to reveal a cherished memory photo!
            </p>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Puzzle Game Title</label>
                <TranslateButton value={content.title || ''} onTranslated={(t) => updateField('title', t)} />
              </div>
              <input
                type="text"
                value={content.title || ''}
                placeholder="e.g. Memory Puzzle Challenge"
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Instructions For Recipient</label>
                <TranslateButton value={content.instructions || ''} onTranslated={(t) => updateField('instructions', t)} />
              </div>
              <input
                type="text"
                value={content.instructions || ''}
                placeholder="e.g. Tap and swap the tiles to reconstruct the picture!"
                onChange={(e) => updateField('instructions', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <MediaPickButton
              fieldKey="puzzleImageUrl"
              label="Puzzle Photo (Upload or Paste URL)"
              filterType="image"
              currentUrl={content.puzzleImageUrl}
              placeholder="https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800"
              helpText="Upload a picture of you two, a smile, or a birthday memory to be scrambled into the puzzle."
            />

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Completion Reward Message</label>
                <TranslateButton value={content.rewardMessage || ''} onTranslated={(t) => updateField('rewardMessage', t)} />
              </div>
              <input
                type="text"
                value={content.rewardMessage || ''}
                placeholder="e.g. 🎉 Puzzle solved! Every piece of our memory fits together perfectly."
                onChange={(e) => updateField('rewardMessage', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      );
    }

    case 'THINGS_NEVER_SAID': {
      const items = content.items || [];
      const updateItem = (idx: number, patch: any) => {
        const next = [...items];
        next[idx] = { ...next[idx], ...patch };
        updateField('items', next);
      };
      const addItem = () => {
        const newItem = {
          id: `t_${Date.now()}`,
          topic: 'A Quiet Truth',
          confession: 'Write a gentle confession or memory you rarely talk about...',
          revealText: 'Write what you want them to know from the bottom of your heart...',
        };
        updateField('items', [...items, newItem]);
      };
      const removeItem = (idx: number) => {
        updateField('items', items.filter((_: any, i: number) => i !== idx));
      };

      return (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Things I've Never Said</span>
            </h4>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Module Title</label>
                <TranslateButton value={content.title || ''} onTranslated={(t) => updateField('title', t)} />
              </div>
              <input
                type="text"
                value={content.title || ''}
                placeholder="e.g. Things I've Never Said Out Loud"
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Introduction Note</label>
                <TranslateButton value={content.intro || ''} onTranslated={(t) => updateField('intro', t)} />
              </div>
              <textarea
                rows={2}
                value={content.intro || ''}
                placeholder="e.g. Sometimes life moves fast and we forget to speak the truths that matter most..."
                onChange={(e) => updateField('intro', e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Confession Cards ({items.length})
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-700 text-white hover:bg-amber-800 text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Card</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item: any, idx: number) => (
                <div key={item.id || idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      {item.topic || 'Card Topic'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remove Card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600">Card Topic / Badge</label>
                    <input
                      type="text"
                      value={item.topic || ''}
                      placeholder="e.g. How you inspire me"
                      onChange={(e) => updateItem(idx, { topic: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-stone-600">Front Confession</label>
                      <TranslateButton value={item.confession || ''} onTranslated={(t) => updateItem(idx, { confession: t })} />
                    </div>
                    <textarea
                      rows={2}
                      value={item.confession || ''}
                      placeholder="e.g. Whenever you handle tough times with such grace, I quietly take notes..."
                      onChange={(e) => updateItem(idx, { confession: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-stone-600">Revealed Secret Truth</label>
                      <TranslateButton value={item.revealText || ''} onTranslated={(t) => updateItem(idx, { revealText: t })} />
                    </div>
                    <textarea
                      rows={2}
                      value={item.revealText || ''}
                      placeholder="e.g. Your resilience has given me courage more times than you will ever realize."
                      onChange={(e) => updateItem(idx, { revealText: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'INSIDE_JOKES': {
      const jokes = content.jokes || [];
      const updateJoke = (idx: number, patch: any) => {
        const next = [...jokes];
        next[idx] = { ...next[idx], ...patch };
        updateField('jokes', next);
      };
      const addJoke = () => {
        const newJoke = {
          id: `j_${Date.now()}`,
          title: 'The Great Shenanigan',
          setup: '“Remember when...”',
          punchline: 'And that is how we ended up laughing until we cried.',
          emoji: '🎭',
        };
        updateField('jokes', [...jokes, newJoke]);
      };
      const removeJoke = (idx: number) => {
        updateField('jokes', jokes.filter((_: any, i: number) => i !== idx));
      };

      return (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Inside Joke Vault</span>
            </h4>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Module Title</label>
                <TranslateButton value={content.title || ''} onTranslated={(t) => updateField('title', t)} />
              </div>
              <input
                type="text"
                value={content.title || ''}
                placeholder="e.g. The Inside Joke Archive 🎭"
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Intro Note</label>
                <TranslateButton value={content.intro || ''} onTranslated={(t) => updateField('intro', t)} />
              </div>
              <textarea
                rows={2}
                value={content.intro || ''}
                placeholder="e.g. If anyone else reads this, they will be utterly bewildered..."
                onChange={(e) => updateField('intro', e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Inside Jokes ({jokes.length})
              </label>
              <button
                type="button"
                onClick={addJoke}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-700 text-white hover:bg-amber-800 text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Joke</span>
              </button>
            </div>

            <div className="space-y-4">
              {jokes.map((j: any, idx: number) => (
                <div key={j.id || idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <span className="text-lg">{j.emoji || '🎭'}</span>
                      {j.title || 'Untitled Joke'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeJoke(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remove Joke"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-1">
                      <label className="text-[11px] font-semibold text-stone-600">Emoji</label>
                      <input
                        type="text"
                        value={j.emoji || ''}
                        placeholder="🎭"
                        onChange={(e) => updateJoke(idx, { emoji: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800 text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[11px] font-semibold text-stone-600">Joke Title</label>
                      <input
                        type="text"
                        value={j.title || ''}
                        placeholder="e.g. The 5-Minute Quick Catchup"
                        onChange={(e) => updateJoke(idx, { title: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-stone-600">Setup / The Story</label>
                      <TranslateButton value={j.setup || ''} onTranslated={(t) => updateJoke(idx, { setup: t })} />
                    </div>
                    <textarea
                      rows={2}
                      value={j.setup || ''}
                      placeholder="e.g. “I only have 5 minutes to talk today, seriously!”"
                      onChange={(e) => updateJoke(idx, { setup: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-stone-600">Punchline (Revealed on Tap)</label>
                      <TranslateButton value={j.punchline || ''} onTranslated={(t) => updateJoke(idx, { punchline: t })} />
                    </div>
                    <textarea
                      rows={2}
                      value={j.punchline || ''}
                      placeholder="e.g. Cut to 3 hours and 42 minutes later, debating whether penguins have knees."
                      onChange={(e) => updateJoke(idx, { punchline: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg border border-stone-300 text-xs bg-white text-stone-800 font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'PEOPLE': {
      const wishes = content.wishes || [];
      const updateWish = (idx: number, patch: any) => {
        const next = [...wishes];
        next[idx] = { ...next[idx], ...patch };
        updateField('wishes', next);
      };
      const addWish = () => {
        const newWish = {
          id: `w_${Date.now()}`,
          name: 'Friend',
          relationship: 'Best Friend',
          message: 'Happy Birthday! Wishing you a magnificent year ahead!',
          createdAt: 'Today',
        };
        updateField('wishes', [...wishes, newWish]);
      };
      const removeWish = (idx: number) => {
        updateField('wishes', wishes.filter((_: any, i: number) => i !== idx));
      };

      return (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Words From The Circle</span>
            </h4>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Module Heading</label>
                <TranslateButton value={content.title || ''} onTranslated={(t) => updateField('title', t)} />
              </div>
              <input
                type="text"
                value={content.title || ''}
                placeholder="e.g. Words from Your Circle 💕"
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Subtitle</label>
                <TranslateButton value={content.subtitle || ''} onTranslated={(t) => updateField('subtitle', t)} />
              </div>
              <input
                type="text"
                value={content.subtitle || ''}
                placeholder="e.g. People who care about you took a moment to leave their birthday blessings."
                onChange={(e) => updateField('subtitle', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Wishes & Messages ({wishes.length})
              </label>
              <button
                type="button"
                onClick={addWish}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-700 text-white hover:bg-amber-800 text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Wish</span>
              </button>
            </div>

            <div className="space-y-4">
              {wishes.map((w: any, idx: number) => {
                const rawUrl = w.mediaUrl || w.media?.url || (typeof w.media === 'string' ? w.media : null);
                const mediaUrl = rawUrl ? getMediaUrl(rawUrl) : null;
                const isVideo = w.type === 'video' || (Boolean(mediaUrl) && /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(mediaUrl));

                return (
                  <div key={w.id || idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <span>{w.name || 'Friend'} ({w.relationship || 'Wish'})</span>
                        {w.contributionId && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-medium">
                            Contributor Wish
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeWish(idx)}
                        className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove Wish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-stone-600">Sender Name</label>
                        <input
                          type="text"
                          value={w.name || ''}
                          placeholder="e.g. Maya"
                          onChange={(e) => updateWish(idx, { name: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-stone-600">Relationship</label>
                        <input
                          type="text"
                          value={w.relationship || ''}
                          placeholder="e.g. College Bestie"
                          onChange={(e) => updateWish(idx, { relationship: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-stone-600">Heartfelt Message</label>
                        <TranslateButton value={w.message || ''} onTranslated={(t) => updateWish(idx, { message: t })} />
                      </div>
                      <textarea
                        rows={3}
                        value={w.message || ''}
                        placeholder="e.g. Happy Birthday sunshine! Never change your goofy energy..."
                        onChange={(e) => updateWish(idx, { message: e.target.value })}
                        className="w-full mt-1 p-2 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                      />
                    </div>

                    {/* Attached Photo or Video preview */}
                    {mediaUrl && (
                      <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {isVideo ? (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                              <Video className="w-4 h-4 text-amber-700" />
                              <span>Attached Video</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <img
                                src={mediaUrl}
                                alt="Attached preview"
                                className="w-12 h-12 object-cover rounded-lg border border-amber-300 cursor-pointer hover:opacity-90"
                                onClick={() => window.open(mediaUrl, '_blank')}
                              />
                              <span className="text-xs font-semibold text-amber-900">Attached Photo</span>
                            </div>
                          )}
                        </div>
                        <a
                          href={mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline"
                        >
                          Preview
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    case 'STORY': {
      const milestones = content.milestones || [];
      const updateMilestone = (idx: number, patch: any) => {
        const next = [...milestones];
        next[idx] = { ...next[idx], ...patch };
        updateField('milestones', next);
      };
      const addMilestone = () => {
        const newM = {
          id: `s_${Date.now()}`,
          dateOrYear: `Chapter ${milestones.length + 1}`,
          title: 'A New Chapter',
          description: 'Describe a significant turning point, trip, or memory...',
        };
        updateField('milestones', [...milestones, newM]);
      };
      const removeMilestone = (idx: number) => {
        updateField('milestones', milestones.filter((_: any, i: number) => i !== idx));
      };

      return (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>Our Story Timeline</span>
            </h4>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Timeline Title</label>
                <TranslateButton value={content.title || ''} onTranslated={(t) => updateField('title', t)} />
              </div>
              <input
                type="text"
                value={content.title || ''}
                placeholder="e.g. The Journey So Far 📖"
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Intro / Subtitle</label>
                <TranslateButton value={content.intro || ''} onTranslated={(t) => updateField('intro', t)} />
              </div>
              <textarea
                rows={2}
                value={content.intro || ''}
                placeholder="e.g. A chapter-by-chapter look at how we grew together through the seasons."
                onChange={(e) => updateField('intro', e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Chapters & Milestones ({milestones.length})
              </label>
              <button
                type="button"
                onClick={addMilestone}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-700 text-white hover:bg-amber-800 text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Chapter</span>
              </button>
            </div>

            <div className="space-y-4">
              {milestones.map((m: any, idx: number) => (
                <div key={m.id || idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">
                      {m.dateOrYear || `Chapter ${idx + 1}`} • {m.title || 'Untitled'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMilestone(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remove Chapter"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600">Chapter / Time Period</label>
                      <input
                        type="text"
                        value={m.dateOrYear || ''}
                        placeholder="e.g. Chapter 1: The First Hello"
                        onChange={(e) => updateMilestone(idx, { dateOrYear: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600">Chapter Title</label>
                      <input
                        type="text"
                        value={m.title || ''}
                        placeholder="e.g. Two Strangers Crossing Paths"
                        onChange={(e) => updateMilestone(idx, { title: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-stone-600">Narrative Story</label>
                      <TranslateButton value={m.description || ''} onTranslated={(t) => updateMilestone(idx, { description: t })} />
                    </div>
                    <textarea
                      rows={3}
                      value={m.description || ''}
                      placeholder="e.g. Neither of us knew that a brief conversation would spark years of inside jokes..."
                      onChange={(e) => updateMilestone(idx, { description: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'FUTURE_WISHES': {
      const wishes = content.wishes || [];
      const updateWish = (idx: number, patch: any) => {
        const next = [...wishes];
        next[idx] = { ...next[idx], ...patch };
        updateField('wishes', next);
      };
      const addWish = () => {
        const newWish = {
          id: `fw_${Date.now()}`,
          category: 'Adventure',
          wish: 'Write an adventure, dream trip, or promise for the years ahead...',
          targetYear: 'This Year',
        };
        updateField('wishes', [...wishes, newWish]);
      };
      const removeWish = (idx: number) => {
        updateField('wishes', wishes.filter((_: any, i: number) => i !== idx));
      };

      return (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-700" />
              <span>Future Wishes & Bucket List</span>
            </h4>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Module Heading</label>
                <TranslateButton value={content.title || ''} onTranslated={(t) => updateField('title', t)} />
              </div>
              <input
                type="text"
                value={content.title || ''}
                placeholder="e.g. Wishes For The Years Ahead 🌠"
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Subtitle</label>
                <TranslateButton value={content.subtitle || ''} onTranslated={(t) => updateField('subtitle', t)} />
              </div>
              <input
                type="text"
                value={content.subtitle || ''}
                placeholder="e.g. Things I hope we do, places we will see, and milestones you will conquer."
                onChange={(e) => updateField('subtitle', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Future Bucket List ({wishes.length})
              </label>
              <button
                type="button"
                onClick={addWish}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-700 text-white hover:bg-amber-800 text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Future Wish</span>
              </button>
            </div>

            <div className="space-y-4">
              {wishes.map((w: any, idx: number) => (
                <div key={w.id || idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">
                      {w.category || 'Wish'} {w.targetYear ? `• ${w.targetYear}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeWish(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remove Wish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600">Category Tag</label>
                      <input
                        type="text"
                        value={w.category || ''}
                        placeholder="e.g. Trip & Adventure"
                        onChange={(e) => updateWish(idx, { category: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600">Target Timeline</label>
                      <input
                        type="text"
                        value={w.targetYear || ''}
                        placeholder="e.g. This Year, or By 2026"
                        onChange={(e) => updateWish(idx, { targetYear: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-stone-600">Wish & Promise</label>
                      <TranslateButton value={w.wish || ''} onTranslated={(t) => updateWish(idx, { wish: t })} />
                    </div>
                    <textarea
                      rows={2}
                      value={w.wish || ''}
                      placeholder="e.g. Visit that mountain cabin and wake up to the sunrise with hot cider."
                      onChange={(e) => updateWish(idx, { wish: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'FINAL_REVEAL': {
      const photos = content.photoGallery || [];
      const updatePhoto = (idx: number, url: string) => {
        const next = [...photos];
        next[idx] = url;
        updateField('photoGallery', next);
      };
      const addPhoto = () => {
        updateField('photoGallery', [
          ...photos,
          'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
        ]);
      };
      const removePhoto = (idx: number) => {
        updateField('photoGallery', photos.filter((_: any, i: number) => i !== idx));
      };

      return (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-4">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Grand Climax & Benediction</span>
            </h4>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Climax Title</label>
                <TranslateButton value={content.title || ''} onTranslated={(t) => updateField('title', t)} />
              </div>
              <input
                type="text"
                value={content.title || ''}
                placeholder="e.g. You Have Unlocked The Whole Journey ✨"
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Grand Benediction Message</label>
                <TranslateButton value={content.grandMessage || ''} onTranslated={(t) => updateField('grandMessage', t)} />
              </div>
              <textarea
                rows={4}
                value={content.grandMessage || ''}
                placeholder="e.g. Thank you for stepping into this little universe created for you. As you blow out your candles today..."
                onChange={(e) => updateField('grandMessage', e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-700">Signature</label>
                  <TranslateButton value={content.signature || ''} onTranslated={(t) => updateField('signature', t)} />
                </div>
                <input
                  type="text"
                  value={content.signature || ''}
                  placeholder="e.g. Created with all my heart, always."
                  onChange={(e) => updateField('signature', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700">Teddy Mascot Wisdom</label>
                <input
                  type="text"
                  value={content.specialTeddyWisdom || ''}
                  placeholder="e.g. Teddy says: 'You found 100% of the memories!'"
                  onChange={(e) => updateField('specialTeddyWisdom', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-stone-700">Memory Photo Gallery ({photos.length})</label>
                <button
                  type="button"
                  onClick={addPhoto}
                  className="text-xs px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-semibold hover:bg-amber-200 cursor-pointer"
                >
                  + Add Photo
                </button>
              </div>
              <div className="space-y-3">
                {photos.map((photoUrl: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-600">Photo {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <MediaPickButton
                      fieldKey={`gallery_${idx}`}
                      label=""
                      filterType="image"
                      currentUrl={photoUrl}
                      placeholder="https://example.com/photo.jpg"
                      onDirectUpdate={(url) => updatePhoto(idx, url)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="space-y-3">
          <p className="text-xs text-stone-500">Edit fields for {module.type}:</p>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Module Title</label>
              <TranslateButton value={content.title || ''} onTranslated={(t) => updateField('title', t)} />
            </div>
            <input
              type="text"
              value={content.title || ''}
              placeholder="Module Title"
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">Description / Note</label>
              <TranslateButton
                value={content.description || content.intro || ''}
                onTranslated={(t) => updateField(content.description !== undefined ? 'description' : 'intro', t)}
              />
            </div>
            <textarea
              rows={3}
              value={content.description || content.intro || ''}
              placeholder="Enter note or description..."
              onChange={(e) => updateField(content.description !== undefined ? 'description' : 'intro', e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
        </div>
      );
  }
};

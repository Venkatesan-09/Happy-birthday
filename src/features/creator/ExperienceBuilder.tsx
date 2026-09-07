import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Experience, ExperienceModule, ModuleType } from '../../types';
import { api } from '../../services/api';
import { createDefaultModule, DEFAULT_THEMES } from '../../data/defaults';
import { TeddyMascot } from '../../components/TeddyMascot';
import { ExperienceRenderer } from '../recipient/ExperienceRenderer';
import { ModuleLibraryModal } from './ModuleLibraryModal';
import { AIAssistantModal } from './AIAssistantModal';
import { ShareModal } from './ShareModal';
import { VersionHistoryModal } from './VersionHistoryModal';
import { ContributorsManager } from './ContributorsManager';

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
        alert('Please complete all required fields before publishing.');
        setIsPublishing(false);
        return;
      }
      await api.experiences.publish(experience._id);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      await loadExperience();
      setIsShareOpen(true);
    } catch (err) {
      console.error(err);
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
                  experience.status === 'PUBLISHED'
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVersionsOpen(true)}
            className="p-2 rounded-xl text-stone-600 hover:bg-stone-100 cursor-pointer"
            title="Version Snapshots"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsShareOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share & QR</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-4 py-2 rounded-xl bg-amber-700 text-white hover:bg-amber-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
          </button>
        </div>
      </header>

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

// Module Form Inspector for editing content fields
const ModuleFormInspector: React.FC<{
  module: ExperienceModule;
  recipientName?: string;
  onChange: (content: any) => void;
}> = ({ module, recipientName = 'Friend', onChange }) => {
  const content = module.content || {};

  const updateField = (key: string, value: any) => {
    onChange({ ...content, [key]: value });
  };

  switch (module.type) {
    case 'CINEMATIC_OPENING':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-700">Display Heading</label>
            <input
              type="text"
              value={content.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Opening Subtitle</label>
            <input
              type="text"
              value={content.subtitle || ''}
              onChange={(e) => updateField('subtitle', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Philosophical / Poetic Quote</label>
            <textarea
              rows={2}
              value={content.quote || ''}
              onChange={(e) => updateField('quote', e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">CTA Button Text</label>
            <input
              type="text"
              value={content.tapToBeginText || ''}
              onChange={(e) => updateField('tapToBeginText', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
        </div>
      );

    case 'BIRTHDAY_REVEAL':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-700">Headline</label>
            <input
              type="text"
              value={content.headline || ''}
              onChange={(e) => updateField('headline', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Celebration Greeting</label>
            <textarea
              rows={3}
              value={content.greeting || ''}
              onChange={(e) => updateField('greeting', e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Special Milestone Note</label>
            <input
              type="text"
              value={content.specialNote || ''}
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
            <label className="text-xs font-semibold text-stone-700">Opening Salutation</label>
            <input
              type="text"
              value={content.openingSalutation || ''}
              onChange={(e) => updateField('openingSalutation', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Letter Body</label>
            <textarea
              rows={8}
              value={content.letterBody || ''}
              onChange={(e) => updateField('letterBody', e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800 leading-relaxed font-sans"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Signature</label>
            <input
              type="text"
              value={content.signature || ''}
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
            <label className="text-xs font-semibold text-stone-700">Gift Heading</label>
            <input
              type="text"
              value={content.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Voucher / Ticket Badge</label>
            <input
              type="text"
              value={content.giftVoucherTitle || ''}
              onChange={(e) => updateField('giftVoucherTitle', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Gift Message / Promise</label>
            <textarea
              rows={3}
              value={content.giftMessage || ''}
              onChange={(e) => updateField('giftMessage', e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Gift Image URL (Optional)</label>
            <input
              type="text"
              value={content.giftPhotoUrl || ''}
              onChange={(e) => updateField('giftPhotoUrl', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
        </div>
      );

    case 'SECRET':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-700">Vault Title</label>
            <input
              type="text"
              value={content.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Clue for Recipient</label>
            <input
              type="text"
              value={content.clue || ''}
              onChange={(e) => updateField('clue', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Secret Password (Code)</label>
            <input
              type="text"
              value={content.secretCode || 'teddy'}
              onChange={(e) => updateField('secretCode', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Secret Revelation Text</label>
            <textarea
              rows={3}
              value={content.secretRevealMessage || ''}
              onChange={(e) => updateField('secretRevealMessage', e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
        </div>
      );

    case 'MINI_GAME':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-700">Challenge Game Type</label>
            <select
              value={content.gameType || 'BALLOON_POP'}
              onChange={(e) => updateField('gameType', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            >
              <option value="BALLOON_POP">Birthday Balloon Popper 🎈</option>
              <option value="MEMORY_MATCH">Memory Matching Cards 🃏</option>
              <option value="BIRTHDAY_QUIZ">Birthday Trivia Quiz ❓</option>
              <option value="CATCH_HEARTS">Catch Floating Hearts 💖</option>
              <option value="PUZZLE">Memory Tile Puzzle 🧩</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Game Title</label>
            <input
              type="text"
              value={content.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Completion Reward Message</label>
            <input
              type="text"
              value={content.rewardMessage || ''}
              onChange={(e) => updateField('rewardMessage', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-3">
          <p className="text-xs text-stone-500">Edit fields for {module.type}:</p>
          <div>
            <label className="text-xs font-semibold text-stone-700">Module Title</label>
            <input
              type="text"
              value={content.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700">Description / Note</label>
            <textarea
              rows={3}
              value={content.description || content.intro || ''}
              onChange={(e) => updateField(content.description !== undefined ? 'description' : 'intro', e.target.value)}
              className="w-full mt-1 p-3 rounded-xl border border-stone-300 text-xs bg-white text-stone-800"
            />
          </div>
        </div>
      );
  }
};

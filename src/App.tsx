import React, { useState, useEffect } from 'react';
import { CreatorDashboard } from './features/creator/CreatorDashboard';
import { ExperienceWizard } from './features/creator/ExperienceWizard';
import { ExperienceBuilder } from './features/creator/ExperienceBuilder';
import { PublicRecipientView } from './features/recipient/PublicRecipientView';
import { ContributorSubmissionView } from './features/contributor/ContributorSubmissionView';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeExperienceId, setActiveExperienceId] = useState<string | null>(null);
  const [creatorMode, setCreatorMode] = useState<'dashboard' | 'wizard' | 'studio'>('dashboard');

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Route 1: Recipient Experience `/birthday/:slug`
  if (currentPath.startsWith('/birthday/')) {
    const slug = currentPath.replace('/birthday/', '').split('/')[0];
    return <PublicRecipientView slug={slug} onExit={() => navigateTo('/')} />;
  }

  // Route 2: Contributor Submission `/contribute/:token`
  if (currentPath.startsWith('/contribute/')) {
    const token = currentPath.replace('/contribute/', '').split('/')[0];
    return <ContributorSubmissionView token={token} onExit={() => navigateTo('/')} />;
  }

  // Route 3: Creator Application
  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#2c2623] selection:bg-amber-200 selection:text-amber-950 font-jakarta">
      {creatorMode === 'wizard' && (
        <ExperienceWizard
          onCancel={() => setCreatorMode('dashboard')}
          onCreated={(id) => {
            setActiveExperienceId(id);
            setCreatorMode('studio');
          }}
        />
      )}

      {creatorMode === 'studio' && activeExperienceId && (
        <ExperienceBuilder
          experienceId={activeExperienceId}
          onBack={() => {
            setCreatorMode('dashboard');
            setActiveExperienceId(null);
          }}
          onViewPublic={(slug) => {
            navigateTo(`/birthday/${slug}`);
          }}
        />
      )}

      {creatorMode === 'dashboard' && (
        <CreatorDashboard
          onCreateNew={() => setCreatorMode('wizard')}
          onOpenExperience={(id) => {
            setActiveExperienceId(id);
            setCreatorMode('studio');
          }}
        />
      )}
    </div>
  );
}

/**
 * Standalone recipient entry point — completely isolated from the main app.
 * No React Router, no auth state, no ProtectedRoute, no redirects.
 * Just mounts PublicRecipientView directly with the slug from the URL.
 *
 * Served at: /r/:slug
 * URL format: https://domain.com/r/shalini-dc427a
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { PublicRecipientView } from './features/recipient/PublicRecipientView';
import './index.css';

// Extract slug from the URL path /r/:slug
const pathParts = window.location.pathname.split('/').filter(Boolean);
// pathParts[0] = 'r', pathParts[1] = slug
const slug = pathParts[1] || pathParts[0] || '';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <React.StrictMode>
      {slug ? (
        <PublicRecipientView slug={slug} />
      ) : (
        <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-center">
          <p className="text-stone-500 text-sm">Birthday experience not found.</p>
        </div>
      )}
    </React.StrictMode>
  );
}

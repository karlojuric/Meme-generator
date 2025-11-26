import { id } from '@instantdb/react';
import { useMemo, useState } from 'react';

import './App.css';
import AppHeader from './components/AppHeader.jsx';
import AuthModal from './components/AuthModal.jsx';
import MemeFeed from './components/MemeFeed.jsx';
import MemeStudio from './components/MemeStudio.jsx';
import { db } from './lib/instant.js';

const parseErrorResponse = async (response) => {
  try {
    const data = await response.clone().json();
    return data?.error ?? null;
  } catch (_jsonErr) {
    try {
      const text = await response.clone().text();
      return text || null;
    } catch (_textErr) {
      return null;
    }
  }
};

function App() {
  const auth = db.useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [toast, setToast] = useState(null);
  const [votingId, setVotingId] = useState(null);

  const memeQuery = db.useQuery({
    memes: {
      $: {
        order: { createdAt: 'desc' },
        limit: 24,
      },
    },
  });

  const votesQuery = db.useQuery(
    auth.user
      ? {
          votes: {
            $: {
              where: {
                userId: auth.user.id,
              },
            },
          },
        }
      : null,
  );

  const memes = memeQuery.data?.memes ?? [];

  const votedIds = useMemo(() => {
    const ids = votesQuery?.data?.votes?.map((vote) => vote.memeId) ?? [];
    return new Set(ids);
  }, [votesQuery.data]);

  const showToast = (payload) => {
    setToast(payload);
    if (payload) {
      setTimeout(() => setToast(null), 4000);
    }
  };

  const publishMeme = async ({ title, description, canvasState, blob }) => {
    if (!auth.user) {
      setShowAuthModal(true);
      throw new Error('Please sign in to post a meme.');
    }
    setIsPublishing(true);
    try {
      const fileId = id();
      const path = `memes/${auth.user.id}/${fileId}.png`;
      const file = new File([blob], `meme-${fileId}.png`, {
        type: 'image/png',
      });

      await db.storage.uploadFile(path, file, {
        contentDisposition: `inline; filename="${file.name}"`,
      });

      let imageUrl = '';
      try {
        const fileMeta = await db.queryOnce({
          $files: { $: { where: { path }, limit: 1 } },
        });
        imageUrl = fileMeta?.data?.$files?.[0]?.url ?? '';
      } catch (metaError) {
        console.warn('Unable to load file metadata', metaError);
      }

      const response = await fetch('/api/memes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          imagePath: path,
          imageUrl,
          authorId: auth.user.id,
          authorEmail: auth.user.email || '',
          canvasState: JSON.stringify(canvasState ?? {}),
        }),
      });

      if (!response.ok) {
        const message =
          (await parseErrorResponse(response)) || 'Server error';
        throw new Error(message);
      }

      window.memeEditor?.reset();
      showToast({ type: 'success', text: 'Meme published!' });
    } catch (error) {
      console.error(error);
      showToast({
        type: 'error',
        text: error?.message || 'Failed to publish meme.',
      });
      throw error;
    } finally {
      setIsPublishing(false);
    }
  };

  const upvoteMeme = async (meme) => {
    if (!auth.user) {
      setShowAuthModal(true);
      return;
    }
    setVotingId(meme.id);
    try {
      const response = await fetch(`/api/memes/${meme.id}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId: auth.user.id }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          showToast({ type: 'info', text: 'You already upvoted this meme.' });
          return;
        }
        const message =
          (await parseErrorResponse(response)) ||
          'Server error while upvoting.';
        throw new Error(message);
      }
    } catch (error) {
      console.error('Failed to upvote meme', error);
      showToast({
        type: 'error',
        text: 'Unable to record your upvote right now.',
      });
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="app-shell">
      <AppHeader onShowAuth={() => setShowAuthModal(true)} />
      <MemeStudio onPublish={publishMeme} isPublishing={isPublishing} />
      <MemeFeed
        memes={memes}
        isLoading={memeQuery.isLoading}
        onUpvote={upvoteMeme}
        emptyState="No memes yet. Be the first to create one!"
        votingId={votingId}
        votedIds={votedIds}
      />

      {toast && (
        <div className={`toast ${toast.type}`}>
          <p>{toast.text}</p>
        </div>
      )}

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

export default App;

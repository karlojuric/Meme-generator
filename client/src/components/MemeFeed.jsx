import { useEffect, useMemo, useState } from "react";

import { db } from "../lib/instant.js";

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "";
  const delta = Date.now() - timestamp;
  const minutes = Math.floor(delta / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const useFileUrl = (path, initialUrl) => {
  const [url, setUrl] = useState(initialUrl || "");

  useEffect(() => {
    if (!path || initialUrl) return;
    let cancelled = false;
    const run = async () => {
      try {
        const response = await db.storage.getDownloadUrl(path);
        const normalized =
          typeof response === "string"
            ? response
            : response?.url || response?.signedUrl || response?.signed_url;
        if (!cancelled && normalized) {
          setUrl(normalized);
        }
      } catch (error) {
        console.error("Unable to fetch download url", error);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [path, initialUrl]);

  return url || initialUrl || "";
};

const MemeCard = ({ meme, isVoting, hasVoted, onVote, onReedit }) => {
  const resolvedUrl = useFileUrl(meme.imagePath, meme.imageUrl);

  return (
    <article className="meme-card">
      <div className="meme-image">
        {resolvedUrl ? (
          <img src={resolvedUrl} alt={meme.title || "Meme"} loading="lazy" />
        ) : (
          <div className="meme-placeholder">Image unavailable</div>
        )}
      </div>
      <div className="meme-body">
        <div>
          <h3>{meme.title || "Untitled meme"}</h3>
          {meme.description && (
            <p className="muted small">{meme.description}</p>
          )}
        </div>
        <div className="meme-meta">
          <div>
            <p className="muted small">{meme.authorEmail || "anon"}</p>
            <p className="muted small">{formatRelativeTime(meme.createdAt)}</p>
          </div>
          <div className="meme-actions">
            <button
              className={`vote-btn ${hasVoted ? "active" : ""}`}
              onClick={() => onVote(meme)}
              disabled={isVoting || hasVoted}
            >
              {hasVoted ? "Upvoted" : isVoting ? "Voting..." : "Upvote"}
              <span className="vote-count">{meme.upvoteCount || 0}</span>
            </button>
            <button
              className="ghost reedit-btn"
              onClick={() => onReedit(meme, resolvedUrl)}
              disabled={!resolvedUrl || !meme.canvasState}
            >
              Re-edit
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default function MemeFeed({
  memes,
  isLoading,
  emptyState,
  onUpvote,
  votingId,
  votedIds,
}) {
  const orderedMemes = useMemo(() => {
    return [...(memes || [])].sort((a, b) => b.createdAt - a.createdAt);
  }, [memes]);

  const handleReedit = (meme, imageUrl) => {
    if (!window.memeEditor) {
      alert("Open the editor first to re-edit this meme.");
      return;
    }
    if (!meme.canvasState) {
      alert("This meme does not contain saved canvas data.");
      return;
    }
    try {
      window.memeEditor.loadState({
        imageUrl,
        canvasState: meme.canvasState,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Unable to load state", error);
      alert("Unable to load this meme into the editor.");
    }
  };

  if (isLoading) {
    return (
      <section className="feed-card">
        <h2>Community feed</h2>
        <p className="muted">Loading memes...</p>
      </section>
    );
  }

  if (!orderedMemes.length) {
    return (
      <section className="feed-card">
        <h2>Community feed</h2>
        <p className="muted">{emptyState}</p>
      </section>
    );
  }

  return (
    <section className="feed-card">
      <div className="feed-header">
        <div>
          <p className="eyebrow">Community feed</p>
          <h2>Freshest drops</h2>
        </div>
      </div>
      <div className="meme-grid">
        {orderedMemes.map((meme) => (
          <MemeCard
            key={meme.id}
            meme={meme}
            onVote={onUpvote}
            onReedit={handleReedit}
            isVoting={votingId === meme.id}
            hasVoted={votedIds.has(meme.id)}
          />
        ))}
      </div>
    </section>
  );
}


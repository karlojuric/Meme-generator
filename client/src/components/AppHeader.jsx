import { db } from "../lib/instant.js";

export default function AppHeader({ onShowAuth }) {
  const auth = db.useAuth();
  const connection = db.useConnectionStatus();

  const handleSignOut = async () => {
    try {
      await db.auth.signOut();
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Instant Meme Lab</p>
        <h1>Meme generator + feed</h1>
        <p className="muted">
          Design memes in the editor, store them with InstantDB Storage, and
          let the community upvote their favorites.
        </p>
      </div>

      <div className="header-actions">
        <span className={`status-pill ${connection}`}>
          {connection === "authenticated" ? "online" : connection}
        </span>
        {auth.user ? (
          <>
            <span className="user-chip">
              {auth.user.email || auth.user.id.slice(0, 6)}
            </span>
            <button className="ghost" onClick={handleSignOut}>
              Sign out
            </button>
          </>
        ) : (
          <button onClick={onShowAuth}>
            {auth.isLoading ? "Checking..." : "Sign in"}
          </button>
        )}
      </div>
    </header>
  );
}


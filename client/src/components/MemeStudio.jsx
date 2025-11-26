import { useEffect, useState } from "react";

const LEGACY_SCRIPT_SRC = "/legacy-meme-editor.js";

export default function MemeStudio({ onPublish, isPublishing }) {
  const [scriptStatus, setScriptStatus] = useState(
    typeof window !== "undefined" && window.memeEditor ? "loaded" : "idle",
  );
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");

  const editorReady = scriptStatus === "loaded" && !!window.memeEditor;

  useEffect(() => {
    if (window.memeEditor) {
      setScriptStatus("loaded");
      return;
    }

    let scriptEl = document.querySelector(
      `script[src="${LEGACY_SCRIPT_SRC}"]`,
    );

    if (scriptEl) {
      scriptEl.addEventListener("load", () => setScriptStatus("loaded"));
      scriptEl.addEventListener("error", () => setScriptStatus("error"));
      return;
    }

    scriptEl = document.createElement("script");
    scriptEl.src = LEGACY_SCRIPT_SRC;
    scriptEl.defer = true;
    scriptEl.onload = () => setScriptStatus("loaded");
    scriptEl.onerror = () => setScriptStatus("error");
    document.body.appendChild(scriptEl);

    return () => {
      scriptEl?.removeEventListener("load", () => setScriptStatus("loaded"));
      scriptEl?.removeEventListener("error", () => setScriptStatus("error"));
    };
  }, []);

  const handlePublish = async () => {
    if (!editorReady || !window.memeEditor) {
      setError("Editor still loading. Please wait a moment.");
      return;
    }
    if (!window.memeEditor.hasBackground()) {
      setError("Add an image or template before posting.");
      return;
    }
    if (!title.trim()) {
      setError("Give your meme a short title.");
      return;
    }
    try {
      setError("");
      const blob = await window.memeEditor.exportBlob();
      const state = window.memeEditor.getState();
      await onPublish({
        title: title.trim(),
        description: caption.trim(),
        canvasState: state,
        blob,
      });
      setTitle("");
      setCaption("");
    } catch (err) {
      setError(err?.message || "Unable to publish meme.");
    }
  };

  return (
    <section className="studio-card">
      <div className="studio-status">
        {scriptStatus === "error" && (
          <span className="status-pill errored">
            Failed to load legacy editor script
          </span>
        )}
        {scriptStatus === "loading" && (
          <span className="status-pill connecting">
            Loading the meme editor...
          </span>
        )}
      </div>
      <div className="main-content">
        <div className="canvas-wrapper">
          <div className="canvas-container">
            <canvas id="memeCanvas"></canvas>
            <div className="text-boxes-overlay" id="textBoxesOverlay"></div>
            <div className="upload-overlay" id="uploadOverlay">
              <div className="upload-icon" aria-hidden="true">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <p>Drag & drop an image here</p>
              <p className="upload-subtext">or click to browse</p>
              <input type="file" id="imageInput" accept="image/*" />
              <label htmlFor="imageInput" className="upload-btn">
                Choose image
              </label>
            </div>
          </div>
        </div>

        <div className="controls-panel">
          <div className="panel-header">
            <h2>Canvas controls</h2>
          </div>

          <div className="panel-content">
            <div className="control-section">
              <div className="section-header">
                <span className="section-icon" aria-hidden="true">
                  🖼️
                </span>
                <h3>Templates</h3>
              </div>
              <div id="templatesGrid" className="templates-grid" />
            </div>

            <div className="control-section">
              <div className="section-header">
                <span className="section-icon" aria-hidden="true">
                  📤
                </span>
                <h3>Upload image</h3>
              </div>
              <input type="file" id="imageInputControl" accept="image/*" />
              <label htmlFor="imageInputControl" className="btn btn-primary">
                <span>Upload your image</span>
              </label>
            </div>

            <div className="control-section">
              <div className="section-header">
                <span className="section-icon" aria-hidden="true">
                  ✏️
                </span>
                <h3>Descriptions</h3>
              </div>
              <button id="addDescriptionBtn" className="btn btn-success">
                <span>+ Add description</span>
              </button>
              <div id="descriptionsContainer" className="text-boxes-list"></div>
            </div>

            <div className="control-section download-section">
              <button id="downloadBtn" className="btn btn-download">
                <span>Download meme</span>
              </button>
            </div>

            <div className="control-section share-section">
              <div className="section-header">
                <span className="section-icon" aria-hidden="true">
                  🚀
                </span>
                <h3>Post to community</h3>
              </div>
              <label htmlFor="meme-title">Title</label>
              <input
                id="meme-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="When your code finally compiles"
              />
              <label htmlFor="meme-caption">Caption (optional)</label>
              <textarea
                id="meme-caption"
                rows={3}
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Add a short backstory for your meme"
              ></textarea>
              {error && <p className="form-error">{error}</p>}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePublish}
                disabled={!editorReady || isPublishing}
              >
                <span>
                  {isPublishing ? "Publishing..." : "Post to feed"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


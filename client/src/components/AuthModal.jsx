import { useEffect, useMemo, useState } from "react";

import { db } from "../lib/instant.js";

const initialStep = "email";

export default function AuthModal({ open, onClose, presetEmail = "" }) {
  const [step, setStep] = useState(initialStep);
  const [email, setEmail] = useState(presetEmail);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setStep(initialStep);
      setEmail(presetEmail);
      setCode("");
      setStatus("idle");
      setMessage("");
    }
  }, [open, presetEmail]);

  const isBusy = status === "sending" || status === "verifying";

  const intent = useMemo(() => {
    if (!message) return null;
    return message.toLowerCase().includes("sent") ? "info" : "error";
  }, [message]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !isBusy) {
      onClose?.();
    }
  };

  const normalizedError = (err) => {
    if (!err) return "Something went wrong. Please try again.";
    if (typeof err === "string") return err;
    return (
      err?.body?.message ||
      err?.message ||
      "Something went wrong. Please try again."
    );
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    if (!email) {
      setMessage("Enter a valid email.");
      return;
    }
    try {
      setStatus("sending");
      setMessage("");
      await db.auth.sendMagicCode({ email });
      setStep("code");
      setMessage("Code sent! Please check your inbox.");
    } catch (err) {
      setMessage(normalizedError(err));
    } finally {
      setStatus("idle");
    }
  };

  const handleCodeSubmit = async (event) => {
    event.preventDefault();
    if (!code) {
      setMessage("Enter the 6 digit code from your email.");
      return;
    }
    try {
      setStatus("verifying");
      setMessage("");
      await db.auth.signInWithMagicCode({ email, code });
      onClose?.();
    } catch (err) {
      setMessage(normalizedError(err));
    } finally {
      setStatus("idle");
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-card" role="dialog" aria-modal="true">
        <button
          className="modal-close"
          onClick={() => !isBusy && onClose?.()}
          aria-label="Close authentication"
          disabled={isBusy}
        >
          ×
        </button>
        <div className="modal-header">
          <p className="eyebrow">Instant Sign In</p>
          <h2>Magic link via email</h2>
          <p>
            Enter your email and we will send a 6-digit code via InstantDB's
            auth service.
          </p>
        </div>

        {step === "email" ? (
          <form className="modal-form" onSubmit={handleEmailSubmit}>
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
            <button type="submit" disabled={isBusy}>
              {status === "sending" ? "Sending..." : "Send code"}
            </button>
          </form>
        ) : (
          <form className="modal-form" onSubmit={handleCodeSubmit}>
            <label htmlFor="auth-code">6-digit code</label>
            <input
              id="auth-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, ""))
              }
              placeholder="123456"
              maxLength={6}
              required
            />

            <div className="code-actions">
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  if (isBusy) return;
                  setStep("email");
                  setCode("");
                }}
              >
                Use a different email
              </button>
              <button type="submit" disabled={isBusy}>
                {status === "verifying" ? "Verifying..." : "Verify & sign in"}
              </button>
            </div>
          </form>
        )}

        {message && (
          <p className={`modal-message ${intent ?? "info"}`}>{message}</p>
        )}
      </div>
    </div>
  );
}





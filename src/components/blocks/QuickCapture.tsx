"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  score: number;
}

interface CreatedBlock {
  id: string;
  type: string;
  title: string | null;
  url: string | null;
  domain: string | null;
  suggestions: {
    channels: Suggestion[];
    tags: Suggestion[];
  };
}

interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onBlockCreated?: () => void;
}

export default function QuickCapture({
  isOpen,
  onClose,
  onBlockCreated,
}: QuickCaptureProps) {
  const [input, setInput] = useState("");
  const [note, setNote] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdBlock, setCreatedBlock] = useState<CreatedBlock | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pasteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when modal opens + fetch channels
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Fetch channels when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/channels")
      .then((res) => res.json())
      .then((data) => setChannels(data.channels || []))
      .catch(() => {});
  }, [isOpen]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (pasteTimeoutRef.current) clearTimeout(pasteTimeoutRef.current);
      if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInput("");
      setNote("");
      setSelectedChannelId("");
      setLoading(false);
      setError(null);
      setSuccess(false);
      setCreatedBlock(null);
      if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
    }
  }, [isOpen]);

  const isUrl = useCallback((text: string): boolean => {
    try {
      const trimmed = text.trim();
      if (/^https?:\/\//i.test(trimmed)) {
        new URL(trimmed);
        return true;
      }
      // Also detect URLs without protocol if they have a domain pattern
      if (/^[\w-]+\.[\w.-]+/.test(trimmed) && !trimmed.includes(" ")) {
        new URL(`https://${trimmed}`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: trimmedInput,
          note: note.trim() || undefined,
          channelIds: selectedChannelId ? [selectedChannelId] : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 409) {
          setError("This URL has already been saved.");
        } else {
          setError(data.error || "Failed to save block.");
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setCreatedBlock(data);
      setSuccess(true);
      setLoading(false);
      onBlockCreated?.();

      // Auto-close after 3 seconds if no suggestions
      const hasSuggestions =
        (data.suggestions?.channels?.length > 0) ||
        (data.suggestions?.tags?.length > 0);

      if (!hasSuggestions) {
        autoCloseTimeoutRef.current = setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }, [input, note, loading, onClose, onBlockCreated]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pastedText = e.clipboardData.getData("text");
      if (pastedText && isUrl(pastedText)) {
        // Auto-submit on paste after 500ms delay for URLs
        if (pasteTimeoutRef.current) clearTimeout(pasteTimeoutRef.current);
        pasteTimeoutRef.current = setTimeout(() => {
          handleSubmit();
        }, 500);
      }
    },
    [isUrl, handleSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Cmd+Enter or Ctrl+Enter to save (when note field might have content)
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }
      // Enter to save only if in the main input and no shift
      if (e.key === "Enter" && !e.shiftKey && e.currentTarget === inputRef.current && !note) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, note]
  );

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const inputIsUrl = isUrl(input);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-capture-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full h-full md:h-auto md:max-w-lg md:mx-4 bg-white dark:bg-neutral-900 md:rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2
            id="quick-capture-title"
            className="text-lg font-medium text-neutral-900 dark:text-neutral-100"
          >
            Quick Capture
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col p-5 overflow-y-auto">
          {!success ? (
            <>
              {/* Main input */}
              <label htmlFor="capture-input" className="sr-only">
                Paste a link or type a note
              </label>
              <textarea
                ref={inputRef}
                id="capture-input"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError(null);
                }}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                placeholder="Paste a link or type a note…"
                className="w-full min-h-[120px] p-4 text-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-neutral-900 dark:text-neutral-100 transition-shadow"
                disabled={loading}
                autoComplete="off"
              />

              {/* URL hint */}
              {inputIsUrl && input.trim().length > 0 && (
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  Link detected — metadata will be extracted automatically
                </p>
              )}

              {/* Note input */}
              <label htmlFor="capture-note" className="mt-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Note (optional)
              </label>
              <textarea
                id="capture-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a note…"
                className="mt-1.5 w-full min-h-[60px] p-3 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-neutral-900 dark:text-neutral-100 transition-shadow"
                disabled={loading}
              />

              {/* Channel selector */}
              {channels.length > 0 && (
                <div className="mt-4">
                  <label htmlFor="capture-channel" className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Add to channel (optional)
                  </label>
                  <select
                    id="capture-channel"
                    value={selectedChannelId}
                    onChange={(e) => setSelectedChannelId(e.target.value)}
                    className="mt-1.5 w-full p-2.5 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 text-neutral-900 dark:text-neutral-100 transition-shadow"
                    disabled={loading}
                  >
                    <option value="">Inbox (no channel)</option>
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
                  {error}
                </p>
              )}

              {/* Submit */}
              <div className="mt-5 flex items-center justify-between">
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  {note ? "⌘+Enter to save" : "Enter to save"}
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || loading}
                  className="px-5 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Saving…
                    </span>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Success state */
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              {/* Success icon */}
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-600 dark:text-green-400"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                Saved
              </h3>
              {createdBlock?.title && (
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 max-w-sm line-clamp-2">
                  {createdBlock.title}
                </p>
              )}
              {createdBlock?.domain && (
                <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                  {createdBlock.domain}
                </p>
              )}

              {/* Suggestions */}
              {createdBlock?.suggestions && (
                (createdBlock.suggestions.channels.length > 0 ||
                  createdBlock.suggestions.tags.length > 0) && (
                  <div className="mt-6 w-full text-left">
                    {createdBlock.suggestions.channels.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                          Suggested Channels
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {createdBlock.suggestions.channels.map((ch) => (
                            <span
                              key={ch.id}
                              className="inline-flex items-center px-3 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full"
                            >
                              {ch.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {createdBlock.suggestions.tags.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                          Suggested Tags
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {createdBlock.suggestions.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-3 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full"
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setCreatedBlock(null);
                    setInput("");
                    setNote("");
                    setError(null);
                    // Refocus input
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="px-4 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Add another
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

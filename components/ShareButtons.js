'use client';

import { useEffect, useState } from 'react';
import { ChatIcon, DownloadIcon, LinkIcon, LinkedInIcon, ShareIcon, XIcon } from './Icons';

// Sharing a review.
// On phones the main "Share" button opens the phone's own share sheet with
// the card image attached, so WhatsApp, X, LinkedIn and Instagram open in
// their apps. Where that isn't available (most laptops) the button is
// hidden and the direct buttons below do the job.

export default function ShareButtons({ url, text, imageUrl, fileName }) {
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);
  const [cardFile, setCardFile] = useState(null);
  const enc = encodeURIComponent;

  // Fetch the card image ahead of time. Phones only allow the share sheet to
  // open straight after a tap, so the image must be ready before the tap.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.share) return;
    setCanNative(true);
    let cancelled = false;
    fetch(imageUrl)
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (!blob || cancelled) return;
        const file = new File([blob], fileName, { type: blob.type || 'image/png' });
        if (navigator.canShare?.({ files: [file] })) setCardFile(file);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [imageUrl, fileName]);

  async function shareNative() {
    const message = `${text} ${url}`;
    try {
      if (cardFile) await navigator.share({ files: [cardFile], text: message });
      else await navigator.share({ text, url });
    } catch (err) {
      // Closing the share sheet is not an error worth showing.
      if (err?.name !== 'AbortError') copy();
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', url);
    }
  }

  return (
    <>
      {canNative && (
        <button type="button" className="btn btn-ink share-main" onClick={shareNative}>
          <ShareIcon /> Share
        </button>
      )}
      <div className="share-grid">
        <a className="share-btn" href={`https://wa.me/?text=${enc(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer">
          <ChatIcon /> WhatsApp
        </a>
        <a className="share-btn" href={`https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer">
          <XIcon /> Post on X
        </a>
        <a className="share-btn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener noreferrer">
          <LinkedInIcon /> LinkedIn
        </a>
        <button type="button" className="share-btn" onClick={copy} aria-live="polite">
          <LinkIcon /> {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
      <a className="save-link" href={imageUrl} download={fileName}>
        <DownloadIcon /> Save image
      </a>
    </>
  );
}

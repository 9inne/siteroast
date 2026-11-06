'use client';

import { useState } from 'react';
import { ChatIcon, DownloadIcon, LinkIcon, LinkedInIcon, XIcon } from './Icons';

export default function ShareButtons({ url, text, imageUrl, fileName }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;

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
      <div className="share-grid">
        <a className="share-btn" href={`https://wa.me/?text=${enc(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer">
          <ChatIcon /> WhatsApp
        </a>
        <a className="share-btn" href={`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer">
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

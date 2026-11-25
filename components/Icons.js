// Small stroke icons used across SiteRoast. All decorative (aria-hidden);
// buttons that only show an icon carry their own aria-label.

const base = (size, strokeWidth = 2) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
});

export function ArrowLeft({ size = 22 }) {
  return (
    <svg {...base(size)}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

export function Chevron({ size = 16 }) {
  return (
    <svg {...base(size)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChatIcon({ size = 18 }) {
  return (
    <svg {...base(size)}>
      <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.3z" />
    </svg>
  );
}

export function XIcon({ size = 16 }) {
  return (
    <svg {...base(size)}>
      <path d="M4 4l16 16" />
      <path d="M20 4L4 20" />
    </svg>
  );
}

export function LinkedInIcon({ size = 18 }) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10v7" />
      <path d="M8 7v.01" />
      <path d="M12 17v-4a2.5 2.5 0 0 1 5 0v4" />
      <path d="M12 10v7" />
    </svg>
  );
}

export function LinkIcon({ size = 18 }) {
  return (
    <svg {...base(size)}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </svg>
  );
}

export function DownloadIcon({ size = 18 }) {
  return (
    <svg {...base(size)}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

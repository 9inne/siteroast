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

export function FlameIcon({ size = 22, color, strokeWidth = 2 }) {
  return (
    <svg {...base(size, strokeWidth)} style={color ? { color } : undefined}>
      <path d="M12 2.5c.8 3.2 4.5 5 4.5 9.5a4.5 4.5 0 0 1-9 0c0-1.9.8-3.2 1.8-4.3.3 1.8 1.2 2.8 2.4 2.8 0-2.8-.6-5 .3-8z" />
      <path d="M12 21.5a2 2 0 0 0 2-2c0-1.4-2-2.8-2-2.8s-2 1.4-2 2.8a2 2 0 0 0 2 2z" />
    </svg>
  );
}

export function ArrowRight({ size = 18 }) {
  return (
    <svg {...base(size, 2.2)}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function ArrowLeft({ size = 22 }) {
  return (
    <svg {...base(size)}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

export function Check({ size = 20 }) {
  return (
    <svg {...base(size, 2.4)} style={{ color: 'var(--lime)' }}>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

export function Spinner({ size = 20 }) {
  return (
    <svg {...base(size, 2.4)} style={{ color: 'var(--lime)' }}>
      <circle cx="12" cy="12" r="8" strokeDasharray="30 20">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function Circle({ size = 20 }) {
  return (
    <svg {...base(size)} style={{ color: 'var(--line-3)' }}>
      <circle cx="12" cy="12" r="8" />
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

export function ShareIcon({ size = 18 }) {
  return (
    <svg {...base(size)}>
      <path d="M12 15V3" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
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

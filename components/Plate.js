'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

// "Fig. 1": a phone screenshot that the critic marks up with a red pen.
// Marks use positions from 0 to 1 across the screen:
//   ring  { x, y, rx, ry }   a hand-drawn circle around a problem
//   under { x1, x2, y }      a hand-drawn underline
// Motion draws each stroke in (pathLength 0 → 1).

const VB_W = 100;
const VB_H = 205;

function ringPath({ x, y, rx, ry }, seed) {
  let d = '';
  const n = 44;
  for (let i = 0; i <= n + 5; i++) {
    const a = (i / n) * Math.PI * 2 - 0.6;
    const j = 1 + Math.sin(i * 12.9898 + seed * 78.233) * 0.025;
    const px = (x + Math.cos(a) * rx * j) * VB_W;
    const py = (y + Math.sin(a) * ry * j) * VB_H;
    d += `${i ? ' L' : 'M'}${px.toFixed(2)} ${py.toFixed(2)}`;
  }
  return d;
}

function underPath({ x1, x2, y }, seed) {
  let d = '';
  const n = 20;
  for (let i = 0; i <= n; i++) {
    const px = (x1 + ((x2 - x1) * i) / n) * VB_W;
    const py = y * VB_H + Math.sin(i * 1.3 + seed) * 0.9;
    d += `${i ? ' L' : 'M'}${px.toFixed(2)} ${py.toFixed(2)}`;
  }
  return d;
}

function numberSpot(m) {
  if (m.type === 'under') return { left: Math.min(0.93, m.x2 + 0.07), top: m.y };
  return { left: Math.max(0.07, m.x - m.rx * 0.86), top: Math.max(0.04, m.y - m.ry * 0.78) };
}

// The sample bakery homepage used on the home page (no real site yet).
const SAMPLE_BLOCKS = [
  [0, 0, 1, 0.07, 'nav'], [0.06, 0.025, 0.26, 0.022, 'dark'], [0.78, 0.025, 0.16, 0.022, ''],
  [0.06, 0.1, 0.88, 0.34, 'photo'],
  [0.06, 0.48, 0.72, 0.036, 'dark'], [0.06, 0.53, 0.52, 0.036, 'dark'],
  [0.06, 0.6, 0.82, 0.014, ''], [0.06, 0.625, 0.76, 0.014, ''], [0.06, 0.65, 0.6, 0.014, ''],
  [0.06, 0.7, 0.4, 0.055, 'dark'],
  [0.06, 0.79, 0.42, 0.13, ''], [0.52, 0.79, 0.42, 0.13, ''],
  [0, 0.95, 1, 0.05, 'nav'],
];

export const SAMPLE_MARKS = [
  { k: 1, type: 'ring', x: 0.5, y: 0.27, rx: 0.47, ry: 0.19, note: 'Way too heavy', nx: 0.37, ny: 0.02 },
  { k: 2, type: 'ring', x: 0.5, y: 0.855, rx: 0.47, ry: 0.095, note: 'Where do I call?', nx: 0.4, ny: 0.965 },
  { k: 3, type: 'under', x1: 0.05, x2: 0.8, y: 0.575, note: 'Says nothing', nx: 0.62, ny: 0.455 },
];

export default function Plate({
  src,
  alt = '',
  sample = false,
  loading = false,
  marks = [],
  shown = marks.length, // how many marks are drawn (the review fills them in one by one)
  active = null, // the mark to emphasise
  notes = false, // show the handwritten margin notes
  loop = 0, // redraw every N ms (home page)
  caption,
  stagger = 0.45,
  delay = 0.2,
}) {
  const reduce = useReducedMotion();
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!loop || reduce) return;
    const t = setInterval(() => setRound((r) => r + 1), loop);
    return () => clearInterval(t);
  }, [loop, reduce]);

  return (
    <figure className="plate">
      <div className="shot" role="img" aria-label={alt}>
        {sample && (
          <div aria-hidden="true">
            {SAMPLE_BLOCKS.map(([x, y, w, h, kind], i) => (
              <div key={i} className={`blk ${kind}`} style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }} />
            ))}
          </div>
        )}
        {src && <img src={src} alt="" />}
        {loading && !src && (
          <div className="shot-loading" aria-hidden="true">
            <i /><i /><i style={{ width: '70%' }} /><i /><i style={{ width: '55%' }} />
          </div>
        )}
        {!sample && !src && !loading && <div className="shot-empty">No screenshot this time</div>}

        <svg className="marks" viewBox={`0 0 ${VB_W} ${VB_H}`} aria-hidden="true" key={round}>
          {marks.slice(0, shown).map((m, i) => (
            <motion.path
              key={`${m.k}-${round}`}
              d={m.type === 'under' ? underPath(m, i + 1) : ringPath(m, i + 1)}
              className="mark-path"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{
                pathLength: 1,
                opacity: active == null || active === m.k ? 1 : 0.4,
                strokeWidth: active === m.k ? 1.25 : 0.8,
              }}
              transition={{
                pathLength: { duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: delay + (shown === marks.length ? i * stagger : 0) },
                opacity: { duration: 0.3 },
                strokeWidth: { duration: 0.3 },
              }}
            />
          ))}
        </svg>
        {marks.slice(0, shown).map((m, i) => {
          const spot = numberSpot(m);
          const dim = active != null && active !== m.k;
          return (
            <motion.span
              key={`n${m.k}-${round}`}
              className="mark-num"
              style={{ left: `${spot.left * 100}%`, top: `${spot.top * 100}%` }}
              initial={reduce ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: dim ? 0.45 : 1, scale: 1 }}
              transition={{ duration: 0.4, delay: reduce ? 0 : delay + 0.5 + (shown === marks.length ? i * stagger : 0) }}
            >
              {m.k}
            </motion.span>
          );
        })}
        {notes &&
          marks.slice(0, shown).map((m, i) =>
            m.note && m.nx != null ? (
              <motion.span
                key={`t${m.k}-${round}`}
                className="margin-note"
                style={{ left: `${m.nx * 100}%`, top: `${m.ny * 100}%` }}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: reduce ? 0 : delay + 0.7 + (shown === marks.length ? i * stagger : 0) }}
              >
                {m.note}
              </motion.span>
            ) : null
          )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

'use client';

import { useState } from 'react';
import Plate from './Plate';

// Turns a fix's screen position (from the screenshot critique) into a pen mark.
function markFor(fix, k) {
  const s = fix.spot;
  if (!s) return null;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const wide = s.w || 0.6;
  const tall = s.h || 0.12;
  if (tall < 0.05) {
    return { k, type: 'under', x1: clamp(s.x - wide / 2, 0.04, 0.9), x2: clamp(s.x + wide / 2, 0.1, 0.96), y: clamp(s.y + tall / 2 + 0.01, 0.03, 0.97) };
  }
  return { k, type: 'ring', x: clamp(s.x, 0.1, 0.9), y: clamp(s.y, 0.06, 0.94), rx: clamp(wide / 2 + 0.04, 0.12, 0.47), ry: clamp(tall / 2 + 0.03, 0.05, 0.3) };
}

// Fig. 1 and the three fixes, linked: tapping a fix finds it on the screenshot.
export default function ReviewBody({ host, shotSrc, fixes, children }) {
  const [active, setActive] = useState(1);
  const marks = fixes.map((f, i) => markFor(f, i + 1)).filter(Boolean);

  return (
    <div className="r-body">
      <div className="plate-col">
        <Plate
          src={shotSrc}
          alt={`${host} on a phone${marks.length ? ', with problems circled' : ''}`}
          marks={marks}
          active={marks.length ? active : null}
          delay={0.9}
          caption={<><em>Fig. 1</em> <span className="kicker">· {marks.length ? 'Tap a fix to find it' : `${host} on a phone`}</span></>}
        />
      </div>
      <div className="right-col">
        <section>
          <h2 className="sec-h">Fix these <em>first</em></h2>
          <ol className="fixes">
            {fixes.map((fix, i) => (
              <li key={fix.title}>
                <button type="button" className={`fix${active === i + 1 ? ' active' : ''}`} onClick={() => setActive(i + 1)} aria-pressed={active === i + 1}>
                  <span className="n" aria-hidden="true">{i + 1}</span>
                  <b>{fix.title}</b>
                  <span>{fix.body}</span>
                  {fix.impact && <small>{fix.impact}</small>}
                </button>
              </li>
            ))}
          </ol>
        </section>
        {children}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { animate, motion, useReducedMotion } from 'motion/react';

// The verdict seal: the score counts up while the stamp lands with a spring.
export default function Stamp({ score }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? score : 0);

  useEffect(() => {
    if (reduce) return setShown(score);
    const controls = animate(0, score, { duration: 1.1, delay: 0.35, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [score, reduce]);

  return (
    <motion.div
      className="stamp"
      role="img"
      aria-label={`Score ${score} out of 100`}
      initial={reduce ? false : { opacity: 0, scale: 1.7, rotate: -14 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.35 }}
    >
      <svg className="ringtext" viewBox="0 0 172 172" aria-hidden="true">
        <defs>
          <path id="seal" d="M86 86 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0" />
        </defs>
        <text fontFamily="Geist Mono, monospace" fontSize="10.5" letterSpacing="3.2" fill="#111">
          <textPath href="#seal">SITEROAST · THE VERDICT · SITEROAST · THE VERDICT ·</textPath>
        </text>
      </svg>
      <div className="core" aria-hidden="true">
        <b>{shown}</b>
        <span>/ 100</span>
      </div>
    </motion.div>
  );
}

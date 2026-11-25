'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

// Smooth, weighted scrolling on laptops (mouse wheel and trackpad).
// Phones keep their native touch scrolling, and it switches off entirely
// for people who have asked their device to reduce motion.
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp: 0.11, anchors: true });
    let id = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      id = requestAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);
  return null;
}

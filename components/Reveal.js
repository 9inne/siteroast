'use client';

import { motion, useReducedMotion } from 'motion/react';

// Fades and lifts content in as it scrolls into view, once.
// Content stays fully visible for people who reduce motion.
const TAGS = { div: motion.div, li: motion.li, section: motion.section };

export default function Reveal({ as = 'div', delay = 0, className, children, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = TAGS[as] || motion.div;
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1], delay }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

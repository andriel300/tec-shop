'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import TitleBorder from '../../assets/svgs/title-border';

const SectionTitle = ({ title }: { title: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isInView = useInView(containerRef, { margin: '-60px' });
  const [titleWidth, setTitleWidth] = useState(0);

  useEffect(() => {
    if (headingRef.current) {
      setTitleWidth(headingRef.current.offsetWidth);
    }
  }, [title]);

  return (
    <motion.div
      ref={containerRef}
      className="relative inline-block"
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <h1 ref={headingRef} className="md:text-3xl text-xl relative z-10 font-semibold">
        {title}
      </h1>

      {/* Reveal the SVG border left-to-right like it's being drawn */}
      <motion.div
        className="absolute top-[56%]"
        style={{ width: titleWidth || 'auto' }}
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={isInView ? { clipPath: 'inset(0 0% 0 0)' } : {}}
        transition={{ duration: 0.65, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <TitleBorder width="100%" height={28} />
      </motion.div>
    </motion.div>
  );
};

export default SectionTitle;

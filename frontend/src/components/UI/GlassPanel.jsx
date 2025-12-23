import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const GlassPanel = ({ children, className, hoverEffect = false, ...props }) => {
  return (
    <motion.div
      className={twMerge(
        "bg-glass-surface backdrop-blur-xl border border-glass-border rounded-2xl shadow-xl",
        className
      )}
      whileHover={hoverEffect ? { scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassPanel;

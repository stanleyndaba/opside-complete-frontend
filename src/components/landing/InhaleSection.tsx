import React from 'react';
import { motion } from 'framer-motion';

type InhaleSectionProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  initialOpacity?: number;
  initialScale?: number;
  initialY?: number;
  amount?: number | 'some' | 'all';
  once?: boolean;
};

export function InhaleSection({
  children,
  className,
  delay = 0,
  duration = 0.8,
  initialOpacity = 0,
  initialScale = 0.98,
  initialY = 20,
  amount = 0.5,
  once = true
}: InhaleSectionProps) {
  return (
    <motion.div
      initial={{ opacity: initialOpacity, scale: initialScale, y: initialY }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration,
        ease: [0.22, 1, 0.36, 1],
        delay
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default InhaleSection;

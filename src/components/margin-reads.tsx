'use client';

import { motion } from 'framer-motion';

export default function MarginReads() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6 font-sans text-[#242424]">
      <div className="max-w-5xl text-center text-4xl font-medium leading-[1.12] sm:text-6xl space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Most sellers have the evidence.
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[#6b7280]"
        >
          It's just trapped in separate documents.
        </motion.div>
      </div>
    </main>
  );
}

import React from 'react';
import { motion } from 'framer-motion';

const DEMO_VIDEO_THUMBNAIL_URL = '/margin-logo-reveal.gif';

const Finality = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black font-sans overflow-hidden p-0 m-0">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="relative w-full h-screen overflow-hidden flex items-center justify-center"
      >
        <motion.img
          src={DEMO_VIDEO_THUMBNAIL_URL}
          alt="Margin Finality"
          initial={{ scale: 1 }}
          animate={{ scale: 1.15 }}
          transition={{
            duration: 12,
            ease: "linear",
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="absolute inset-0 w-full h-full object-cover opacity-90 saturate-[1.1]"
        />
        
        {/* Dark gradient for cinematic closing feel */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.9)_100%)]" />
      </motion.div>
    </div>
  );
};

export default Finality;

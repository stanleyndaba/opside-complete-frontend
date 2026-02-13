import React from 'react';
import { motion } from 'framer-motion';

const Branding = () => {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Technical Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-full h-[800px] bg-[radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.05),transparent_70%)]" />
                <div className="absolute bottom-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_20%_100%,rgba(59,130,246,0.03),transparent_70%)]" />

                {/* SVG Noise Texture Overlay */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.15] mix-blend-overlay pointer-events-none">
                    <filter id="noiseFilter">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.65"
                            numOctaves="3"
                            stitchTiles="stitch"
                        />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
                </svg>
            </div>

            <main className="relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="flex flex-col items-center gap-8"
                >
                    <div className="flex items-center gap-6">
                        {/* Logo Asset */}
                        <motion.img
                            src="/logoimagetwo.png"
                            alt="Margin Logo"
                            className="h-16 w-auto object-contain invert"
                            initial={{ filter: 'invert(1) blur(10px)', opacity: 0 }}
                            animate={{ filter: 'invert(1) blur(0px)', opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        />

                        {/* Vertical Divider */}
                        <div className="h-12 w-[1px] bg-white/10" />

                        {/* Margin Wordmark */}
                        <span className="font-merriweather font-bold text-white text-6xl tracking-tight">
                            Margin
                        </span>
                    </div>

                    {/* Metadata / Tagline */}
                    <div className="space-y-4">
                        <p className="text-white/20 font-mono text-[10px] uppercase tracking-[0.5em] font-bold">
                            High Fidelity Capital Protection
                        </p>
                    </div>
                </motion.div>
            </main>

            {/* Corner Decorative Elements (Brutalist style) */}
            <div className="absolute top-12 left-12 w-24 h-[1px] bg-white/5" />
            <div className="absolute top-12 left-12 w-[1px] h-24 bg-white/5" />
            <div className="absolute bottom-12 right-12 w-24 h-[1px] bg-white/5 text-right" />
            <div className="absolute bottom-12 right-12 w-[1px] h-24 bg-white/5" />

            <div className="absolute bottom-12 left-12 font-mono text-[8px] text-white/10 uppercase tracking-[0.5em]">
                Margin.Group // Global Dominance
            </div>
        </div>
    );
};

export default Branding;

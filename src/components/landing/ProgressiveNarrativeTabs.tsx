import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

function VisualClaimExpiry() {
  const [timeLeft, setTimeLeft] = useState(72 * 60 * 60); // 72 hours in seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 100); // fast ticking for effect

    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(timeLeft / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900">
      <div className="relative flex h-48 w-48 flex-col items-center justify-center rounded-full border border-slate-800 bg-slate-900/50 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
        <motion.div 
          className="absolute inset-0 rounded-full border border-slate-700/50 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        />
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Claim Expiry</div>
        <div className="font-mono text-3xl font-light tracking-tight text-white">
          {hours}:{minutes}:{seconds}
        </div>
        <div className="text-[10px] font-medium text-slate-600 mt-2">WINDOW CLOSING</div>
      </div>
    </div>
  );
}

function VisualScatteredFiles() {
  const logos = [
    { name: 'Gmail', color: 'bg-red-500', initialPath: { x: -60, y: -60 } },
    { name: 'Slack', color: 'bg-purple-500', initialPath: { x: 60, y: -40 } },
    { name: 'WhatsApp', color: 'bg-emerald-500', initialPath: { x: -40, y: 60 } },
    { name: 'Drive', color: 'bg-blue-500', initialPath: { x: 50, y: 50 } },
  ];

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-slate-900">
      <div className="relative flex h-32 w-32 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 shadow-2xl">
        <div className="text-center">
          <div className="font-mono text-xs font-bold text-slate-400">DOSSIER</div>
          <div className="text-[9px] text-slate-600">COMPILING...</div>
        </div>
        
        {logos.map((logo, i) => (
          <motion.div
            key={logo.name}
            className={`absolute flex h-8 w-8 items-center justify-center rounded-lg shadow-lg ${logo.color}`}
            initial={logo.initialPath}
            animate={{ x: 0, y: 0, scale: 0.5, opacity: 0 }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              delay: i * 0.4,
              ease: "easeInOut",
              repeatDelay: 0.5
            }}
          >
            <div className="h-4 w-4 rounded-full bg-white/50" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function VisualCapitalLeak() {
  const [funds, setFunds] = useState(12450.00);

  useEffect(() => {
    const interval = setInterval(() => {
      setFunds((prev) => Math.max(0, prev - (Math.random() * 5 + 1)));
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="mb-4 inline-block rounded-full border border-red-900/30 bg-red-900/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-500">
          Capital Leak Detected
        </div>
        <div className="font-mono text-5xl font-bold tracking-tighter text-white">
          ${funds.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="mt-4 flex items-center justify-center space-x-2 opacity-50">
          <motion.div
            animate={{ y: [0, 5, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="h-1.5 w-1.5 rounded-full bg-red-500"
          />
          <motion.div
            animate={{ y: [0, 5, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
            className="h-1.5 w-1.5 rounded-full bg-red-500"
          />
          <motion.div
            animate={{ y: [0, 5, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
            className="h-1.5 w-1.5 rounded-full bg-red-500"
          />
        </div>
      </div>
    </div>
  );
}

const TABS = [
  {
    id: 1,
    title: 'The claim window closes fast.',
    subtext: 'Amazon reimbursement claims can move on short deadlines. Once a discrepancy is identified, the evidence, filing path, and response work need to move before the window closes.',
    duration: 6000,
    Visual: VisualClaimExpiry,
  },
  {
    id: 2,
    title: 'The proof is scattered everywhere.',
    subtext: 'The invoice you need for a reimbursement claim is in your email from seven months ago. The shipment log is in a supplier WhatsApp thread. By the time you find both, the claim window is gone. Margin connects those sources before the deadline hits.',
    duration: 6000,
    Visual: VisualScatteredFiles,
  },
  {
    id: 3,
    title: 'Delay becomes lost money.',
    subtext: 'Every day a reimbursement claim is not filed is a day closer to losing the case permanently. Margin keeps the workflow moving in minutes, not days.',
    duration: 6000,
    Visual: VisualCapitalLeak,
  }
];

export function ProgressiveNarrativeTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.3 });

  useEffect(() => {
    if (!isInView || isPaused) return;

    const currentTab = TABS[activeTab];
    const timer = setTimeout(() => {
      setActiveTab((prev) => (prev + 1) % TABS.length);
    }, currentTab.duration);

    return () => clearTimeout(timer);
  }, [activeTab, isInView, isPaused]);

  return (
    <section ref={containerRef} className="relative bg-black py-20 md:py-32">
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-6 md:px-8">
        
        {/* Mobile Progressive Bar Layout */}
        <div className="mb-12 flex flex-col md:hidden">
          <div className="mb-8 flex gap-2">
            {TABS.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(idx); setIsPaused(true); }}
                className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800"
              >
                {idx === activeTab && (
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-white"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: tab.duration / 1000, ease: 'linear' }}
                  />
                )}
                {idx < activeTab && <div className="absolute inset-0 bg-white" />}
              </button>
            ))}
          </div>
          
          <div className="relative mb-8 aspect-square w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                {React.createElement(TABS[activeTab].Visual)}
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-serif-headline text-[28px] font-bold leading-tight text-white">
                {TABS[activeTab].title}
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-slate-400">
                {TABS[activeTab].subtext}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop Split-Screen Layout */}
        <div className="hidden grid-cols-2 gap-16 md:grid lg:gap-24">
          <div className="flex flex-col justify-center">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-12">
              Why timing matters
            </div>
            <div className="flex flex-col gap-10">
              {TABS.map((tab, idx) => {
                const isActive = idx === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(idx); setIsPaused(true); }}
                    className="group relative flex text-left outline-none"
                  >
                    {/* Progress Line */}
                    <div className="relative mr-8 w-px shrink-0 bg-slate-800">
                      {isActive && (
                        <motion.div
                          className="absolute left-0 right-0 top-0 origin-top bg-white"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: tab.duration / 1000, ease: 'linear' }}
                          style={{ bottom: 0 }}
                        />
                      )}
                    </div>

                    <div className="flex flex-col py-2">
                      <h3 className={`font-serif-headline text-[32px] font-bold leading-[1.1] tracking-tight transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'}`}>
                        {tab.title}
                      </h3>
                      
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.4 }}
                            className="overflow-hidden"
                          >
                            <p className="text-[17px] leading-relaxed text-slate-400">
                              {tab.subtext}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                {React.createElement(TABS[activeTab].Visual)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
}

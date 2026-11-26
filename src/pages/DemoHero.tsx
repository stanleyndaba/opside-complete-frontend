import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, CircleDot, FileCheck2, Search, ShieldCheck } from "lucide-react";
import HeroInboxVisual from "@/components/landing/HeroInboxVisual";

const scenes = [
  {
    label: "01 · Signal",
    title: "The inbox is full of requests.",
    body: "Amazon correspondence, inventory questions and settlement differences arrive as separate threads.",
    icon: Search,
    tone: "border-[#D7E3FF] bg-[#F5F8FF] text-[#245BFF]",
  },
  {
    label: "02 · Investigation",
    title: "The records become one case.",
    body: "Margin connects the event, evidence, response and financial amount without losing the original trail.",
    icon: FileCheck2,
    tone: "border-[#D7E3E8] bg-[#F7FAFA] text-[#187A70]",
  },
  {
    label: "03 · Position",
    title: "The financial position is clear.",
    body: "What is supported, what was resolved and what remains open are visible to the people responsible.",
    icon: ShieldCheck,
    tone: "border-[#F6D5CB] bg-[#FFF8F5] text-[#D9472D]",
  },
] as const;

function SceneCard({ scene, active }: { scene: (typeof scenes)[number]; active: boolean }) {
  const Icon = scene.icon;
  return (
    <motion.article
      animate={{ opacity: active ? 1 : 0.5, y: active ? 0 : 4, scale: active ? 1 : 0.985 }}
      transition={{ duration: 0.35 }}
      className={`rounded-[10px] border p-5 transition-shadow ${scene.tone} ${active ? "shadow-[0_16px_34px_rgba(24,32,38,0.10)]" : "shadow-none"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#63717A]">{scene.label}</span>
        <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
      </div>
      <h2 className="mt-5 max-w-[260px] font-sora text-[20px] font-semibold leading-[1.08] tracking-[-0.04em] text-[#182026]">{scene.title}</h2>
      <p className="mt-3 text-[13px] leading-6 text-[#52616A]">{scene.body}</p>
      <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold text-[#52616A]">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        <span>{active ? "In view" : "Next in the chain"}</span>
      </div>
    </motion.article>
  );
}

function ResolutionRecord({ active }: { active: boolean }) {
  return (
    <motion.div
      animate={{ opacity: active ? 1 : 0.62, y: active ? 0 : 8 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-[12px] border border-[#C9D9E1] bg-white shadow-[0_20px_48px_rgba(24,32,38,0.10)]"
    >
      <div className="flex items-center justify-between border-b border-[#E5ECEF] px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7B8A97]">Margin investigation record</p>
          <p className="mt-1 text-[14px] font-semibold text-[#182026]">EVT-FBA-2026-0001847</p>
        </div>
        <span className="rounded-full bg-[#E8F6F0] px-3 py-1 text-[10px] font-bold text-[#187A70]">Position established</span>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-3">
        {[
          ["Underlying event", "600-unit inbound variance"],
          ["Supported exposure", "$38,850"],
          ["Remaining open", "$12,850"],
        ].map(([label, value], index) => (
          <div key={label} className={`rounded-[8px] border p-4 ${index === 2 ? "border-[#F6D5CB] bg-[#FFF8F5]" : "border-[#E2EAED] bg-[#FAFCFC]"}`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7B8A97]">{label}</p>
            <p className="mt-3 text-[14px] font-semibold leading-5 text-[#182026]">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#E5ECEF] px-5 py-4 text-[11px] font-semibold text-[#52616A]">
        <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#187A70]" /> Evidence linked</span>
        <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#187A70]" /> Amazon response interpreted</span>
        <span className="inline-flex items-center gap-1.5"><CircleDot className="h-3.5 w-3.5 text-[#D9472D]" /> Next action owned</span>
      </div>
    </motion.div>
  );
}

export default function DemoHero() {
  const reduceMotion = useReducedMotion();
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setActiveScene((scene) => (scene + 1) % scenes.length), 3600);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#FAFAF7] font-google-sans text-[#182026]">
      <header className="flex items-center justify-between border-b border-[#E3E9EB] bg-white/90 px-5 py-4 backdrop-blur-sm sm:px-10">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#182026]">Margin</span>
        <span className="rounded-full border border-[#D8E3E8] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7B8A97]">Demo hero test</span>
      </header>

      <section className="relative border-b border-[#E3E9EB] px-5 pb-14 pt-14 sm:px-10 sm:pb-20 sm:pt-20 lg:px-16 lg:pt-24">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          <div className="relative z-10 max-w-[620px]">
            <p className="border-l-2 border-[#245BFF] pl-3 text-[11px] font-bold uppercase tracking-[0.13em] text-[#52616A]">A short-form product story</p>
            <h1 className="mt-5 max-w-[600px] font-sora text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] text-[#000000] sm:text-[60px] lg:text-[72px]">From a pile of Amazon requests to a financial position you can stand behind.</h1>
            <p className="mt-7 max-w-[550px] text-[16px] leading-8 text-[#33454E] sm:text-[18px]">The inbox is where the work starts. Margin connects the correspondence, operational event, evidence and outcome so the business can see what actually happened.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#52616A]">
              <span className="rounded-full bg-[#E7EEFF] px-3 py-2 text-[#245BFF]">Inbox signal</span>
              <ArrowRight className="h-4 w-4 text-[#8A99A3]" aria-hidden="true" />
              <span className="rounded-full bg-[#E8F6F0] px-3 py-2 text-[#187A70]">Evidence-linked record</span>
              <ArrowRight className="h-4 w-4 text-[#8A99A3]" aria-hidden="true" />
              <span className="rounded-full bg-[#FFF0EB] px-3 py-2 text-[#D9472D]">Verified position</span>
            </div>
          </div>

          <div className="demo-hero-inbox relative h-[390px] overflow-hidden rounded-[12px] border border-[#D8E3E8] bg-[#EEF3FF] shadow-[0_26px_70px_rgba(37,49,58,0.14)] sm:h-[520px] lg:h-[590px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_18%,rgba(36,91,255,0.18),transparent_32%),radial-gradient(circle_at_20%_86%,rgba(240,90,60,0.12),transparent_34%)]" aria-hidden="true" />
            <div className="demo-hero-inbox-stage absolute left-1/2 top-1/2 h-[629px] w-[1136px] -translate-x-1/2 -translate-y-1/2 scale-[0.42] sm:scale-[0.58] lg:scale-[0.72] xl:scale-[0.88]">
              <HeroInboxVisual />
            </div>
            <div className="absolute inset-x-4 bottom-4 rounded-[8px] border border-white/80 bg-white/90 px-4 py-3 shadow-[0_12px_30px_rgba(24,32,38,0.12)] backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:px-5 sm:py-4">
              <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#52616A]"><span>Opening signal</span><span className="text-[#D9472D]">Your help needed</span></div>
              <p className="mt-2 text-[13px] leading-5 text-[#182026] sm:text-[14px]">Amazon’s message is only the beginning of the investigation.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-10 sm:py-20 lg:px-16">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[700px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#245BFF]">The continuation</p>
            <h2 className="mt-4 font-sora text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#182026] sm:text-[52px]">The message is not the answer. The connected record is.</h2>
            <p className="mt-5 max-w-[620px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">This is the proposed motion after the inbox: signal, investigation, then a financial position with the remaining work clearly owned.</p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {scenes.map((scene, index) => <SceneCard key={scene.label} scene={scene} active={activeScene === index} />)}
          </div>
          <div className="mt-10">
            <ResolutionRecord active={activeScene === 2} />
          </div>
          <div className="mt-6 flex items-center justify-center gap-2" aria-label="Demo scene progress">
            {scenes.map((scene, index) => <button key={scene.label} type="button" onClick={() => setActiveScene(index)} aria-label={`Show ${scene.label}`} className={`h-1.5 rounded-full transition-all ${activeScene === index ? "w-10 bg-[#245BFF]" : "w-5 bg-[#C9D9E1]"}`} />)}
          </div>
        </div>
      </section>
    </main>
  );
}

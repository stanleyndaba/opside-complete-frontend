import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  FileSearch,
  Mail,
  PackageCheck,
  RefreshCcw,
  Send,
  Truck,
} from "lucide-react";

const SYSTEM_BLUE = "#007aff";

const scenes = [
  "The Rejection",
  "Evidence Agent",
  "Strike Back",
  "Payout",
] as const;

const agentSteps = [
  {
    icon: AlertCircle,
    title: "Parsed Seller Support rejection",
    detail: "Stamped POD requested for claim AMZ-FBA-88419 covering 37 missing units.",
  },
  {
    icon: Database,
    title: "Cross-referenced received inventory",
    detail: "Amazon ledger shows 9,963 units logged against 10,000 units shipped.",
  },
  {
    icon: FileSearch,
    title: "Found the missing evidence gap",
    detail: "Original appeal omitted Page 4 of the BOL, where the final pallet stamp appears.",
  },
  {
    icon: Truck,
    title: "Querying carrier API",
    detail: "Fetching signed delivery scan, dock timestamp, and stamped POD metadata.",
    running: true,
  },
];

const transition = {
  type: "spring",
  stiffness: 130,
  damping: 22,
  mass: 0.9,
} as const;

const sceneVariants = {
  initial: { opacity: 0, y: 28, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition },
  exit: { opacity: 0, y: -22, scale: 0.98, transition: { duration: 0.22 } },
};

const SceneShell = ({
  children,
  eyebrow,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
}) => (
  <motion.section
    variants={sceneVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="w-full max-w-5xl"
  >
    <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-black uppercase tracking-tight text-[#007aff]">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-4xl font-black italic tracking-tight text-slate-950 md:text-6xl">
          {title}
        </h1>
      </div>
      <p className="max-w-md text-sm font-semibold leading-6 text-slate-500 md:text-right">
        {subtitle}
      </p>
    </div>
    {children}
  </motion.section>
);

const RejectionScene = () => (
  <SceneShell
    eyebrow="Scene 1"
    title="THE REJECTION"
    subtitle="Seller Support pushes back with a strict document demand instead of approving the shortage claim."
  >
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="h-7 w-px bg-slate-300" />
          <div className="flex items-center gap-2 text-sm font-black text-slate-700">
            <Mail size={17} />
            Amazon Seller Support
          </div>
        </div>
        <div className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-black text-red-600">
          ACTION REQUIRED
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[260px_1fr]">
        <aside className="border-b border-slate-200 bg-slate-50 p-5 md:border-b-0 md:border-r">
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-black text-slate-400">From</p>
              <p className="font-bold text-slate-800">seller-support@amazon.com</p>
            </div>
            <div>
              <p className="font-black text-slate-400">Case</p>
              <p className="font-bold text-slate-800">AMZ-FBA-88419</p>
            </div>
            <div>
              <p className="font-black text-slate-400">Units in dispute</p>
              <p className="text-3xl font-black text-slate-950">37</p>
            </div>
          </div>
        </aside>

        <article className="p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-tight text-red-500">
            Urgent document request
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            We cannot continue review without a Stamped POD
          </h2>
          <div className="mt-6 space-y-4 text-sm font-semibold leading-7 text-slate-600">
            <p>Hello Seller,</p>
            <p>
              We reviewed your inbound shipment claim for FBA shipment
              FBA18J4K2R. The claim cannot be approved because the submitted
              evidence does not include a stamped proof of delivery confirming
              receipt by the fulfillment center.
            </p>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-black text-red-700">
                Required: Stamped POD for all pallets related to the 37-unit
                discrepancy.
              </p>
            </div>
            <p>
              Please provide the requested document within the support case for
              reconsideration.
            </p>
          </div>
        </article>
      </div>
    </div>
  </SceneShell>
);

const AgentScene = () => (
  <SceneShell
    eyebrow="Scene 2"
    title="EVIDENCE AGENT"
    subtitle="MARGIN reopens the case, diagnoses why Amazon rejected it, then hunts for the missing proof."
  >
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)] md:p-7">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#007aff] text-white">
            <RefreshCcw size={24} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-400">Thought Process</p>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Iteration Engine running appeal round 2
            </h2>
          </div>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-[#007aff]">
          Rejection reason isolated
        </div>
      </div>

      <div className="space-y-3">
        {agentSteps.map((step, index) => {
          const Icon = step.icon;

          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...transition, delay: index * 0.16 }}
              className="flex gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#007aff] shadow-sm">
                {step.running ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Icon size={20} />
                  </motion.div>
                ) : (
                  <Icon size={20} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black tracking-tight text-slate-950">
                    {step.title}
                  </p>
                  {step.running ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-black text-[#007aff]">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#007aff]" />
                      running
                    </span>
                  ) : (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                  {step.detail}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  </SceneShell>
);

const StrikeBackScene = () => (
  <SceneShell
    eyebrow="Scene 3"
    title="THE STRIKE BACK"
    subtitle="The second appeal does not repeat the first one. It ships a stronger proof pack targeted to the rejection."
  >
    <div className="rounded-lg bg-[#007aff] p-6 text-white shadow-[0_30px_90px_rgba(0,122,255,0.28)] md:p-9">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-tight text-white/75">
            Automated reply generated
          </p>
          <h2 className="mt-2 text-4xl font-black italic tracking-tight md:text-6xl">
            Proof Pack 2.0
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-black text-[#007aff]">
          <Send size={18} />
          Sent to Amazon
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-white/25 bg-white/10 p-5">
          <p className="text-sm font-black text-white/70">Carrier evidence</p>
          <p className="mt-3 text-2xl font-black tracking-tight">
            Stamped POD attached
          </p>
        </div>
        <div className="rounded-lg border border-white/25 bg-white/10 p-5">
          <p className="text-sm font-black text-white/70">Shipped</p>
          <p className="mt-3 text-4xl font-black tracking-tight">10,000</p>
          <p className="mt-1 text-sm font-bold text-white/75">units confirmed</p>
        </div>
        <div className="rounded-lg border border-white/25 bg-white/10 p-5">
          <p className="text-sm font-black text-white/70">Amazon logged</p>
          <p className="mt-3 text-4xl font-black tracking-tight">9,963</p>
          <p className="mt-1 text-sm font-bold text-white/75">37-unit gap</p>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-white p-5 text-slate-900">
        <p className="text-sm font-black text-[#007aff]">Appeal thesis</p>
        <p className="mt-2 text-xl font-black tracking-tight">
          The rejection asked for stamped delivery proof. Page 4 of the BOL and
          the carrier delivery scan now verify the full shipment against
          Amazon's partial receipt record.
        </p>
      </div>
    </div>
  </SceneShell>
);

const PayoutScene = () => (
  <SceneShell
    eyebrow="Scene 4"
    title="THE PAYOUT"
    subtitle="The iteration closes the evidence gap and turns a rejected case into approved recovery."
  >
    <div className="rounded-lg border-[10px] border-[#007aff] bg-white p-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.12)] md:p-14">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...transition, delay: 0.12 }}
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-lg bg-blue-50 text-[#007aff]"
      >
        <PackageCheck size={42} />
      </motion.div>
      <h2 className="text-5xl font-black italic tracking-tight text-slate-950 md:text-7xl">
        STRIKE SUCCESS!
      </h2>
      <p className="mt-6 text-sm font-black uppercase tracking-tight text-slate-500">
        Approved reimbursement
      </p>
      <p className="mt-2 text-6xl font-black tracking-tight text-[#007aff] md:text-8xl">
        $925.00
      </p>
      <p className="mx-auto mt-6 max-w-2xl text-base font-bold leading-7 text-slate-500">
        MARGIN kept fighting, found the missing proof, rebuilt the appeal, and
        secured the payout after the first rejection.
      </p>
    </div>
  </SceneShell>
);

const ReAppealSimulate = () => {
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setScene((current) => (current + 1) % scenes.length);
    }, 4300);

    return () => window.clearInterval(timer);
  }, []);

  const activeScene = useMemo(() => {
    switch (scene) {
      case 0:
        return <RejectionScene />;
      case 1:
        return <AgentScene />;
      case 2:
        return <StrikeBackScene />;
      default:
        return <PayoutScene />;
    }
  }, [scene]);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl flex-col">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-tight text-[#007aff]">
              MARGIN Iteration Engine
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">
              It does not just file. It fights until it wins.
            </p>
          </div>
          <div className="flex gap-2">
            {scenes.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setScene(index)}
                className={`h-2.5 rounded-full transition-all ${
                  scene === index ? "w-12 bg-[#007aff]" : "w-2.5 bg-slate-300"
                }`}
                aria-label={`Show ${label}`}
              />
            ))}
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center">
          <AnimatePresence mode="wait">{activeScene}</AnimatePresence>
        </div>
      </div>
    </main>
  );
};

export default ReAppealSimulate;

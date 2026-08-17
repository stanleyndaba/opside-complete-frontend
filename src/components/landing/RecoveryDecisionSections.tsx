import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecoveryDecisionSectionsProps {
  onAuditCta: (location: string) => void;
}

const pathOptions = [
  {
    label: "Option 1 — Recover Once",
    title: "One problem. One engagement.",
    copy: "Have Margin manage the eligible recovery opportunities identified in your Audit.",
    price: "Personalized one-time quote after your Audit",
    cta: "Recover These Issues",
    ctaLocation: "homepage_recover_once",
    items: [
      "Evidence preparation",
      "Claim preparation",
      "Filing",
      "Follow-up",
      "Eligible appeal handling",
      "Payout verification",
    ],
  },
  {
    label: "Option 2 — Recovery Workspace",
    title: "Keep the recovery work under control.",
    copy: "For sellers who do not want every new issue to become another spreadsheet, case chase, or internal project. Workspace keeps checking, evidence, cases, responses, and payouts together over time.",
    price: "US$99/month",
    subPrice: "with 0% recovery commission",
    cta: "Activate Recovery Workspace",
    ctaLocation: "homepage_recovery_workspace",
    items: [
      "Continuous recovery monitoring",
      "Recurring Audits",
      "New recovery opportunities",
      "Evidence readiness",
      "Case continuity",
      "Payout tracking",
    ],
  },
];

const evidenceRequests = [
  {
    title: "INVOICE",
    copy: "The supplier record for the affected units.",
  },
  {
    title: "SHIPMENT RECORD",
    copy: "What was shipped, when it was shipped, and under which shipping plan.",
  },
  {
    title: "PROOF OF DELIVERY",
    copy: "Confirmation that the shipment reached the fulfillment center.",
  },
  {
    title: "INVENTORY RECORD",
    copy: "What Amazon received, adjusted, lost, damaged, or reimbursed.",
  },
  {
    title: "CASE HISTORY",
    copy: "What was submitted, what Amazon answered, and what still needs attention.",
  },
];

const auditTrustItems = [
  ["Records reviewed", "See what Margin actually examined, including the data range and coverage."],
  ["Why it was flagged", "Understand what happened and which records created the finding."],
  ["Evidence status", "See what is ready, what is missing, and what would strengthen the case."],
  ["Recovery value", "See how the estimate was calculated and what it does—or does not—include."],
  [
    "Case status",
    "Know what has been submitted, what Amazon answered, and what still needs attention.",
  ],
];

const controlItems = [
  { title: "Read-only Amazon access", detail: "Margin examines the records needed for the Audit." },
  { title: "Your approval before submission", detail: "Nothing is filed without your approval." },
  { title: "Clear recovery status", detail: "See what was found, what is ready, and what is waiting." },
  { title: "Payout verification", detail: "See what Amazon approved and what actually reached your account." },
  { title: "No payment to run the Audit", detail: "Review what Margin finds before deciding whether to continue." },
  { title: "0% recovery commission on Workspace", detail: "Workspace is a fixed monthly control layer, not a percentage taken from each recovery." },
];

export const RecoveryDecisionSections: React.FC<RecoveryDecisionSectionsProps> = ({
  onAuditCta,
}) => {
  const revealProps = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-48px" },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  };

  return (
    <>
      {/* Section 4 — Choose how much work you want to keep */}
      <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-surface)] py-32 md:py-56">
        <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
          <motion.div {...revealProps} className="max-w-[780px]">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-[var(--margin-border-strong)]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-primary)]">
                Your next step depends on what the Audit finds
              </span>
            </div>
            <h2 className="font-lora text-[44px] leading-[0.98] tracking-[-0.045em] text-[var(--margin-text-primary)] md:text-[76px]" style={{ fontWeight: 400 }}>
              Handle one recovery—or stop handling them yourself.
            </h2>
            <p className="mt-6 max-w-[720px] text-[17px] leading-8 tracking-[-0.015em] text-[var(--margin-text-secondary)] md:text-[19px]">
              Some sellers have one recovery that needs to be handled. Others keep finding the same kind of issue and do not want another manual project every time it happens. Margin shows you what your account supports, then gives you one clear next step.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-0 border-y border-[var(--margin-border)] lg:grid-cols-2">
            {pathOptions.map((option, index) => (
              <motion.div
                key={option.label}
                {...revealProps}
                transition={{ ...revealProps.transition, delay: index * 0.08 }}
                className={`relative p-6 md:p-10 ${index > 0 ? "border-t border-[var(--margin-border)] lg:border-l lg:border-t-0" : ""}`}
              >
                <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
                  {option.label}
                </p>
                <h3 className="mt-5 text-[34px] font-semibold leading-[1.02] tracking-[-0.065em] text-[var(--margin-text-primary)] md:text-[48px]">
                  {option.title}
                </h3>
                <p className="mt-4 max-w-[520px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">
                  {option.copy}
                </p>
                <div className="mt-8 grid gap-0 border-y border-[var(--margin-border-subtle)] sm:grid-cols-2">
                  {option.items.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2 border-b border-[var(--margin-border-subtle)] py-3 text-[14px] leading-6 text-[var(--margin-text-secondary)] last:border-b-0 sm:pr-5"
                    >
                      <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--margin-primary)]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-2">
                  <p className="text-[30px] font-semibold tracking-[-0.065em] text-[var(--margin-text-primary)]">
                    {option.price}
                  </p>
                  {option.subPrice && (
                    <p className="mt-1 text-[14px] font-medium text-[var(--margin-text-muted)]">
                      {option.subPrice}
                    </p>
                  )}
                  <Button
                    onClick={() => onAuditCta(option.ctaLocation)}
                    className="mt-5 h-12 rounded-[8px] bg-[var(--margin-blue)] px-5 text-[14px] font-semibold text-white hover:bg-[var(--margin-blue-hover)]"
                  >
                    {option.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            {...revealProps}
            className="mt-8 border-l border-[var(--margin-border)] pl-5"
          >
            <p className="text-[17px] font-semibold tracking-[-0.025em] text-[var(--margin-text-primary)]">
              Not ready to continue? That is fine.
            </p>
            <p className="mt-2 text-[15px] leading-7 text-[var(--margin-text-secondary)]">
              The Recovery Audit is free. Review what was found, then decide whether you want the work managed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section 5 — Why recoveries stall */}
      <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-32 md:py-56">
        <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <motion.div {...revealProps}>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px w-8 bg-[var(--margin-border-strong)]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-primary)]">
                  A finding is not a recovery
                </span>
              </div>
              <h2 className="font-lora text-[44px] leading-[0.98] tracking-[-0.045em] text-[var(--margin-text-primary)] md:text-[76px]" style={{ fontWeight: 400 }}>
                Finding the issue does not get the money back.
              </h2>
              <p className="mt-6 text-[17px] leading-8 tracking-[-0.015em] text-[var(--margin-text-secondary)] md:text-[19px]">
                Amazon may ask for an invoice, shipment details, proof of delivery, inventory records, or the history of what was already submitted. Miss one part, lose the thread, or miss the timing, and a recoverable issue can become another unresolved case.
              </p>
            </motion.div>

            <motion.div
              {...revealProps}
              transition={{ ...revealProps.transition, delay: 0.08 }}
              className="border-y border-[var(--margin-border)] bg-transparent"
            >
              <div className="border-b border-[var(--margin-border)] px-5 py-4 md:px-7">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
                  Amazon may ask for
                </p>
              </div>
              <div className="divide-y divide-[var(--margin-border-subtle)] px-5 md:px-7">
                {evidenceRequests.map((item, index) => (
                  <motion.div
                    key={item.title}
                    {...revealProps}
                    transition={{
                      ...revealProps.transition,
                      delay: 0.12 + index * 0.05,
                    }}
                    className="grid gap-2 py-4 sm:grid-cols-[180px_1fr] sm:items-start"
                  >
                    <h3 className="text-[14px] font-bold uppercase tracking-tight text-[var(--margin-text-primary)]">
                      {item.title}
                    </h3>
                    <p className="text-[14px] leading-6 text-[var(--margin-text-secondary)]">
                      {item.copy}
                    </p>
                  </motion.div>
                ))}
              </div>
              <div className="border-t border-[var(--margin-border)] bg-[var(--margin-canvas)] px-5 py-5 md:px-7">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-primary)]">
                  Margin keeps the recovery record together
                </p>
                <p className="mt-3 text-[20px] font-semibold tracking-[-0.035em] text-[var(--margin-text-primary)]">
                  {"Issue -> Evidence -> Case -> Response -> Payout"}
                </p>
                <p className="mt-3 text-[14px] leading-6 text-[var(--margin-text-secondary)]">
                  So you can see what is ready, what is missing, and what happens next—without reconstructing the case from five different places.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 6 — See why the finding exists */}
      <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-surface)] py-32 md:py-56">
        <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <motion.div {...revealProps}>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px w-8 bg-[var(--margin-border-strong)]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-primary)]">
                  No black-box numbers
                </span>
              </div>
              <h2 className="font-lora text-[44px] leading-[0.98] tracking-[-0.045em] text-[var(--margin-text-primary)] md:text-[76px]" style={{ fontWeight: 400 }}>
                See what was checked, why the issue was flagged, what proof is ready, and how the amount was calculated.
              </h2>
              <p className="mt-6 text-[17px] leading-8 tracking-[-0.015em] text-[var(--margin-text-secondary)] md:text-[19px]">
                You should not have to take a recovery estimate on faith. Every finding is tied to the records Margin used to identify and assess it.
              </p>
              <div className="mt-10 flex flex-col items-start gap-4">
                <Button
                  onClick={() => onAuditCta("homepage_inspectability")}
                  className="h-14 rounded-[8px] bg-[var(--margin-blue)] px-8 text-[15px] font-semibold text-white hover:bg-[var(--margin-blue-hover)]"
                >
                  Run a Free Recovery Audit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-[13px] text-[var(--margin-text-muted)]">
                  Free to run. No recovery commission. No claim submitted without your approval.
                </p>
              </div>
            </motion.div>

            <motion.div
              {...revealProps}
              transition={{ ...revealProps.transition, delay: 0.08 }}
              className="grid gap-0 border-y border-[var(--margin-border)] lg:grid-cols-2"
            >
              <div className="p-6 lg:border-r lg:border-[var(--margin-border)] col-span-2 lg:col-span-1">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
                  Audit result panel
                </p>
                <div className="mt-5 divide-y divide-[var(--margin-border-subtle)]">
                  {auditTrustItems.map(([label, detail]) => (
                    <div key={label} className="py-4 first:pt-0 last:pb-0">
                      <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">
                        {label}
                      </h3>
                      <p className="mt-1 text-[13px] leading-6 text-[var(--margin-text-secondary)]">
                        {detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 7 — Keep your account and decisions yours */}
              <div className="border-t border-[var(--margin-border)] p-6 lg:border-t-0 col-span-2 lg:col-span-1 bg-[var(--margin-canvas)]">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
                  Your visibility
                </p>
                <h3 className="mt-5 text-[22px] font-lora font-medium tracking-tight text-[var(--margin-text-primary)]">
                  Get help without handing over your account.
                </h3>
                <p className="mt-4 text-[14px] leading-6 text-[var(--margin-text-secondary)]">
                  Margin can examine the records needed for the Audit, organize the recovery work, and keep the status visible. You decide whether anything is submitted and what happens next.
                </p>
                <div className="mt-8 space-y-5">
                  {controlItems.map((item) => (
                    <div
                      key={item.title}
                      className="flex flex-col gap-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--margin-blue)]" />
                        <span className="text-[14px] font-semibold text-[var(--margin-text-primary)]">{item.title}</span>
                      </div>
                      <p className="pl-3 text-[13px] text-[var(--margin-text-secondary)] leading-5">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecoveryDecisionSectionsProps {
  onAuditCta: (location: string) => void;
}

const pathOptions = [
  {
    label: "RECOVER ONCE",
    title: "One problem. One engagement.",
    copy: "Have Margin manage the recovery opportunities identified in your audit.",
    price: "Starting from $99",
    cta: "Recover These Issues",
    ctaLocation: "homepage_recover_once",
    items: [
      "Fixed one-time price",
      "Evidence preparation",
      "Claim preparation",
      "Follow-up",
      "Eligible appeal handling",
      "Payout verification",
    ],
  },
  {
    label: "RECOVERY WORKSPACE",
    title: "Keep Margin working.",
    copy: "For sellers who want ongoing recovery monitoring instead of dealing with each issue as it appears.",
    price: "$119/month",
    cta: "Activate Recovery Workspace",
    ctaLocation: "homepage_recovery_workspace",
    items: [
      "Continuous monitoring",
      "Recurring audits",
      "New recovery opportunities",
      "Evidence readiness",
      "Case continuity",
      "Payout and recovery tracking",
    ],
  },
];

const evidenceRequests = [
  {
    title: "Invoice",
    copy: "Supplier documentation for the affected units.",
  },
  {
    title: "Shipment records",
    copy: "What was shipped, when, and under which shipping plan.",
  },
  {
    title: "Proof of delivery",
    copy: "Confirmation that the shipment reached the fulfillment center.",
  },
  {
    title: "Inventory records",
    copy: "What Amazon received, adjusted, lost, damaged, or reimbursed.",
  },
  {
    title: "Case history",
    copy: "What was already submitted, what Amazon responded, and what still needs to be resolved.",
  },
];

const auditTrustItems = [
  ["Records reviewed", "See what Margin actually examined."],
  ["Why it was flagged", "Understand why a recovery was identified."],
  ["Evidence status", "See what is ready and what is still missing."],
  ["Recovery value", "See how the estimated amount was calculated."],
  ["Case status", "Know what has been submitted, answered, or still needs attention."],
];

const controlItems = [
  "Read-only Amazon access",
  "Seller approval before recovery submission",
  "Clear recovery status",
  "Payout verification",
  "No hidden recovery percentage",
  "No payment required to run the audit",
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
      <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-surface)] py-32 md:py-56">
        <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
          <motion.div {...revealProps} className="max-w-[780px]">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-[var(--margin-border-strong)]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-primary)]">
                Your next step
              </span>
            </div>
            <h2 className="text-[44px] font-bold leading-[0.98] tracking-[-0.075em] text-[var(--margin-text-primary)] md:text-[76px]">
              Found something? Choose how you want to handle it.
            </h2>
            <p className="mt-6 max-w-[720px] text-[17px] leading-8 tracking-[-0.015em] text-[var(--margin-text-secondary)] md:text-[19px]">
              Some sellers want one problem handled. Others want Margin
              watching for the next one. Choose what fits your account.
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
                  <Button
                    onClick={() => onAuditCta(option.ctaLocation)}
                    className="mt-5 h-12 rounded-[8px] bg-[var(--margin-primary)] px-5 text-[14px] font-semibold text-white hover:bg-[var(--margin-primary-hover)]"
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
              Not ready to pay?
            </p>
            <p className="mt-2 text-[15px] leading-7 text-[var(--margin-text-secondary)]">
              Your Recovery Audit is free. Review the findings and decide what
              makes sense for you.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-32 md:py-56">
        <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <motion.div {...revealProps}>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px w-8 bg-[var(--margin-border-strong)]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-primary)]">
                  Where recoveries break down
                </span>
              </div>
              <h2 className="text-[44px] font-bold leading-[0.98] tracking-[-0.075em] text-[var(--margin-text-primary)] md:text-[76px]">
                Finding the problem is only the beginning.
              </h2>
              <p className="mt-6 text-[17px] leading-8 tracking-[-0.015em] text-[var(--margin-text-secondary)] md:text-[19px]">
                Amazon may ask for the right evidence, the right quantities,
                the right dates, or the right case history. The hard part is
                putting everything together before the opportunity disappears.
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
                    <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">
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
                  Margin organizes the recovery
                </p>
                <p className="mt-3 text-[20px] font-semibold tracking-[-0.035em] text-[var(--margin-text-primary)]">
                  {"Issue -> Evidence -> Case -> Response -> Payout"}
                </p>
                <p className="mt-3 text-[14px] leading-6 text-[var(--margin-text-secondary)]">
                  So you&apos;re not rebuilding the same evidence trail every
                  time Amazon asks for it.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-surface)] py-32 md:py-56">
        <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <motion.div {...revealProps}>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px w-8 bg-[var(--margin-border-strong)]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-primary)]">
                  Built around your records
                </span>
              </div>
              <h2 className="text-[44px] font-bold leading-[0.98] tracking-[-0.075em] text-[var(--margin-text-primary)] md:text-[76px]">
                See exactly what Margin found.
              </h2>
              <p className="mt-6 text-[17px] leading-8 tracking-[-0.015em] text-[var(--margin-text-secondary)] md:text-[19px]">
                Margin doesn&apos;t ask you to take a recovery on faith. Every
                finding is tied back to the records used to identify it.
              </p>
              <Button
                onClick={() => onAuditCta("homepage_inspectability")}
                className="mt-8 h-12 rounded-[8px] bg-[var(--margin-primary)] px-5 text-[14px] font-semibold text-white hover:bg-[var(--margin-primary-hover)]"
              >
                Run Free Recovery Audit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div
              {...revealProps}
              transition={{ ...revealProps.transition, delay: 0.08 }}
              className="grid gap-0 border-y border-[var(--margin-border)] lg:grid-cols-2"
            >
              <div className="p-6 lg:border-r lg:border-[var(--margin-border)]">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
                  Your audit
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

              <div className="border-t border-[var(--margin-border)] p-6 lg:border-t-0">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
                  You stay in control
                </p>
                <div className="mt-5 space-y-3">
                  {controlItems.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 text-[14px] leading-6 text-[var(--margin-text-secondary)]"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--margin-primary)]" />
                      <span>{item}</span>
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

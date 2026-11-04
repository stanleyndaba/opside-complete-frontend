import { motion, useReducedMotion } from 'framer-motion';

type JourneyVisualKind = 'consent' | 'review' | 'handoff';

type ReviewJourneyVisualProps = {
  kind: JourneyVisualKind;
};

const visualCopy: Record<JourneyVisualKind, { eyebrow: string; title: string; image: string; alt: string }> = {
  consent: {
    eyebrow: 'Step 1 · Review terms',
    title: 'You remain in control.',
    image: '/journey-step-consent.png',
    alt: 'A defined review area where records are examined within a clear boundary while another person observes.',
  },
  review: {
    eyebrow: 'Step 2 · Financial review',
    title: 'Margin follows the evidence.',
    image: '/journey-step-review.png',
    alt: 'People tracing a connected trail of records from warehouse activity through evidence and financial records.',
  },
  handoff: {
    eyebrow: 'Step 3 · File handoff',
    title: 'Send what you already have.',
    image: '/journey-step-handoff.png',
    alt: 'A careful handoff of organized Amazon records from one person to a reviewer across a controlled desk.',
  },
};

export function ReviewJourneyVisual({ kind }: ReviewJourneyVisualProps) {
  const reduceMotion = useReducedMotion();
  const copy = visualCopy[kind];

  return (
    <div className="mb-7" aria-label={`${copy.eyebrow}: ${copy.title}`}>
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]"><span className="h-1.5 w-1.5 rounded-full bg-[#0B74DE]" aria-hidden="true" />{copy.eyebrow}</div>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={reduceMotion ? undefined : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto flex min-h-[190px] w-full max-w-[620px] items-center justify-center overflow-hidden rounded-[4px] bg-white sm:min-h-[230px]"
      >
        <img src={copy.image} alt={copy.alt} className="block h-auto w-full max-w-[620px] object-contain" />
      </motion.div>
    </div>
  );
}

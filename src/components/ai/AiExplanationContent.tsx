import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AiExplanation } from '@/lib/api';

type AiExplanationContentProps = {
  loading: boolean;
  error: string | null;
  explanation: AiExplanation | null;
  onRetry?: () => void;
};

type SectionProps = {
  label: string;
  children: React.ReactNode;
};

function Section({ label, children }: SectionProps) {
  return (
    <section className="border-b border-white/8 py-4 last:border-b-0">
      <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.34]">{label}</div>
      <div className="mt-2 text-[13px] font-sans leading-6 tracking-tight text-white/[0.76]">{children}</div>
    </section>
  );
}

export function AiExplanationContent({
  loading,
  error,
  explanation,
  onRetry,
}: AiExplanationContentProps) {
  if (loading) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <Loader2 className="h-4 w-4 animate-spin text-white/40" />
        <div className="text-[11px] font-sans font-medium uppercase tracking-tight text-white/[0.52]">
          Explaining...
        </div>
        <p className="max-w-md text-[12px] font-sans leading-5 tracking-tight text-white/[0.42]">
          Margin is translating the current backend truth into seller-friendly language.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6">
        <div className="flex items-start gap-3 border border-red-500/20 bg-red-500/[0.04] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 text-red-200/70" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-sans font-medium uppercase tracking-tight text-red-100/80">
              Explanation unavailable
            </div>
            <p className="mt-1 text-[12px] font-sans leading-5 tracking-tight text-red-50/78">{error}</p>
            {onRetry ? (
              <Button
                variant="ghost"
                onClick={onRetry}
                className="mt-2 h-auto px-0 py-0 text-[11px] font-sans font-medium tracking-tight text-white underline decoration-white/25 underline-offset-4 hover:bg-transparent hover:text-white"
              >
                Try again
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="px-6 py-8 text-[12px] font-sans leading-5 tracking-tight text-white/[0.5]">
        No explanation is available for this record yet.
      </div>
    );
  }

  const missingItems = Array.isArray(explanation.what_is_missing) ? explanation.what_is_missing.filter(Boolean) : [];

  return (
    <div className="px-6 py-2">
      <Section label="Summary">{explanation.summary}</Section>
      <Section label="What Margin Found">{explanation.what_margin_found}</Section>
      <Section label="Why This Matters">{explanation.why_it_matters}</Section>
      <Section label="Current Status">{explanation.current_status_explained}</Section>
      <Section label="Missing Evidence / Blockers">
        {missingItems.length > 0 ? (
          <ul className="space-y-2">
            {missingItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-[7px] h-1 w-1 rounded-full bg-white/45" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span>No missing evidence or blockers were recorded in the backend truth for this explanation.</span>
        )}
      </Section>
      <Section label="What Happens Next">{explanation.what_happens_next}</Section>
      <Section label="Note">
        <div className="space-y-2">
          <p>{explanation.confidence_note}</p>
          <p className="text-[12px] font-sans leading-5 tracking-tight text-white/[0.48]">
            {explanation.source_of_truth_notice}
          </p>
        </div>
      </Section>
    </div>
  );
}

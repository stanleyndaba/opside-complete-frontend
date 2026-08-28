import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { PageLayout } from '@/components/layout/PageLayout';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { Button } from '@/components/ui/button';
import { usePageMeta } from '@/hooks/usePageMeta';
import { api, RecoverOnceEngagement, RecoverOnceEngagementStatus } from '@/lib/api';

const statusCopy: Record<RecoverOnceEngagementStatus, { label: string; title: string; body: string; next: string }> = {
  active: { label: 'Active', title: 'Your Recover Once engagement is active.', body: 'Margin has recorded the verified one-time engagement and is preparing the evidence-backed next steps.', next: 'Margin is preparing the recovery work.' },
  preparing: { label: 'Preparing recovery', title: 'Margin is preparing your recovery workspace.', body: 'Margin is reviewing your evidence, organising the recovery work, and preparing the next steps.', next: 'No filing has occurred. Seller approval remains required.' },
  ready_for_review: { label: 'Ready for review', title: 'Your recovery work is ready for review.', body: 'Margin has prepared the recorded scope for your review. Review the evidence before deciding whether to approve the next step.', next: 'Ready for review does not mean Amazon has accepted a claim.' },
  awaiting_seller_approval: { label: 'Awaiting your approval', title: 'Your approval is required before the next step.', body: 'The prepared recovery operation is waiting for your explicit seller decision.', next: 'Nothing is filed with Amazon without your approval.' },
  in_progress: { label: 'In progress', title: 'Your recovery operation is in progress.', body: 'Margin is working through the approved recovery scope and recording the evidence and operational state.', next: 'In progress does not guarantee reimbursement.' },
  completed: { label: 'Completed', title: 'Your Recover Once operation is complete.', body: 'Margin has recorded the completion state for this one-time engagement.', next: 'Any reimbursement outcome remains subject to Amazon and the available evidence.' },
  cancelled: { label: 'Cancelled', title: 'This Recover Once engagement is cancelled.', body: 'No further recovery operation is being represented for this engagement.', next: 'No filing or reimbursement is implied by this status.' },
  exception: { label: 'Needs attention', title: 'This engagement needs attention.', body: 'Margin has recorded an exception while preparing or operating this engagement.', next: 'Review the recorded reason or contact support before taking another action.' },
};

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function RecoverOnceEngagement() {
  const { engagementId, tenantSlug } = useParams<{ engagementId: string; tenantSlug: string }>();
  const navigate = useNavigate();
  const [engagement, setEngagement] = useState<RecoverOnceEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  usePageMeta({ title: 'Recover Once | Margin', description: 'Review the persistent state of your one-time Margin recovery engagement.' });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!engagementId) {
        setError('Recover Once engagement reference is missing.');
        setLoading(false);
        return;
      }
      const response = await api.getRecoverOnceEngagement(engagementId, tenantSlug);
      if (cancelled) return;
      if (!response.ok || !response.data?.success) setError(response.error || 'Margin could not load this Recover Once engagement.');
      else setEngagement(response.data.engagement);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [engagementId, tenantSlug]);

  const state = engagement ? statusCopy[engagement.status] : null;
  const opportunities = engagement?.scope_snapshot?.opportunities || [];
  const categories = engagement?.scope_snapshot?.categories || [];

  async function approve() {
    if (!engagement || approving) return;
    setApproving(true);
    const response = await api.approveRecoverOnceEngagement(engagement.id, tenantSlug);
    if (response.ok && response.data?.success) setEngagement(response.data.engagement);
    else setError(response.error || 'Margin could not record your approval.');
    setApproving(false);
  }

  return (
    <PageLayout title="Recover Once" noPadding hideNavbar hideSidebar hideLogo plainBackground>
      <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#182026]">
        <PublicNavbar variant="light" />
        <main className="mx-auto max-w-5xl px-6 pb-24 pt-32 md:pt-40">
          {loading ? (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-[#66737F]" role="status"><Loader2 className="h-5 w-5 animate-spin" /> Restoring your Recover Once engagement...</div>
          ) : error ? (
            <section className="mx-auto max-w-2xl rounded-[18px] border border-rose-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(37,49,58,0.08)]"><XCircle className="mx-auto h-8 w-8 text-rose-600" /><h1 className="mt-4 font-lora text-3xl">Engagement needs attention.</h1><p className="mt-3 text-sm leading-6 text-[#66737F]">{error}</p><Button onClick={() => navigate('/audit')} className="mt-6 rounded-full bg-[#0B74DE]">Return to Audit<ArrowRight className="ml-2 h-4 w-4" /></Button></section>
          ) : engagement && state ? (
            <>
              <div className="mb-10 max-w-3xl"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0B74DE]">Recover Once · One-time engagement</p><h1 className="mt-4 font-lora text-4xl leading-tight tracking-[-0.04em] md:text-6xl">{state.title}</h1><p className="mt-5 max-w-2xl text-base leading-7 text-[#66737F]">{state.body}</p></div>
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-[18px] border border-[#DCE8EE] bg-white p-6 shadow-[0_20px_60px_rgba(37,49,58,0.06)]"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-[#2E7D5B]" /><span className="rounded-full border border-[#BFD8EA] bg-[#F3F8FC] px-3 py-1 text-xs font-semibold text-[#0B74DE]">{state.label}</span></div><div className="mt-8 grid gap-5 border-t border-[#E4EDF1] pt-6 sm:grid-cols-2"><div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#66737F]">Preparation started</p><p className="mt-2 text-sm font-semibold">{formatDate(engagement.preparation_started_at)}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#66737F]">Last updated</p><p className="mt-2 text-sm font-semibold">{formatDate(engagement.updated_at)}</p></div></div><div className="mt-7 rounded-[12px] border border-[#E4EDF1] bg-[#F8FAFC] p-4"><div className="flex gap-3"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#0B74DE]" /><p className="text-sm leading-6 text-[#4D5B66]">{state.next}</p></div></div>{engagement.status === 'awaiting_seller_approval' ? <Button onClick={() => void approve()} disabled={approving} className="mt-6 w-full rounded-[10px] bg-[#0B74DE]">{approving ? 'Recording approval...' : 'Approve the prepared next step'}<ArrowRight className="ml-2 h-4 w-4" /></Button> : null}</section>
                <aside className="rounded-[18px] border border-[#DCE8EE] bg-[#FBFAF7] p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#66737F]">What this purchase means</p><h2 className="mt-3 font-lora text-2xl">A recovery operation for this audit.</h2><p className="mt-3 text-sm leading-6 text-[#66737F]">Recover Once is separate from the recurring Recovery Workspace subscription. This page reflects the paid engagement linked to the recorded audit scope.</p><div className="mt-6 space-y-3 text-sm text-[#4D5B66]"><div className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-[#2E7D5B]" />Evidence remains tied to this engagement.</div><div className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-[#2E7D5B]" />Seller approval is required before filing.</div><div className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-[#2E7D5B]" />Reimbursement is never guaranteed.</div></div><div className="mt-7 border-t border-[#E4EDF1] pt-6"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#66737F]">Recorded scope</p><p className="mt-2 text-sm font-semibold">{opportunities.length} evidence-backed finding{opportunities.length === 1 ? '' : 's'}</p><p className="mt-2 text-xs leading-5 text-[#66737F]">{categories.length ? categories.join(', ') : 'Scope categories will appear as preparation progresses.'}</p></div><Button asChild className="mt-7 w-full rounded-[10px] bg-[#0B74DE]"><Link to="/audit">Review audit record<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></aside>
              </div>
            </>
          ) : null}
        </main>
        <BrandFooter />
      </div>
    </PageLayout>
  );
}

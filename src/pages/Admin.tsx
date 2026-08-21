import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  api,
  type ManualBroadcastAudienceType,
  type ManualUserBroadcastInput,
  type ManualUserBroadcastRecord,
  type ProductUpdateInput,
  type ProductUpdateRecord
} from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';
import { ArrowUpRight, Loader2, Mail, Megaphone, Send, ShieldCheck, Users } from 'lucide-react';

type PublishMode = 'draft' | 'publish';
type AdminAccessState = 'checking' | 'allowed' | 'denied';

const INITIAL_FORM = {
  title: '',
  slug: '',
  summary: '',
  body: '',
  tag: 'Platform',
  highlights: '',
  cta_text: 'View Product Update',
  cta_href: '/whats-new',
  notify_in_app: true,
  notify_email: true
};

const INITIAL_BROADCAST_FORM = {
  subject: '',
  heading: '',
  summary: '',
  body: '',
  highlights: '',
  cta_label: '',
  cta_url: '',
  audience_type: 'test_emails' as ManualBroadcastAudienceType,
  audience_emails: ''
};

function cleanSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function splitHighlights(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function splitEmails(value: string): string[] {
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .filter((item, index, all) => all.indexOf(item) === index)
    .slice(0, 250);
}

function formatDate(value?: string | null): string {
  if (!value) return 'Not sent yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function cleanServerMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const message = value.trim();
  if (!message) return null;
  return message.replace(/^[A-Z0-9_]+:/, '').trim();
}

function apiFailureMessage(response: { error?: string; data?: unknown }, fallback: string): string {
  const body = response.data && typeof response.data === 'object'
    ? response.data as Record<string, unknown>
    : null;

  return (
    cleanServerMessage(body?.message) ||
    cleanServerMessage(response.error) ||
    fallback
  );
}

export default function Admin() {
  const [adminAccess, setAdminAccess] = useState<AdminAccessState>('checking');
  const isAdmin = adminAccess === 'allowed';
  const [form, setForm] = useState(INITIAL_FORM);
  const [broadcastForm, setBroadcastForm] = useState(INITIAL_BROADCAST_FORM);
  const [savedUpdate, setSavedUpdate] = useState<ProductUpdateRecord | null>(null);
  const [savedBroadcast, setSavedBroadcast] = useState<ManualUserBroadcastRecord | null>(null);
  const [latestUpdates, setLatestUpdates] = useState<ProductUpdateRecord[]>([]);
  const [broadcastJob, setBroadcastJob] = useState<any>(null);
  const [loading, setLoading] = useState<PublishMode | null>(null);
  const [broadcastLoading, setBroadcastLoading] = useState<'draft' | 'test' | 'send' | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const { tenant } = useTenant();
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const location = useLocation();
  const routeSlugMatch = location.pathname.match(/^\/app\/([^/]+)/);
  const activeSlug =
    normalizeTenantSlug(tenant?.slug) ||
    normalizeTenantSlug(tenantSlug) ||
    normalizeTenantSlug(routeSlugMatch?.[1]);

  const usersIntegrationsHref = tenantRoute(activeSlug, '/admin/users-integrations');
  const whatsNewHref = tenantRoute(activeSlug, '/whats-new');

  useEffect(() => {
    let isMounted = true;

    const loadAdminAccess = async () => {
      const response = await api.checkProductUpdateAdminAccess();
      if (!isMounted) return;

      setAdminAccess(
        response.ok && response.data?.success && response.data.data?.allowed
          ? 'allowed'
          : 'denied'
      );
    };

    void loadAdminAccess();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void loadLatestUpdates();
    }
  }, [activeSlug, isAdmin]);

  const resolvedSlug = useMemo(() => {
    return cleanSlug(form.slug || form.title);
  }, [form.slug, form.title]);

  const updatePayload = (): ProductUpdateInput => ({
    title: form.title.trim(),
    slug: resolvedSlug || undefined,
    summary: form.summary.trim(),
    body: form.body.trim() || null,
    tag: form.tag.trim() || null,
    highlights: splitHighlights(form.highlights),
    cta_text: form.cta_text.trim() || null,
    cta_href: form.cta_href.trim() || null,
    notify_in_app: form.notify_in_app,
    notify_email: form.notify_email
  });

  const broadcastPayload = (): ManualUserBroadcastInput => ({
    subject: broadcastForm.subject.trim(),
    heading: broadcastForm.heading.trim(),
    summary: broadcastForm.summary.trim() || null,
    body: broadcastForm.body.trim(),
    highlights: splitHighlights(broadcastForm.highlights),
    cta_label: broadcastForm.cta_label.trim() || null,
    cta_url: broadcastForm.cta_url.trim() || null,
    audience_type: broadcastForm.audience_type,
    audience_payload: {
      emails: splitEmails(broadcastForm.audience_emails)
    }
  });

  const audienceLabel = useMemo(() => {
    if (broadcastForm.audience_type === 'all_users') return 'All users with an email address';
    if (broadcastForm.audience_type === 'active_users') return 'Active users only';
    const count = splitEmails(broadcastForm.audience_emails).length;
    return `${count} selected test email${count === 1 ? '' : 's'}`;
  }, [broadcastForm.audience_type, broadcastForm.audience_emails]);

  const loadLatestUpdates = async () => {
    setLoadingLatest(true);
    try {
      const response = await api.getProductUpdates(activeSlug || undefined);
      if (response.ok && response.data?.success) {
        setLatestUpdates(response.data.data || []);
      }
    } finally {
      setLoadingLatest(false);
    }
  };

  const submitUpdate = async (mode: PublishMode) => {
    setError(null);
    setSuccess(null);
    setBroadcastJob(null);

    const payload = updatePayload();
    if (!payload.title || !payload.summary) {
      setError('Title and summary are required before saving a product update.');
      return;
    }

    setLoading(mode);
    try {
      let update = savedUpdate;
      if (update && update.status !== 'published') {
        const response = await api.updateProductUpdate(update.id, payload);
        if (!response.ok || !response.data?.success) {
          throw new Error(apiFailureMessage(response, 'Failed to update product update draft'));
        }
        update = response.data.data;
      } else {
        const response = await api.createProductUpdate(payload);
        if (!response.ok || !response.data?.success) {
          throw new Error(apiFailureMessage(response, 'Failed to create product update draft'));
        }
        update = response.data.data;
      }

      if (mode === 'publish') {
        const publishResponse = await api.publishProductUpdate(update.id);
        if (!publishResponse.ok || !publishResponse.data?.success) {
          throw new Error(apiFailureMessage(publishResponse, 'Failed to publish product update'));
        }
        update = publishResponse.data.data;
        setBroadcastJob(publishResponse.data.broadcast_job || null);
        setSuccess('Published. Margin is now broadcasting this update through Agent 10.');
      } else {
        setSuccess('Draft saved. No users were notified.');
      }

      setSavedUpdate(update);
      await loadLatestUpdates();
    } catch (err: any) {
      setError(err?.message || 'Product update action failed');
    } finally {
      setLoading(null);
    }
  };

  const saveBroadcastDraft = async () => {
    setBroadcastError(null);
    setBroadcastSuccess(null);

    const payload = broadcastPayload();
    if (!payload.subject || !payload.heading || !payload.body) {
      setBroadcastError('Subject, heading, and body are required before saving a user broadcast.');
      return null;
    }
    if (payload.audience_type === 'test_emails' && !payload.audience_payload?.emails?.length) {
      setBroadcastError('Add at least one selected/test email before saving this broadcast.');
      return null;
    }

    setBroadcastLoading('draft');
    try {
      const response = savedBroadcast?.status === 'draft'
        ? await api.updateManualUserBroadcast(savedBroadcast.id, payload)
        : await api.createManualUserBroadcast(payload);

      if (!response.ok || !response.data?.success) {
        throw new Error(apiFailureMessage(response, 'Failed to save user broadcast draft'));
      }

      setSavedBroadcast(response.data.data);
      setBroadcastSuccess('User Broadcast draft saved. No users were emailed.');
      return response.data.data;
    } catch (err: any) {
      setBroadcastError(err?.message || 'Failed to save user broadcast draft');
      return null;
    } finally {
      setBroadcastLoading(null);
    }
  };

  const testSendBroadcast = async () => {
    setBroadcastError(null);
    setBroadcastSuccess(null);

    const emails = splitEmails(broadcastForm.audience_emails);
    if (!emails.length) {
      setBroadcastError('Add one or more selected/test emails before sending a test.');
      return;
    }

    const broadcast = await saveBroadcastDraft();
    if (!broadcast?.id) return;

    setBroadcastLoading('test');
    try {
      const response = await api.testSendManualUserBroadcast(broadcast.id, emails);
      if (!response.ok || !response.data?.success) {
        throw new Error(apiFailureMessage(response, 'Failed to send user broadcast test'));
      }

      setSavedBroadcast(response.data.data.broadcast);
      setBroadcastSuccess(`Test send complete: ${response.data.data.sent}/${response.data.data.attempted} delivered.`);
    } catch (err: any) {
      setBroadcastError(err?.message || 'Failed to send user broadcast test');
    } finally {
      setBroadcastLoading(null);
    }
  };

  const sendBroadcast = async () => {
    setBroadcastError(null);
    setBroadcastSuccess(null);

    const broadcast = await saveBroadcastDraft();
    if (!broadcast?.id) return;

    const recipientCount = broadcast.recipient_count_preview ?? 0;
    const confirmed = window.confirm(
      `Send this User Broadcast to ${recipientCount} recipient${recipientCount === 1 ? '' : 's'}?\n\nAudience: ${audienceLabel}\n\nThis creates durable delivery records and cannot be silently undone.`
    );
    if (!confirmed) return;

    setBroadcastLoading('send');
    try {
      const response = await api.sendManualUserBroadcast(broadcast.id);
      if (!response.ok || !response.data?.success) {
        throw new Error(apiFailureMessage(response, 'Failed to send user broadcast'));
      }

      setSavedBroadcast(response.data.data);
      setBroadcastSuccess('User Broadcast send started. Delivery rows are being processed in the background.');
    } catch (err: any) {
      setBroadcastError(err?.message || 'Failed to send user broadcast');
    } finally {
      setBroadcastLoading(null);
    }
  };

  const fieldLabel = 'text-[11px] font-semibold text-[#51606C]';
  const fieldInput = 'border-[#DCE8EE] bg-white text-[#182026] placeholder:text-[#94A3AD] shadow-none focus-visible:border-[#0B74DE] focus-visible:ring-[#0B74DE]/15';
  const surface = 'rounded-2xl border border-[#DCE8EE] bg-white shadow-[0_1px_2px_rgba(24,32,38,0.025)]';

  if (adminAccess === 'checking') {
    return (
      <PageLayout title="Admin Control">
        <div className="-m-4 flex min-h-[50vh] items-center justify-center bg-[#FAFAF7] px-6 lg:-m-6">
          <div className="flex items-center gap-3 text-sm text-[#66737F]">
            <Loader2 className="h-4 w-4 animate-spin text-[#0B74DE]" />
            Verifying publication authority…
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!isAdmin) {
    return (
      <PageLayout title="Admin Control">
        <div className="-m-4 flex min-h-[50vh] items-center justify-center bg-[#FAFAF7] px-6 lg:-m-6">
          <div className="w-full max-w-md rounded-2xl border border-[#DCE8EE] bg-white p-8 text-center shadow-[0_12px_30px_rgba(24,32,38,0.05)]">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF6FE] text-[#0B74DE]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="mt-5 font-lora text-2xl font-normal tracking-tight text-[#182026]">Admin access required</h1>
            <p className="mt-3 text-sm leading-6 text-[#66737F]">
              This publication workspace is available only to active Margin platform administrators.
            </p>
            <Button asChild variant="outline" className="mt-6 border-[#DCE8EE] bg-white text-[#33414B] hover:bg-[#F5F8FA]">
              <Link to={whatsNewHref}>Open What’s New</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Admin Control">
      <div className="-m-4 min-h-screen bg-[#FAFAF7] text-[#182026] lg:-m-6">
        <div className="border-b border-[#DCE8EE] bg-white">
          <div className="mx-auto max-w-7xl px-5 py-8 sm:px-7 lg:px-9 lg:py-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-medium text-[#66737F]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#0B74DE]" />
                  Server-owned publication authority
                </div>
                <h1 className="mt-3 font-lora text-3xl font-normal tracking-tight text-[#182026] sm:text-4xl">Admin Control</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#66737F]">
                  Prepare product communications, manage their delivery boundary, and keep a durable record of what Margin has published.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-[#DCE8EE] bg-[#F8FBFD] px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF4FE] text-[#0B74DE]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#182026]">Publication access</div>
                  <div className="mt-0.5 text-xs text-[#66737F]">Verified by Margin server authority</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
          <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
            <main className="space-y-7">
              <section className={surface}>
                <div className="flex flex-col gap-4 border-b border-[#E5EDF1] px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF4FE] text-[#0B74DE]">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-lora text-xl font-normal tracking-tight text-[#182026]">Product update</h2>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-[#66737F]">
                        Save a draft freely. Publishing establishes the seller-visible record and creates one durable broadcast job according to the channels selected below.
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit border-[#B7D8F4] bg-[#F1F8FE] text-[#1262A3]">Controlled publish</Badge>
                </div>

                <div className="space-y-6 p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className={fieldLabel}>Title</Label>
                      <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Product Updates Are Now Live" className={fieldInput} />
                    </div>
                    <div className="space-y-2">
                      <Label className={fieldLabel}>Slug</Label>
                      <Input value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} placeholder={resolvedSlug || 'Auto-generated from title'} className={fieldInput} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className={fieldLabel}>Summary</Label>
                    <Textarea value={form.summary} onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))} placeholder="A concise seller-facing explanation of what changed." className={'min-h-[92px] resize-none ' + fieldInput} />
                  </div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label className={fieldLabel}>Highlights</Label>
                      <Textarea value={form.highlights} onChange={(event) => setForm((prev) => ({ ...prev, highlights: event.target.value }))} placeholder={'One highlight per line\nKeep it to 2–5 concise points'} className={'min-h-[130px] ' + fieldInput} />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className={fieldLabel}>Detail</Label>
                        <Textarea value={form.body} onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))} placeholder="Optional operating context shown in What’s New and email context." className={'min-h-[82px] ' + fieldInput} />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className={fieldLabel}>Category</Label>
                          <Input value={form.tag} onChange={(event) => setForm((prev) => ({ ...prev, tag: event.target.value }))} placeholder="Platform" className={fieldInput} />
                        </div>
                        <div className="space-y-2">
                          <Label className={fieldLabel}>CTA destination</Label>
                          <Input value={form.cta_href} onChange={(event) => setForm((prev) => ({ ...prev, cta_href: event.target.value }))} placeholder="/whats-new" className={fieldInput} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#DCE8EE] bg-[#F8FBFD] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#182026]">
                      <ShieldCheck className="h-4 w-4 text-[#0B74DE]" />
                      Delivery boundary
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#66737F]">Choose the channels deliberately. The published record remains canonical even if both delivery channels are off.</p>
                    <div className="mt-4 grid grid-cols-1 divide-y divide-[#DCE8EE] md:grid-cols-2 md:divide-x md:divide-y-0">
                      <label className="flex items-center justify-between gap-4 py-3 md:py-1 md:pr-5">
                        <span>
                          <span className="block text-sm font-medium text-[#182026]">In-app notification</span>
                          <span className="mt-1 block text-xs leading-5 text-[#66737F]">Create notification records and realtime updates.</span>
                        </span>
                        <Switch checked={form.notify_in_app} onCheckedChange={(value) => setForm((prev) => ({ ...prev, notify_in_app: value }))} />
                      </label>
                      <label className="flex items-center justify-between gap-4 pt-3 md:pl-5 md:pt-1">
                        <span>
                          <span className="block text-sm font-medium text-[#182026]">Email broadcast</span>
                          <span className="mt-1 block text-xs leading-5 text-[#66737F]">Send a rollout email through Agent 10.</span>
                        </span>
                        <Switch checked={form.notify_email} onCheckedChange={(value) => setForm((prev) => ({ ...prev, notify_email: value }))} />
                      </label>
                    </div>
                  </div>

                  {error && <div className="rounded-xl border border-[#F3C8C8] bg-[#FFF7F7] px-4 py-3 text-sm leading-6 text-[#A33A3A]">{error}</div>}
                  {success && <div className="rounded-xl border border-[#C7E8D1] bg-[#F3FBF5] px-4 py-3 text-sm leading-6 text-[#277545]">{success}</div>}

                  <div className="flex flex-wrap items-center gap-3 border-t border-[#E5EDF1] pt-5">
                    <Button type="button" disabled={!isAdmin || loading !== null} onClick={() => submitUpdate('draft')} variant="outline" className="border-[#DCE8EE] bg-white text-[#33414B] hover:bg-[#F5F8FA]">
                      {loading === 'draft' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save draft
                    </Button>
                    <Button type="button" disabled={!isAdmin || loading !== null} onClick={() => submitUpdate('publish')} className="bg-[#0B74DE] text-white hover:bg-[#0967C5]">
                      {loading === 'publish' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Megaphone className="mr-2 h-4 w-4" />}
                      Publish update
                    </Button>
                    <Button asChild variant="ghost" className="text-[#52606B] hover:bg-[#F1F6F9] hover:text-[#182026]">
                      <Link to={whatsNewHref}>Open What’s New <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  </div>

                  {(savedUpdate || broadcastJob) && (
                    <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#DCE8EE] bg-[#F8FBFD] p-4 sm:grid-cols-3">
                      <div><div className="text-[11px] font-medium text-[#66737F]">Current record</div><div className="mt-1 break-all font-mono text-xs text-[#33414B]">{savedUpdate?.slug || 'Not available'}</div></div>
                      <div><div className="text-[11px] font-medium text-[#66737F]">Publication status</div><div className="mt-1 text-sm font-semibold text-[#182026]">{savedUpdate?.status || 'Not available'}</div></div>
                      <div><div className="text-[11px] font-medium text-[#66737F]">Broadcast job</div><div className="mt-1 text-sm font-semibold text-[#182026]">{broadcastJob?.status || 'Not started'}</div></div>
                    </div>
                  )}
                </div>
              </section>

              <section className={surface}>
                <div className="flex gap-3 border-b border-[#E5EDF1] px-5 py-5 sm:px-6">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F6FA] text-[#52606B]"><Mail className="h-4 w-4" /></div>
                  <div>
                    <h2 className="font-lora text-xl font-normal tracking-tight text-[#182026]">User broadcast</h2>
                    <p className="mt-1 text-sm leading-6 text-[#66737F]">Compose a direct message from Margin. Drafts, test sends, and final sends are intentionally separate actions.</p>
                  </div>
                </div>
                <div className="space-y-6 p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label className={fieldLabel}>Subject</Label><Input value={broadcastForm.subject} onChange={(event) => setBroadcastForm((prev) => ({ ...prev, subject: event.target.value }))} placeholder="A quick update from Margin" className={fieldInput} /></div>
                    <div className="space-y-2"><Label className={fieldLabel}>Heading</Label><Input value={broadcastForm.heading} onChange={(event) => setBroadcastForm((prev) => ({ ...prev, heading: event.target.value }))} placeholder="A quick update from Margin" className={fieldInput} /></div>
                  </div>
                  <div className="space-y-2"><Label className={fieldLabel}>Summary / intro</Label><Textarea value={broadcastForm.summary} onChange={(event) => setBroadcastForm((prev) => ({ ...prev, summary: event.target.value }))} placeholder="Short context before the main message. Omit if the body is enough." className={'min-h-[80px] resize-none ' + fieldInput} /></div>
                  <div className="space-y-2"><Label className={fieldLabel}>Body</Label><Textarea value={broadcastForm.body} onChange={(event) => setBroadcastForm((prev) => ({ ...prev, body: event.target.value }))} placeholder="Write the direct message. Keep it specific, calm, and useful." className={'min-h-[140px] ' + fieldInput} /></div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="space-y-2"><Label className={fieldLabel}>Optional highlights</Label><Textarea value={broadcastForm.highlights} onChange={(event) => setBroadcastForm((prev) => ({ ...prev, highlights: event.target.value }))} placeholder={'One note per line\nExample: No action needed'} className={'min-h-[112px] ' + fieldInput} /></div>
                    <div className="space-y-4">
                      <div className="space-y-2"><Label className={fieldLabel}>Audience</Label><select value={broadcastForm.audience_type} onChange={(event) => setBroadcastForm((prev) => ({ ...prev, audience_type: event.target.value as ManualBroadcastAudienceType }))} className="h-10 w-full rounded-md border border-[#DCE8EE] bg-white px-3 text-sm text-[#182026] outline-none focus:border-[#0B74DE] focus:ring-2 focus:ring-[#0B74DE]/15"><option value="test_emails">Selected / test emails</option><option value="all_users">All users</option><option value="active_users">Active users only</option></select></div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="space-y-2"><Label className={fieldLabel}>CTA label</Label><Input value={broadcastForm.cta_label} onChange={(event) => setBroadcastForm((prev) => ({ ...prev, cta_label: event.target.value }))} placeholder="CTA label" className={fieldInput} /></div><div className="space-y-2"><Label className={fieldLabel}>CTA destination</Label><Input value={broadcastForm.cta_url} onChange={(event) => setBroadcastForm((prev) => ({ ...prev, cta_url: event.target.value }))} placeholder="/app or https://…" className={fieldInput} /></div></div>
                    </div>
                  </div>

                  <div className="space-y-2"><Label className={fieldLabel}>Selected / test emails</Label><Textarea value={broadcastForm.audience_emails} onChange={(event) => setBroadcastForm((prev) => ({ ...prev, audience_emails: event.target.value }))} placeholder={'mvelocloud7@gmail.com\nanother@example.com'} className={'min-h-[86px] ' + fieldInput} /></div>

                  <div className="rounded-xl border border-[#DCE8EE] bg-[#F8FBFD] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><div className="text-[11px] font-medium text-[#66737F]">Audience preview</div><div className="mt-1 text-sm font-semibold text-[#182026]">{audienceLabel}</div></div>
                      <Badge variant="outline" className="border-[#DCE8EE] bg-white text-[#52606B]">{savedBroadcast?.recipient_count_preview ?? 'Save'} recipients</Badge>
                    </div>
                    <div className="mt-4 rounded-lg border border-[#DCE8EE] bg-white p-4">
                      <div className="text-[11px] font-medium text-[#66737F]">Email preview</div>
                      <div className="mt-2 text-lg font-semibold text-[#182026]">{savedBroadcast?.preview?.email_heading || broadcastForm.heading || 'Heading preview'}</div>
                      {(savedBroadcast?.preview?.email_summary || broadcastForm.summary) && <div className="mt-2 text-sm leading-6 text-[#66737F]">{savedBroadcast?.preview?.email_summary || broadcastForm.summary}</div>}
                      <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#52606B]">{savedBroadcast?.preview?.email_body || broadcastForm.body || 'Body preview appears here after you write the message.'}</div>
                      {(savedBroadcast?.preview?.email_highlights?.length || splitHighlights(broadcastForm.highlights).length) ? <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[#66737F]">{(savedBroadcast?.preview?.email_highlights || splitHighlights(broadcastForm.highlights)).map((item) => <li key={item}>{item}</li>)}</ul> : null}
                    </div>
                  </div>

                  {broadcastError && <div className="rounded-xl border border-[#F3C8C8] bg-[#FFF7F7] px-4 py-3 text-sm leading-6 text-[#A33A3A]">{broadcastError}</div>}
                  {broadcastSuccess && <div className="rounded-xl border border-[#C7E8D1] bg-[#F3FBF5] px-4 py-3 text-sm leading-6 text-[#277545]">{broadcastSuccess}</div>}

                  <div className="flex flex-wrap items-center gap-3 border-t border-[#E5EDF1] pt-5">
                    <Button type="button" disabled={!isAdmin || broadcastLoading !== null} onClick={saveBroadcastDraft} variant="outline" className="border-[#DCE8EE] bg-white text-[#33414B] hover:bg-[#F5F8FA]">{broadcastLoading === 'draft' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save draft</Button>
                    <Button type="button" disabled={!isAdmin || broadcastLoading !== null} onClick={testSendBroadcast} variant="outline" className="border-[#B7D8F4] bg-[#F1F8FE] text-[#1262A3] hover:bg-[#E7F3FD]">{broadcastLoading === 'test' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}Send test</Button>
                    <Button type="button" disabled={!isAdmin || broadcastLoading !== null} onClick={sendBroadcast} className="bg-[#0B74DE] text-white hover:bg-[#0967C5]">{broadcastLoading === 'send' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Confirm and send</Button>
                  </div>

                  {savedBroadcast && <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#DCE8EE] bg-[#F8FBFD] p-4 text-sm sm:grid-cols-4"><div><div className="text-[11px] font-medium text-[#66737F]">Broadcast</div><div className="mt-1 truncate font-mono text-xs text-[#33414B]">{savedBroadcast.id}</div></div><div><div className="text-[11px] font-medium text-[#66737F]">Status</div><div className="mt-1 font-semibold text-[#182026]">{savedBroadcast.status}</div></div><div><div className="text-[11px] font-medium text-[#66737F]">Sent</div><div className="mt-1 font-semibold text-[#182026]">{savedBroadcast.sent_count || 0}/{savedBroadcast.recipient_count || 0}</div></div><div><div className="text-[11px] font-medium text-[#66737F]">Failed</div><div className="mt-1 font-semibold text-[#182026]">{savedBroadcast.failed_count || 0}</div></div></div>}
                </div>
              </section>
            </main>

            <aside className="space-y-5 xl:sticky xl:top-6">
              <section className={surface}>
                <div className="p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F0F6FA] text-[#52606B]"><Users className="h-4 w-4" /></div>
                  <h2 className="mt-4 font-lora text-xl font-normal tracking-tight text-[#182026]">Users & integrations</h2>
                  <p className="mt-2 text-sm leading-6 text-[#66737F]">Manage user access, waitlist entries, and integration truth in the dedicated operations workspace.</p>
                  <Button asChild variant="outline" className="mt-5 w-full border-[#DCE8EE] bg-white text-[#33414B] hover:bg-[#F5F8FA]"><Link to={usersIntegrationsHref}>Open operations <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
                </div>
              </section>

              <section className={surface}>
                <div className="border-b border-[#E5EDF1] px-5 py-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#0B74DE]" /><h2 className="font-lora text-xl font-normal tracking-tight text-[#182026]">Published records</h2></div><p className="mt-2 text-sm leading-6 text-[#66737F]">Read-only confirmation from the public Product Updates API.</p></div>
                <div className="space-y-3 p-4">
                  {loadingLatest && <div className="flex items-center gap-2 px-1 py-2 text-sm text-[#66737F]"><Loader2 className="h-4 w-4 animate-spin text-[#0B74DE]" />Loading published updates…</div>}
                  {!loadingLatest && latestUpdates.length === 0 && <div className="rounded-xl border border-dashed border-[#DCE8EE] bg-[#FAFAF7] p-4 text-sm leading-6 text-[#66737F]">No published updates yet.</div>}
                  {!loadingLatest && latestUpdates.slice(0, 4).map((update) => <article key={update.id} className="rounded-xl border border-[#E5EDF1] bg-[#FCFDFC] p-4"><div className="text-sm font-semibold leading-5 text-[#182026]">{update.title}</div><div className="mt-1 text-sm leading-5 text-[#66737F]">{update.summary}</div><div className="mt-3 space-y-1 text-xs text-[#66737F]"><div>Published {formatDate(update.published_at)}</div><div>Broadcast {formatDate(update.broadcasted_at)}</div></div></article>)}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

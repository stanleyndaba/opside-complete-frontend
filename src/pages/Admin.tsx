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
import { api, type ProductUpdateInput, type ProductUpdateRecord } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';
import { ArrowUpRight, Loader2, Megaphone, ShieldCheck, Users } from 'lucide-react';

type PublishMode = 'draft' | 'publish';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [savedUpdate, setSavedUpdate] = useState<ProductUpdateRecord | null>(null);
  const [latestUpdates, setLatestUpdates] = useState<ProductUpdateRecord[]>([]);
  const [broadcastJob, setBroadcastJob] = useState<any>(null);
  const [loading, setLoading] = useState<PublishMode | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    try {
      setIsAdmin(localStorage.getItem('clario.admin') === 'true');
    } catch {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    void loadLatestUpdates();
  }, [activeSlug]);

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

  const toggleAdmin = (value: boolean) => {
    setIsAdmin(value);
    try {
      localStorage.setItem('clario.admin', value ? 'true' : 'false');
    } catch {
      // Local admin mode is a UI convenience; server-side admin checks still apply.
    }
  };

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

  return (
    <PageLayout title="Admin Control" midnight>
      <div className="min-h-screen bg-[#050505] relative overflow-hidden -m-4 lg:-m-6 text-white">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.07),transparent_65%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.025] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-12 space-y-6">
          <header className="border-b border-white/10 pb-8">
            <div className="flex items-center gap-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">
              <div className="h-px w-8 bg-white/25" />
              Admin surface
            </div>
            <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-sans font-bold tracking-tight text-white">
                  Margin Control
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50 font-sans">
                  A small operator console for product rollouts and user/integration control. Drafts do not notify users; publishing is the broadcast trigger.
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div>
                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">Admin mode</div>
                  <div className="text-sm font-sans font-bold text-white">{isAdmin ? 'Enabled' : 'Locked'}</div>
                </div>
                <Switch checked={isAdmin} onCheckedChange={toggleAdmin} />
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <Card className="rounded-3xl border-white/10 bg-[#0b0b0b] text-white shadow-2xl">
              <CardHeader className="border-b border-white/10 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm font-sans font-bold uppercase tracking-tight text-white">
                      <Megaphone className="h-4 w-4" />
                      Product Updates
                    </CardTitle>
                    <CardDescription className="mt-2 max-w-xl text-xs leading-5 text-white/45">
                      Create the Latest Changes record, then publish when you want Agent 10 to send in-app and email rollout notifications.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                    Publish sends
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                {!isAdmin && (
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-xs leading-5 text-amber-100/80">
                    Enable admin mode to use this console. The backend still requires a real admin account or internal API permission before publishing.
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-tight text-white/40">Title</Label>
                    <Input
                      value={form.title}
                      onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder="Product Updates Are Now Live"
                      className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-tight text-white/40">Slug</Label>
                    <Input
                      value={form.slug}
                      onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
                      placeholder={resolvedSlug || 'auto-generated-from-title'}
                      className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-tight text-white/40">Summary</Label>
                  <Textarea
                    variant="dark"
                    value={form.summary}
                    onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
                    placeholder="A concise seller-facing explanation of what shipped."
                    className="min-h-[92px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-tight text-white/40">Highlights</Label>
                    <Textarea
                      variant="dark"
                      value={form.highlights}
                      onChange={(event) => setForm((prev) => ({ ...prev, highlights: event.target.value }))}
                      placeholder={'One highlight per line\nKeep it to 2-5 bullets'}
                      className="min-h-[128px]"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-tight text-white/40">Body</Label>
                      <Textarea
                        variant="dark"
                        value={form.body}
                        onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
                        placeholder="Optional detail shown on What's New and in email context."
                        className="min-h-[80px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={form.tag}
                        onChange={(event) => setForm((prev) => ({ ...prev, tag: event.target.value }))}
                        placeholder="Tag"
                        className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
                      />
                      <Input
                        value={form.cta_href}
                        onChange={(event) => setForm((prev) => ({ ...prev, cta_href: event.target.value }))}
                        placeholder="/whats-new"
                        className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 md:grid-cols-2">
                  <label className="flex items-center justify-between gap-4">
                    <span>
                      <span className="block text-sm font-sans font-bold text-white">In-app notification</span>
                      <span className="block text-xs text-white/40">Create notification records and realtime updates.</span>
                    </span>
                    <Switch
                      checked={form.notify_in_app}
                      onCheckedChange={(value) => setForm((prev) => ({ ...prev, notify_in_app: value }))}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4">
                    <span>
                      <span className="block text-sm font-sans font-bold text-white">Email broadcast</span>
                      <span className="block text-xs text-white/40">Send rollout email through Agent 10.</span>
                    </span>
                    <Switch
                      checked={form.notify_email}
                      onCheckedChange={(value) => setForm((prev) => ({ ...prev, notify_email: value }))}
                    />
                  </label>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/[0.08] p-4 text-xs leading-5 text-red-100">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.08] p-4 text-xs leading-5 text-emerald-100">
                    {success}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
                  <Button
                    type="button"
                    disabled={!isAdmin || loading !== null}
                    onClick={() => submitUpdate('draft')}
                    variant="outline"
                    className="border-white/15 bg-white/[0.02] text-white hover:bg-white/10"
                  >
                    {loading === 'draft' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save draft
                  </Button>
                  <Button
                    type="button"
                    disabled={!isAdmin || loading !== null}
                    onClick={() => submitUpdate('publish')}
                    className="bg-white text-black hover:bg-white/85"
                  >
                    {loading === 'publish' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Megaphone className="mr-2 h-4 w-4" />}
                    Publish and send
                  </Button>
                  <Button asChild variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white">
                    <Link to={whatsNewHref}>
                      Open What's New
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {(savedUpdate || broadcastJob) && (
                  <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/60 md:grid-cols-3">
                    <div>
                      <div className="uppercase tracking-tight text-white/30">Current record</div>
                      <div className="mt-1 font-mono text-white/80">{savedUpdate?.slug || 'Not available'}</div>
                    </div>
                    <div>
                      <div className="uppercase tracking-tight text-white/30">Status</div>
                      <div className="mt-1 font-mono text-white/80">{savedUpdate?.status || 'Not available'}</div>
                    </div>
                    <div>
                      <div className="uppercase tracking-tight text-white/30">Broadcast job</div>
                      <div className="mt-1 font-mono text-white/80">{broadcastJob?.status || 'Not started'}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-3xl border-white/10 bg-[#0b0b0b] text-white">
                <CardHeader className="border-b border-white/10 px-6 py-5">
                  <CardTitle className="flex items-center gap-2 text-sm font-sans font-bold uppercase tracking-tight">
                    <Users className="h-4 w-4" />
                    Users & Integrations
                  </CardTitle>
                  <CardDescription className="mt-2 text-xs leading-5 text-white/45">
                    The only retained admin operations page. Manage users, account access, waitlist entries, and integration truth from there.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Button asChild className="w-full bg-white text-black hover:bg-white/85">
                    <Link to={usersIntegrationsHref}>
                      Open Users & Integrations
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-white/10 bg-[#0b0b0b] text-white">
                <CardHeader className="border-b border-white/10 px-6 py-5">
                  <CardTitle className="flex items-center gap-2 text-sm font-sans font-bold uppercase tracking-tight">
                    <ShieldCheck className="h-4 w-4" />
                    Published Records
                  </CardTitle>
                  <CardDescription className="mt-2 text-xs leading-5 text-white/45">
                    Read-only confirmation from the public Product Updates API.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-6">
                  {loadingLatest && (
                    <div className="flex items-center gap-2 text-xs text-white/45">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading published updates...
                    </div>
                  )}
                  {!loadingLatest && latestUpdates.length === 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-xs leading-5 text-white/45">
                      No published updates yet.
                    </div>
                  )}
                  {!loadingLatest && latestUpdates.slice(0, 4).map((update) => (
                    <div key={update.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <div className="text-sm font-sans font-bold text-white">{update.title}</div>
                      <div className="mt-1 text-xs leading-5 text-white/45">{update.summary}</div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-tight text-white/35">
                        <span>Published {formatDate(update.published_at)}</span>
                        <span>Broadcast {formatDate(update.broadcasted_at)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

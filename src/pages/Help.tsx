import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';

const faqs = [
  {
    id: '1',
    question: 'How do you calculate the service fee?',
    answer: 'Service fees apply only to money that is actually recovered and billed. The Billing page shows the recorded fee state for your tenant.',
  },
  {
    id: '2',
    question: 'Is it safe to connect my store?',
    answer: 'Yes. The connection is restricted to the data required for recoveries and monitoring. It does not allow store operations like changing listings or placing orders.',
  },
  {
    id: '3',
    question: 'How long do recoveries usually take?',
    answer: 'Recovery timing varies by claim type and Amazon processing. Use the case and recovery pages for current status rather than treating this help text as a timeline guarantee.',
  },
  {
    id: '4',
    question: 'Where can I see billing and payout history?',
    answer: 'Use the Billing page for invoices and the recovery surfaces for payout and reconciliation status.',
  },
  {
    id: '5',
    question: 'What issue types do you monitor?',
    answer: 'The platform monitors inventory loss, warehouse damage, inbound discrepancies, refunds without return, fee anomalies, and related reimbursement gaps.',
  },
  {
    id: '6',
    question: 'Do I need to file claims manually?',
    answer: 'The platform is designed to support filing workflows once evidence and account setup are in place. Manual review can still be required for some cases.',
  },
];

type SupportHistoryItem = {
  request_id: string;
  status: string;
  category: string;
  subject: string;
  severity?: string | null;
  created_at: string;
};

const formatLabel = (value: string | null | undefined) =>
  value
    ? value.replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, (char) => char.toUpperCase())
    : 'Unknown';

const formatTimestamp = (value: string | null | undefined) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const supportTierText: Record<'community' | 'email' | 'priority' | 'dedicated', { title: string; detail: string }> = {
  community: {
    title: 'Community Tier',
    detail: 'Tracked requests can be submitted here. Direct email remains a manual email action and is not presented as monitored ticketing.',
  },
  email: {
    title: 'Email Support Tier',
    detail: 'Tracked requests can be submitted here and followed up by email when needed.',
  },
  priority: {
    title: 'Priority Support Tier',
    detail: 'Tracked requests can be submitted here. Your tenant is flagged for priority support handling in plan settings.',
  },
  dedicated: {
    title: 'Dedicated Support Tier',
    detail: 'Tracked requests can be submitted here. Dedicated support handling exists at the tenant-plan level, but this page does not claim a separate live desk channel.',
  },
};

export default function Help() {
  const [searchTerm, setSearchTerm] = useState('');
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: '',
    message: '',
    additionalContext: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [requests, setRequests] = useState<SupportHistoryItem[]>([]);
  const [lastSubmitted, setLastSubmitted] = useState<SupportHistoryItem | null>(null);
  const { toast } = useToast();
  const { tenant, planLimits, isReady } = useTenant();

  const filteredFaqs = useMemo(
    () =>
      faqs.filter((faq) => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return true;
        return faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query);
      }),
    [searchTerm]
  );

  const tier = planLimits?.supportTier || 'community';

  useEffect(() => {
    if (!isReady || !tenant) return;
    let cancelled = false;

    (async () => {
      setLoadingHistory(true);
      setHistoryError(null);
      try {
        const response = await api.getSupportRequests(10);
        if (!response.ok || !response.data?.success) {
          throw new Error(response.error || 'Failed to load support requests.');
        }
        if (!cancelled) {
          setRequests(response.data.requests || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setHistoryError(err?.message || 'Failed to load support requests.');
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, tenant]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactForm.subject || !contactForm.category || !contactForm.message) {
      toast({
        title: 'Please fill in the required fields',
        description: 'Subject, topic, and message are required before a support request can be submitted.',
        variant: 'destructive',
      });
      return;
    }

    if (!tenant) {
      toast({
        title: 'Workspace context required',
        description: 'Support requests can only be submitted when a tenant workspace is active.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.createSupportRequest({
        category: contactForm.category,
        subject: contactForm.subject,
        message: contactForm.message,
        additional_context: contactForm.additionalContext || undefined,
        source_page: 'help',
        metadata: {
          tenant_slug: tenant.slug,
          tenant_name: tenant.name,
        },
      });

      if (!response.ok || !response.data?.success || !response.data?.request) {
        throw new Error(response.error || 'Failed to submit support request.');
      }

      const submittedRequest = response.data.request;
      setLastSubmitted(submittedRequest);
      setRequests((current) => [submittedRequest, ...current.filter((item) => item.request_id !== submittedRequest.request_id)]);
      setContactForm({
        subject: '',
        category: '',
        message: '',
        additionalContext: '',
      });

      toast({
        title: `Request submitted: ${submittedRequest.request_id.slice(0, 8)}`,
        description: `Status: ${formatLabel(submittedRequest.status)}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Support request failed',
        description: err?.message || 'The request could not be submitted.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout title="Help" midnight>
      <div className="relative min-h-screen overflow-hidden bg-[#050505]">
        <div className="absolute inset-x-0 inset-y-[-100px] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

        <div className="relative max-w-5xl mx-auto px-8 py-12">
          <div className="border-b border-white/10 pb-10 mb-10 text-center">
            <div className="text-[10px] font-sans font-medium text-white/30 tracking-tight uppercase">Support Console</div>
            <h1 className="mt-2 text-4xl md:text-5xl font-light font-sans text-white tracking-tight">
              Help <span className="text-white/40">and guidance</span>
            </h1>
            <p className="mt-4 max-w-3xl mx-auto text-sm md:text-base font-sans text-white/45 leading-relaxed tracking-tight">
              Use this page for static help guidance, tracked support requests, and direct email contact. Tracked requests are persisted to your active workspace.
            </p>
          </div>

          <div className="space-y-8">
            <section className="space-y-8">
              <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] overflow-hidden shadow-2xl">
                <div className="border-b border-white/10 px-8 py-6">
                  <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/30">Static Help Guidance</div>
                  <div className="mt-2 text-sm font-sans text-white">Search local knowledge-base guidance. This section is static help content, not live support workflow status.</div>
                </div>

                <div className="p-8">
                  <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                    <Input
                      placeholder="Search help guidance"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-12 rounded-2xl border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm font-sans text-white placeholder:text-white/15 focus:border-white/20"
                    />
                  </div>

                  <Accordion type="single" collapsible className="w-full space-y-3">
                    {filteredFaqs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id} className="rounded-2xl border border-white/10 bg-white/[0.02] px-5">
                        <AccordionTrigger className="py-5 text-left text-sm font-sans text-white hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="pb-5 text-sm font-sans text-white/45 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {filteredFaqs.length === 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-8 text-center text-sm font-sans text-white/35">
                      No help guidance matched that search.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] overflow-hidden shadow-2xl">
                <div className="border-b border-white/10 px-8 py-6">
                  <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/30">Support Request</div>
                  <div className="mt-2 text-sm font-sans text-white">Submit a tracked support request bound to your active tenant and user context.</div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-sans text-white/60">
                    <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Support Tier</div>
                    <div className="mt-2 text-white">{supportTierText[tier].title}</div>
                    <div className="mt-1 text-white/55">{supportTierText[tier].detail}</div>
                    {tenant ? <div className="mt-2 text-white/35">Workspace: {tenant.name}</div> : null}
                  </div>
                </div>

                <form onSubmit={handleContactSubmit} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/35">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="Short summary of the issue"
                      className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-sm font-sans text-white placeholder:text-white/15 focus:border-white/20"
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/35">
                        Topic
                      </Label>
                      <Select value={contactForm.category} onValueChange={(value) => setContactForm({ ...contactForm, category: value })}>
                        <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-sm font-sans text-white focus:ring-0 focus:border-white/20">
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-white/10 bg-[#0c0c0c] text-white">
                          <SelectItem value="billing">Billing and invoices</SelectItem>
                          <SelectItem value="technical">App support</SelectItem>
                          <SelectItem value="account">Account management</SelectItem>
                          <SelectItem value="recovery">Claim and recovery support</SelectItem>
                          <SelectItem value="general">General question</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="additional-context" className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/35">
                        Additional Context
                      </Label>
                      <Input
                        id="additional-context"
                        value={contactForm.additionalContext}
                        onChange={(e) => setContactForm({ ...contactForm, additionalContext: e.target.value })}
                        placeholder="Optional case, invoice, or workflow reference"
                        className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-sm font-sans text-white placeholder:text-white/15 focus:border-white/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/35">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Describe the issue, page, workflow, or claim context."
                      rows={6}
                      className="resize-none rounded-2xl border-white/10 bg-white/[0.03] text-sm font-sans text-white placeholder:text-white/15 focus:border-white/20"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting || !isReady || !tenant}
                    className="h-12 rounded-2xl border border-white/10 bg-white text-black hover:bg-white/90 font-sans font-medium text-[11px] uppercase tracking-tight px-8"
                  >
                    {submitting ? 'Submitting Request' : 'Submit Support Request'}
                  </Button>

                  {lastSubmitted && (
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-4 text-sm font-sans text-blue-100">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-blue-200/80">Latest Request</div>
                      <div className="mt-2">Request ID: {lastSubmitted.request_id}</div>
                      <div className="mt-1">Status: {formatLabel(lastSubmitted.status)}</div>
                      <div className="mt-1 text-blue-100/75">Submitted {formatTimestamp(lastSubmitted.created_at)}. Follow-up happens through recorded support handling, not a live chat workflow on this page.</div>
                    </div>
                  )}
                </form>
              </div>
            </section>

            <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] overflow-hidden shadow-2xl">
              <div className="border-b border-white/10 px-8 py-6">
                <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/30">Recent Requests</div>
                <div className="mt-2 text-sm font-sans text-white">This list shows real persisted support requests for the current user in the active tenant.</div>
              </div>
              <div className="p-8 space-y-4">
                {loadingHistory ? (
                  <div className="text-sm font-sans text-white/45">Loading support requests...</div>
                ) : historyError ? (
                  <div className="text-sm font-sans text-red-300">{historyError}</div>
                ) : requests.length === 0 ? (
                  <div className="text-sm font-sans text-white/45">No tracked support requests exist for this tenant/user yet.</div>
                ) : (
                  requests.map((request) => (
                    <div key={request.request_id} className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">{request.request_id}</div>
                          <div className="mt-2 text-sm font-sans text-white">{request.subject}</div>
                          <div className="mt-1 text-xs font-sans text-white/45">{formatLabel(request.category)}</div>
                        </div>
                        <div className="text-left md:text-right">
                          <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">{formatLabel(request.status)}</div>
                          <div className="mt-2 text-xs font-sans text-white/45">{formatTimestamp(request.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] overflow-hidden shadow-2xl text-center">
              <div className="border-b border-white/10 px-8 py-6">
                <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/30">Direct Email Contact</div>
                <div className="mt-2 text-sm font-sans text-white">This opens your email client. It is a direct email action, not an in-app tracked ticket workflow.</div>
              </div>
              <div className="p-8 space-y-6">
                <a
                  href="mailto:usersupport@margin-finance.com"
                  className="block text-lg font-sans text-white hover:text-white/80 transition-colors break-all"
                >
                  usersupport@margin-finance.com
                </a>
                <div className="text-sm font-sans text-white/60">For tracked request IDs and request status, use the support request form above.</div>
                <div className="space-y-2">
                  <div className="text-sm font-sans text-white/55">Direct email is available as a manual contact channel.</div>
                  <div className="text-sm font-sans text-white/55">Support handling varies by tenant support tier.</div>
                  <div className="text-sm font-sans text-white/55">This page does not claim live chat, phone support, or guaranteed response timing.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

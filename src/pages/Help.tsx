import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
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
  message: string;
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
  const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});
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

  const toggleRequest = (requestId: string) => {
    setExpandedRequests((current) => ({
      ...current,
      [requestId]: !current[requestId],
    }));
  };

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

        <div className="relative max-w-6xl mx-auto px-8 py-12">
          <div className="border-b border-white/10 pb-10">
            <div className="text-[10px] font-sans font-medium text-white/30 tracking-tight uppercase">Support Console</div>
            <h1 className="mt-3 text-4xl md:text-5xl font-light font-sans text-white tracking-tight">
              Help <span className="text-white/40">and guidance</span>
            </h1>
            <p className="mt-5 max-w-4xl text-sm md:text-base font-sans text-white/45 leading-relaxed tracking-tight">
              Use this page for static help guidance, tracked support requests, and direct email contact. Tracked requests are persisted to your active workspace.
            </p>
          </div>

          <div className="space-y-14 pt-10">
            <section className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="space-y-8">
                <div>
                  <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/30">Static Help Guidance</div>
                  <div className="mt-3 text-sm font-sans text-white">Search local knowledge-base guidance. This section is static help content, not live support workflow status.</div>
                </div>

                <div className="relative">
                  <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <Input
                    placeholder="Search help guidance"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-14 rounded-none border-0 border-b border-white/10 bg-transparent pl-8 pr-0 text-sm font-sans text-white placeholder:text-white/15 focus-visible:ring-0 focus-visible:border-white/30"
                  />
                </div>

                <Accordion type="single" collapsible className="w-full border-t border-white/10">
                  {filteredFaqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id} className="border-b border-white/10">
                      <AccordionTrigger className="py-5 text-left text-sm font-sans text-white hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="pb-5 pr-10 text-sm font-sans text-white/45 leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {filteredFaqs.length === 0 && (
                  <div className="border-b border-t border-white/10 py-8 text-sm font-sans text-white/35">
                    No help guidance matched that search.
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-8 lg:border-t-0 lg:border-l lg:pl-10">
                <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/30">Support Tier</div>
                <div className="mt-4 text-2xl font-sans font-light text-white tracking-tight">{supportTierText[tier].title}</div>
                <div className="mt-3 text-sm font-sans text-white/55 leading-relaxed">{supportTierText[tier].detail}</div>
                {tenant ? <div className="mt-5 text-sm font-sans text-white/35">Workspace: {tenant.name}</div> : null}
              </div>
            </section>

            <section className="border-t border-white/10 pt-10">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(260px,0.55fr)]">
                <div>
                  <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/30">Support Request</div>
                  <div className="mt-3 text-sm font-sans text-white">Submit a tracked support request bound to your active tenant and user context.</div>
                </div>
                <div className="text-sm font-sans text-white/45 leading-relaxed">
                  Tracked requests are persisted to your active workspace and surfaced below with their current request status.
                </div>
              </div>

              <form onSubmit={handleContactSubmit} className="mt-10 space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="subject" className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/35">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="Short summary of the issue"
                      className="h-14 rounded-none border-0 border-b border-white/10 bg-transparent px-0 text-sm font-sans text-white placeholder:text-white/15 focus-visible:ring-0 focus-visible:border-white/30"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/35">
                      Topic
                    </Label>
                    <Select value={contactForm.category} onValueChange={(value) => setContactForm({ ...contactForm, category: value })}>
                      <SelectTrigger className="h-14 rounded-none border-0 border-b border-white/10 bg-transparent px-0 text-sm font-sans text-white focus:ring-0 focus:border-white/30">
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-white/10 bg-[#0c0c0c] text-white">
                        <SelectItem value="billing">Billing and invoices</SelectItem>
                        <SelectItem value="technical">App support</SelectItem>
                        <SelectItem value="account">Account management</SelectItem>
                        <SelectItem value="recovery">Claim and recovery support</SelectItem>
                        <SelectItem value="general">General question</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="additional-context" className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/35">
                    Additional Context
                  </Label>
                  <Input
                    id="additional-context"
                    value={contactForm.additionalContext}
                    onChange={(e) => setContactForm({ ...contactForm, additionalContext: e.target.value })}
                    placeholder="Optional case, invoice, or workflow reference"
                    className="h-14 rounded-none border-0 border-b border-white/10 bg-transparent px-0 text-sm font-sans text-white placeholder:text-white/15 focus-visible:ring-0 focus-visible:border-white/30"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="message" className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/35">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Describe the issue, page, workflow, or claim context."
                    rows={7}
                    className="resize-none rounded-none border-0 border-b border-white/10 bg-transparent px-0 text-sm font-sans text-white placeholder:text-white/15 focus-visible:ring-0 focus-visible:border-white/30"
                  />
                </div>

                <div className="flex flex-col gap-6 border-t border-white/10 pt-8">
                  <Button
                    type="submit"
                    disabled={submitting || !isReady || !tenant}
                    className="h-12 w-full rounded-none border border-white/10 bg-white text-black hover:bg-white/90 font-sans font-medium text-[11px] uppercase tracking-tight md:w-auto md:min-w-[240px]"
                  >
                    {submitting ? 'Submitting Request' : 'Submit Support Request'}
                  </Button>

                  {lastSubmitted && (
                    <div className="border-l border-blue-500/40 pl-5 text-sm font-sans text-blue-100">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-blue-200/70">Latest Request</div>
                      <div className="mt-3">Request ID: {lastSubmitted.request_id}</div>
                      <div className="mt-1">Status: {formatLabel(lastSubmitted.status)}</div>
                      <div className="mt-2 text-blue-100/75">Submitted {formatTimestamp(lastSubmitted.created_at)}. Follow-up happens through recorded support handling, not a live chat workflow on this page.</div>
                    </div>
                  )}
                </div>
              </form>
            </section>

            <section className="border-t border-white/10 pt-10">
              <div>
                <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/30">Recent Requests</div>
                <div className="mt-3 text-sm font-sans text-white">This list shows real persisted support requests for the current user in the active tenant.</div>
              </div>

              <div className="mt-8">
                {loadingHistory ? (
                  <div className="py-6 text-sm font-sans text-white/45">Loading support requests...</div>
                ) : historyError ? (
                  <div className="py-6 text-sm font-sans text-red-300">{historyError}</div>
                ) : requests.length === 0 ? (
                  <div className="py-6 text-sm font-sans text-white/45">No tracked support requests exist for this tenant/user yet.</div>
                ) : (
                  <div className="border-t border-white/10">
                    {requests.map((request) => (
                      <div key={request.request_id} className="border-b border-white/10 py-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">{request.request_id}</div>
                              <div className="mt-3 text-xl font-sans font-light text-white tracking-tight">{request.subject}</div>
                              <div className="mt-2 text-xs font-sans text-white/45 uppercase tracking-tight">{formatLabel(request.category)}</div>
                            </div>
                            <div className="flex items-center gap-5 md:items-start">
                              <div className="text-left md:text-right">
                                <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">{formatLabel(request.status)}</div>
                                <div className="mt-3 text-xs font-sans text-white/45">{formatTimestamp(request.created_at)}</div>
                              </div>
                              <button
                                type="button"
                                aria-expanded={!!expandedRequests[request.request_id]}
                                aria-label={expandedRequests[request.request_id] ? 'Hide request message' : 'Show request message'}
                                onClick={() => toggleRequest(request.request_id)}
                                className="inline-flex h-10 w-10 items-center justify-center text-white/55 transition-colors hover:text-white"
                              >
                                {expandedRequests[request.request_id] ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {expandedRequests[request.request_id] && (
                            <div className="max-w-3xl space-y-3 border-t border-white/10 pt-4">
                              <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/30">
                                Submitted Message
                              </div>
                              <div className="whitespace-pre-wrap text-sm font-sans text-white/78 leading-relaxed">
                                {request.message?.trim() || 'No message was recorded for this request.'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="border-t border-white/10 pt-10">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,1fr)]">
                <div>
                  <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/30">Direct Email Contact</div>
                  <div className="mt-3 text-sm font-sans text-white">This opens your email client. It is a direct email action, not an in-app tracked ticket workflow.</div>
                </div>

                <div className="space-y-5">
                  <a
                    href="mailto:usersupport@margin-finance.com"
                    className="block text-2xl font-sans font-light text-white tracking-tight hover:text-white/80 transition-colors break-all"
                  >
                    usersupport@margin-finance.com
                  </a>
                  <div className="text-sm font-sans text-white/60">For tracked request IDs and request status, use the support request form above.</div>
                  <div className="space-y-2 text-sm font-sans text-white/55">
                    <div>Direct email is available as a manual contact channel.</div>
                    <div>Support handling varies by tenant support tier.</div>
                    <div>This page does not claim live chat, phone support, or guaranteed response timing.</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

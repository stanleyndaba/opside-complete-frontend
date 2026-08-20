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
    <PageLayout title="Help">
      <div className="min-h-screen bg-[#FAFAF7] text-[#111827]">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8 lg:py-8">
          <header className="flex flex-col gap-4 border-b border-[#DCE8EE] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Support workspace</p>
              <h1 className="mt-1.5 font-lora text-[34px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[38px]">
                Help and guidance
              </h1>
              <p className="mt-2.5 max-w-xl text-[14px] leading-6 text-[#66737F]">
                Search Margin guidance, submit a tracked request, and review the support record for this workspace.
              </p>
            </div>
            <p className="max-w-xs text-[12px] leading-5 text-[#66737F] sm:text-right">
              Tracked requests remain tied to your active workspace.
            </p>
          </header>

          <div className="mt-6 space-y-5">
            <section className="grid gap-6 rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_1px_2px_rgba(24,32,38,0.03)] lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.55fr)]">
              <div className="space-y-5">
                <div>
                  <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Help guidance</p>
                  <p className="mt-1.5 text-[13px] leading-5 text-[#66737F]">Search Margin guidance before opening a tracked request. This is reference material, not live request status.</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66737F]" aria-hidden="true" />
                  <Input
                    placeholder="Search help guidance"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 rounded-md border-[#DCE8EE] bg-[#FAFAF7] pl-9 pr-3 text-[13px] text-[#182026] placeholder:text-[#8A97A2] focus-visible:border-[#0B74DE] focus-visible:ring-2 focus-visible:ring-[#0B74DE]/15"
                  />
                </div>

                <Accordion type="single" collapsible className="w-full border-t border-[#E7EEF2]">
                  {filteredFaqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id} className="border-b border-[#E7EEF2]">
                      <AccordionTrigger className="py-3.5 text-left text-[14px] font-medium tracking-tight text-[#182026] hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="pb-3.5 pr-8 text-[13px] leading-5 text-[#66737F]">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {filteredFaqs.length === 0 && (
                  <div className="border-b border-t border-[#E7EEF2] py-5 text-[13px] text-[#66737F]">
                    No help guidance matched that search.
                  </div>
                )}
              </div>

              <div className="border-t border-[#DCE8EE] pt-5 lg:border-t-0 lg:border-l lg:pl-6">
                <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Support tier</p>
                <p className="mt-1.5 text-[16px] font-semibold tracking-tight text-[#182026]">{supportTierText[tier].title}</p>
                <p className="mt-2 text-[13px] leading-5 text-[#66737F]">{supportTierText[tier].detail}</p>
                {tenant ? <p className="mt-4 border-t border-[#E7EEF2] pt-3 text-[12px] text-[#66737F]">Workspace: <span className="font-medium text-[#34414B]">{tenant.name}</span></p> : null}
              </div>
            </section>

            <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
              <div className="grid gap-4 border-b border-[#DCE8EE] pb-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(260px,0.55fr)]">
                <div>
                  <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Support request</p>
                  <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-[#182026]">Open a tracked request</h2>
                  <p className="mt-1.5 text-[13px] leading-5 text-[#66737F]">Submit a request that remains bound to your active workspace and support record.</p>
                </div>
                <p className="text-[12px] leading-5 text-[#66737F] lg:pt-1">
                  Your submitted request and its current status will appear in the record below.
                </p>
              </div>

              <form onSubmit={handleContactSubmit} className="mt-5 space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-[12px] font-medium tracking-tight text-[#4D5B66]">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="Short summary of the issue"
                      className="h-10 rounded-md border-[#DCE8EE] bg-[#FAFAF7] px-3 text-[13px] text-[#182026] placeholder:text-[#8A97A2] focus-visible:border-[#0B74DE] focus-visible:ring-2 focus-visible:ring-[#0B74DE]/15"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-[12px] font-medium tracking-tight text-[#4D5B66]">
                      Topic
                    </Label>
                    <Select value={contactForm.category} onValueChange={(value) => setContactForm({ ...contactForm, category: value })}>
                      <SelectTrigger className="h-10 rounded-md border-[#DCE8EE] bg-[#FAFAF7] px-3 text-[13px] text-[#182026] focus:border-[#0B74DE] focus:ring-2 focus:ring-[#0B74DE]/15">
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-[#DCE8EE] bg-white text-[#182026] shadow-[0_14px_30px_rgba(24,32,38,0.10)]">
                        <SelectItem value="billing">Billing and invoices</SelectItem>
                        <SelectItem value="technical">App support</SelectItem>
                        <SelectItem value="account">Account management</SelectItem>
                        <SelectItem value="recovery">Claim and recovery support</SelectItem>
                        <SelectItem value="general">General question</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional-context" className="text-[12px] font-medium tracking-tight text-[#4D5B66]">
                    Additional Context
                  </Label>
                  <Input
                    id="additional-context"
                    value={contactForm.additionalContext}
                    onChange={(e) => setContactForm({ ...contactForm, additionalContext: e.target.value })}
                    placeholder="Optional case, invoice, or workflow reference"
                    className="h-10 rounded-md border-[#DCE8EE] bg-[#FAFAF7] px-3 text-[13px] text-[#182026] placeholder:text-[#8A97A2] focus-visible:border-[#0B74DE] focus-visible:ring-2 focus-visible:ring-[#0B74DE]/15"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-[12px] font-medium tracking-tight text-[#4D5B66]">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Describe the issue, page, workflow, or claim context."
                    rows={5}
                    className="min-h-[132px] resize-none rounded-md border-[#DCE8EE] bg-[#FAFAF7] px-3 py-2.5 text-[13px] leading-5 text-[#182026] placeholder:text-[#8A97A2] focus-visible:border-[#0B74DE] focus-visible:ring-2 focus-visible:ring-[#0B74DE]/15"
                  />
                </div>

                <div className="flex flex-col gap-4 border-t border-[#E7EEF2] pt-4">
                  <Button
                    type="submit"
                    disabled={submitting || !isReady || !tenant}
                    className="h-9 w-full rounded-md bg-[#0B74DE] px-4 text-[13px] font-medium tracking-tight text-white shadow-none hover:bg-[#005FBA] md:w-auto md:min-w-[190px]"
                  >
                    {submitting ? 'Submitting Request' : 'Submit Support Request'}
                  </Button>

                  {lastSubmitted && (
                    <div className="border-l-2 border-[#0B74DE] bg-[#F6FAFE] px-3.5 py-3 text-[13px] leading-5 text-[#4D5B66]">
                      <p className="font-medium tracking-tight text-[#182026]">Latest request</p>
                      <p className="mt-1">Request ID: {lastSubmitted.request_id}</p>
                      <p>Status: {formatLabel(lastSubmitted.status)}</p>
                      <p className="mt-1 text-[#66737F]">Submitted {formatTimestamp(lastSubmitted.created_at)}. Follow-up happens through recorded support handling, not a live chat workflow on this page.</p>
                    </div>
                  )}
                </div>
              </form>
            </section>

            <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
              <div className="border-b border-[#DCE8EE] pb-4">
                <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Support record</p>
                <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-[#182026]">Recent requests</h2>
                <p className="mt-1.5 text-[13px] leading-5 text-[#66737F]">This list contains the real persisted support requests for the current user in the active workspace.</p>
              </div>

              <div>
                {loadingHistory ? (
                  <div className="border-b border-[#E7EEF2] py-5 text-[13px] text-[#66737F]">Loading support requests...</div>
                ) : historyError ? (
                  <div className="border-b border-rose-200 py-5 text-[13px] text-rose-700">{historyError}</div>
                ) : requests.length === 0 ? (
                  <div className="border-b border-[#E7EEF2] py-5 text-[13px] text-[#66737F]">No tracked support requests exist for this workspace yet.</div>
                ) : (
                  <div>
                    <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(120px,0.5fr)_minmax(48px,0.2fr)] gap-4 border-b border-[#E7EEF2] px-4 py-3 text-[12px] font-medium tracking-tight text-[#66737F] lg:grid">
                      <div>Request</div>
                      <div>Subject</div>
                      <div>Status</div>
                      <div className="text-right">Open</div>
                    </div>
                    {requests.map((request) => (
                      <div key={request.request_id} className="border-b border-[#E7EEF2] px-0 py-4 transition-colors hover:bg-[#F7FAFC] lg:px-4">
                        <div className="flex flex-col gap-4">
                          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(120px,0.5fr)_minmax(48px,0.2fr)] lg:items-start lg:gap-4">
                            <div>
                              <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Request</p>
                              <p className="mt-1 break-all text-[12px] font-medium tracking-tight text-[#4D5B66]">{request.request_id}</p>
                            </div>
                            <div>
                              <p className="text-[14px] font-medium tracking-tight text-[#182026]">{request.subject}</p>
                              <p className="mt-1 text-[12px] text-[#66737F]">{formatLabel(request.category)}</p>
                            </div>
                            <div className="text-left">
                              <p className="text-[12px] font-medium tracking-tight text-[#34414B]">{formatLabel(request.status)}</p>
                              <p className="mt-1 text-[12px] text-[#66737F]">{formatTimestamp(request.created_at)}</p>
                            </div>
                            <div className="flex justify-start lg:justify-end">
                              <button
                                type="button"
                                aria-expanded={!!expandedRequests[request.request_id]}
                                aria-label={expandedRequests[request.request_id] ? 'Hide request message' : 'Show request message'}
                                onClick={() => toggleRequest(request.request_id)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#DCE8EE] text-[#66737F] transition-colors hover:bg-[#F7FAFC] hover:text-[#182026]"
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
                            <div className="max-w-3xl space-y-2 border-t border-[#E7EEF2] pt-3 lg:ml-[25%]">
                              <p className="text-[12px] font-medium tracking-tight text-[#66737F]">
                                Submitted message
                              </p>
                              <p className="whitespace-pre-wrap text-[13px] leading-5 text-[#4D5B66]">
                                {request.message?.trim() || 'No message was recorded for this request.'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,1fr)]">
                <div>
                  <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Direct email</p>
                  <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-[#182026]">Email support directly</h2>
                  <p className="mt-1.5 text-[13px] leading-5 text-[#66737F]">This opens your email client. It is a manual email action, not an in-app tracked request workflow.</p>
                </div>

                <div className="space-y-3">
                  <a
                    href="mailto:support@margin-finance.com"
                    className="block break-all text-[16px] font-medium tracking-tight text-[#0B74DE] transition-colors hover:text-[#005FBA]"
                  >
                    support@margin-finance.com
                  </a>
                  <p className="text-[13px] leading-5 text-[#66737F]">For tracked request IDs and status, use the support request form above.</p>
                  <div className="grid gap-0 border-y border-[#E7EEF2] text-[12px] leading-5 text-[#66737F] md:grid-cols-3 md:divide-x md:divide-[#E7EEF2]">
                    <p className="py-3 md:pr-4">Manual email channel</p>
                    <p className="py-3 md:px-4">Tenant-tier handling</p>
                    <p className="py-3 md:pl-4">No live-chat guarantee</p>
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

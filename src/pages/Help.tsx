import React, { useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const faqs = [
  {
    id: '1',
    question: 'How do you calculate the service fee?',
    answer: "We charge a 20% fee only on funds that are actually recovered. If nothing is recovered, there is no fee.",
  },
  {
    id: '2',
    question: 'Is it safe to connect my store?',
    answer: 'Yes. The connection is restricted to the data required for recoveries and monitoring. It does not allow store operations like changing listings or placing orders.',
  },
  {
    id: '3',
    question: 'How long do recoveries usually take?',
    answer: 'Most recovery requests resolve within two to three weeks, depending on the claim type and Amazon processing time.',
  },
  {
    id: '4',
    question: 'Where can I see billing and payout history?',
    answer: 'Use the Billing page for invoices and the finance pages in the sidebar for payout and history tracking.',
  },
  {
    id: '5',
    question: 'What issue types do you monitor?',
    answer: 'The platform tracks inventory loss, warehouse damage, inbound discrepancies, refunds without return, fee anomalies, and related reimbursement gaps.',
  },
  {
    id: '6',
    question: 'Do I need to file claims manually?',
    answer: 'No. The platform is designed to monitor opportunities and support the filing workflow for you once the required evidence and account setup are in place.',
  },
];

const supportLanes = [
  {
    label: 'Product Support',
    detail: 'Dashboard access, broken pages, runtime errors, and onboarding blockers.',
  },
  {
    label: 'Billing Questions',
    detail: 'Invoices, fees, payout timing, and commission reconciliation.',
  },
  {
    label: 'Claim Support',
    detail: 'Discrepancies, evidence workflow, filing state, and recovery follow-up.',
  },
];

const contactStandards = [
  'Response target: within one business day',
  'Use the form for account-specific help',
  'Use email for operational follow-ups and attachments',
];

export default function Help() {
  const [searchTerm, setSearchTerm] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    sellerId: '',
    category: '',
    message: '',
  });
  const { toast } = useToast();

  const filteredFaqs = useMemo(
    () =>
      faqs.filter((faq) => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return true;
        return faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query);
      }),
    [searchTerm]
  );

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactForm.name || !contactForm.sellerId || !contactForm.category || !contactForm.message) {
      toast({
        title: 'Please fill in all fields',
        description: 'We need complete context before routing your request.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Request submitted',
      description: 'Your request has been recorded. Support will follow up shortly.',
    });

    setContactForm({ name: '', sellerId: '', category: '', message: '' });
  };

  return (
    <PageLayout title="Help" midnight>
      <div className="relative min-h-screen overflow-hidden bg-[#050505]">
        <div className="absolute inset-x-0 inset-y-[-100px] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

        <div className="relative max-w-7xl mx-auto px-8 py-12">
          <div className="border-b border-white/10 pb-10 mb-10">
            <div className="text-[10px] font-sans font-bold text-white/30 tracking-tight uppercase">Support Console</div>
            <h1 className="mt-2 text-4xl md:text-5xl font-light font-sans text-white tracking-tight">
              Help <span className="text-white/40">and guidance</span>
            </h1>
            <p className="mt-4 max-w-3xl text-sm md:text-base font-sans font-bold text-white/45 leading-relaxed tracking-tight">
              Use this page to find operational answers, route account issues, and contact the Margin Finance team with the right context.
            </p>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="space-y-8">
              <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] overflow-hidden shadow-2xl">
                <div className="border-b border-white/10 px-8 py-6">
                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Knowledge Base</div>
                  <div className="mt-2 text-sm font-sans font-bold text-white">Search common operational questions.</div>
                </div>

                <div className="p-8">
                  <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                    <Input
                      placeholder="Search for an answer"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-12 rounded-2xl border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm font-sans font-bold text-white placeholder:text-white/15 focus:border-white/20"
                    />
                  </div>

                  <Accordion type="single" collapsible className="w-full space-y-3">
                    {filteredFaqs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id} className="rounded-2xl border border-white/10 bg-white/[0.02] px-5">
                        <AccordionTrigger className="py-5 text-left text-sm font-sans font-bold text-white hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="pb-5 text-sm font-sans font-bold text-white/45 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {filteredFaqs.length === 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-8 text-center text-sm font-sans font-bold text-white/35">
                      No help articles matched that search.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] overflow-hidden shadow-2xl">
                <div className="border-b border-white/10 px-8 py-6">
                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Support Request</div>
                  <div className="mt-2 text-sm font-sans font-bold text-white">Send the team a structured issue report.</div>
                </div>

                <form onSubmit={handleContactSubmit} className="p-8 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">
                        Your Name
                      </Label>
                      <Input
                        id="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Name"
                        className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-sm font-sans font-bold text-white placeholder:text-white/15 focus:border-white/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sellerId" className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">
                        Store Name or ID
                      </Label>
                      <Input
                        id="sellerId"
                        value={contactForm.sellerId}
                        onChange={(e) => setContactForm({ ...contactForm, sellerId: e.target.value })}
                        placeholder="Store or tenant reference"
                        className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-sm font-sans font-bold text-white placeholder:text-white/15 focus:border-white/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">
                      Topic
                    </Label>
                    <Select value={contactForm.category} onValueChange={(value) => setContactForm({ ...contactForm, category: value })}>
                      <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-sm font-sans font-bold text-white focus:ring-0 focus:border-white/20">
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
                    <Label htmlFor="message" className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Describe the issue, page, workflow, or claim context."
                      rows={6}
                      className="resize-none rounded-2xl border-white/10 bg-white/[0.03] text-sm font-sans font-bold text-white placeholder:text-white/15 focus:border-white/20"
                    />
                  </div>

                  <Button type="submit" className="h-12 rounded-2xl border border-white/10 bg-white text-black hover:bg-white/90 font-sans font-bold text-[11px] uppercase tracking-tight px-8">
                    Submit Support Request
                  </Button>
                </form>
              </div>
            </section>

            <aside className="space-y-8">
              <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] overflow-hidden shadow-2xl">
                <div className="border-b border-white/10 px-8 py-6">
                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Support Lanes</div>
                  <div className="mt-2 text-sm font-sans font-bold text-white">What each contact path is best for.</div>
                </div>
                <div className="p-8 space-y-4">
                  {supportLanes.map((lane) => (
                    <div key={lane.label} className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-5">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">{lane.label}</div>
                      <div className="mt-2 text-sm font-sans font-bold text-white/60 leading-relaxed">{lane.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] overflow-hidden shadow-2xl">
                <div className="border-b border-white/10 px-8 py-6">
                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Direct Contact</div>
                  <div className="mt-2 text-sm font-sans font-bold text-white">Use this channel for support follow-up.</div>
                </div>
                <div className="p-8 space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-5">
                    <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Support Email</div>
                    <a
                      href="mailto:usersupport@margin-finance.com"
                      className="mt-2 block text-sm font-sans font-bold text-white hover:text-white/80 transition-colors break-all"
                    >
                      usersupport@margin-finance.com
                    </a>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-5">
                    <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Response Standard</div>
                    <div className="mt-2 text-sm font-sans font-bold text-white/60">Within one business day for standard requests.</div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-5">
                    <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Best Practice</div>
                    <div className="mt-3 space-y-2">
                      {contactStandards.map((item) => (
                        <div key={item} className="text-sm font-sans font-bold text-white/55">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

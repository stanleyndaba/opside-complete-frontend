import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Building2, 
  HelpCircle, 
  Handshake, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  Send, 
  UserRound, 
  Building, 
  MessageSquareText,
  ChevronRight,
  Search,
  Zap,
  LifeBuoy,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ContactRoute = 'audit' | 'enterprise' | 'support' | 'partnership' | 'general' | null;

const fieldLabelClass = 'text-[11px] font-bold uppercase tracking-wider text-[#182026]';
const inputClass = 'h-12 rounded-[5px] border-[#DCE8EE] bg-white text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/10 focus-visible:border-[#0B74DE]';

export default function Contact() {
  usePageMeta({
    title: 'Contact Margin — Recovery Audit, Enterprise, and Support',
    description: 'Contact Margin to run a Recovery Audit, request an Enterprise Assessment, get help with an existing workflow, or discuss a partnership.',
    url: `${SITE_META.url}/contact`,
    image: SITE_META.image,
  });

  const { toast } = useToast();
  const [selectedRoute, setSelectedRoute] = useState<ContactRoute>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Form states
  const [supportForm, setSupportForm] = useState({ name: '', email: '', company: '', topic: '', contextId: '', message: '' });
  const [partnershipForm, setPartnershipForm] = useState({ name: '', email: '', company: '', role: '', audience: '', topic: '', message: '' });
  const [generalForm, setGeneralForm] = useState({ name: '', email: '', company: '', topic: '', message: '' });

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitted(true);
    setIsSubmitting(false);
    toast({ title: 'Support request prepared', description: 'Your message has been routed to the support team.' });
  };

  const handlePartnershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitted(true);
    setIsSubmitting(false);
    toast({ title: 'Partnership inquiry sent', description: 'We will review your request and route it to the right person.' });
  };

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitted(true);
    setIsSubmitting(false);
    toast({ title: 'General inquiry received', description: 'Your message has been routed to the Margin team.' });
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setSelectedRoute(null);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FAFAF7] text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026] font-sans">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.08),transparent_34%),radial-gradient(circle_at_84%_0%,rgba(46,125,91,0.06),transparent_32%)]" />
      </div>

      <PublicNavbar variant="light" />

      <main className="relative z-10 px-4 pb-24 pt-32 md:px-6 md:pb-28">
        <div className="mx-auto max-w-5xl">
          
          {/* Hero */}
          <section className="mb-20 space-y-6">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold text-[#0B74DE] tracking-[0.05em] uppercase">
              Contact Margin
            </div>
            <h1 className="font-lora text-4xl md:text-[64px] font-medium leading-[1.05] tracking-tight text-[#182026]">
              Tell us what you need <br className="hidden md:block" />
              to move forward.
            </h1>
            <p className="max-w-2xl text-lg md:text-xl text-[#4D5B66] leading-relaxed tracking-tight">
              Whether you want to check an Amazon recovery issue, discuss a high-volume operation, get help with an existing Audit, or explore a partnership, choose the path that fits. We will route your request to the right next step.
            </p>
            <p className="max-w-xl text-[14px] text-[#8C9BA6] leading-relaxed italic">
              You do not need to explain Margin. Just tell us what is stuck, what you are trying to establish, or what you want to do next.
            </p>
          </section>

          {/* Intent Selector */}
          {!selectedRoute && (
            <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
              <IntentCard 
                icon={Search}
                title="I want to check my Amazon recovery"
                description="Run a Free Recovery Audit to see what Amazon paid, missed, reversed, or left unresolved."
                cta="Run a Free Recovery Audit"
                onClick={() => setSelectedRoute('audit')}
              />
              <IntentCard 
                icon={Zap}
                title="I manage a larger operation"
                description="Discuss an Enterprise Assessment for multi-account, multi-marketplace, high-SKU, or high-GMV Amazon operations."
                cta="Request an Enterprise Assessment"
                onClick={() => setSelectedRoute('enterprise')}
              />
              <IntentCard 
                icon={LifeBuoy}
                title="I already use Margin"
                description="Get help with onboarding, Amazon connection, evidence, billing, API access, an Audit, or an active recovery engagement."
                cta="Get Support"
                onClick={() => setSelectedRoute('support')}
              />
              <IntentCard 
                icon={Users}
                title="I want to work with Margin"
                description="Discuss an agency, aggregator, technology, data, or strategic partnership."
                cta="Discuss a Partnership"
                onClick={() => setSelectedRoute('partnership')}
              />
              <IntentCard 
                icon={Mail}
                title="Something else"
                description="For media, investor, hiring, research, or general company questions."
                cta="Send a General Inquiry"
                onClick={() => setSelectedRoute('general')}
              />
            </section>
          )}

          {/* Route Content */}
          <AnimatePresence mode="wait">
            {selectedRoute && (
              <motion.div
                key={selectedRoute}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="mb-24"
              >
                <div className="mb-8">
                  <button 
                    onClick={() => setSelectedRoute(null)}
                    className="flex items-center gap-2 text-[12px] font-bold text-[#0B74DE] uppercase tracking-wider hover:underline"
                  >
                    ← Back to choices
                  </button>
                </div>

                <div className="rounded-2xl border border-[#D8E3E8] bg-white shadow-2xl shadow-[#182026]/5 overflow-hidden">
                  {selectedRoute === 'audit' && (
                    <div className="p-8 md:p-12 space-y-8">
                      <div className="max-w-2xl space-y-4">
                        <h2 className="font-lora text-3xl font-medium tracking-tight text-[#182026]">Start with the question that brought you here.</h2>
                        <p className="text-[16px] text-[#4D5B66] leading-relaxed">
                          If you think an Amazon reimbursement, return, inventory event, reversal, or payout does not add up, the fastest next step is not a sales conversation. It is an examination.
                        </p>
                        <p className="text-[16px] text-[#4D5B66] leading-relaxed">
                          Run a Free Recovery Audit to establish what the available records support, what is incomplete, and what you can do next.
                        </p>
                      </div>
                      <div className="pt-4 space-y-6">
                        <Button asChild className="h-12 px-8 rounded-md bg-[#0B74DE] text-[14px] font-semibold text-white shadow-lg shadow-[#0B74DE]/20 hover:bg-[#075EBA] transition-all">
                          <Link to="/audit">Run a Free Recovery Audit</Link>
                        </Button>
                        <p className="text-[13px] font-medium text-[#182026] flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-[#0B74DE]" />
                          Free to start. Read-only by default. You approve the action.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedRoute === 'enterprise' && (
                    <div className="p-8 md:p-12 space-y-8">
                      <div className="max-w-2xl space-y-4">
                        <h2 className="font-lora text-3xl font-medium tracking-tight text-[#182026]">For operations where unresolved recovery becomes a financial problem.</h2>
                        <p className="text-[16px] text-[#4D5B66] leading-relaxed">
                          If you manage $1M+ in Amazon GMV, multiple seller accounts, large catalogues, several markets, or an existing provider operation, request an Enterprise Assessment.
                        </p>
                        <p className="text-[16px] text-[#4D5B66] leading-relaxed">
                          We will review the operating shape, define a first examination boundary, and determine whether Margin can establish meaningful recovery and control value for your team.
                        </p>
                      </div>
                      <div className="pt-4 space-y-6">
                        <Button asChild className="h-12 px-8 rounded-md bg-[#0B74DE] text-[14px] font-semibold text-white shadow-lg shadow-[#0B74DE]/20 hover:bg-[#075EBA] transition-all">
                          <Link to="/sales">Request an Enterprise Assessment</Link>
                        </Button>
                        <p className="text-[12px] text-[#8C9BA6] italic">
                          No account connection, provider change, or platform migration is required to request an assessment.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedRoute === 'support' && (
                    <div className="grid lg:grid-cols-5">
                      <div className="lg:col-span-2 bg-[#182026] p-8 md:p-12 text-white flex flex-col justify-between">
                        <div className="space-y-6">
                          <h2 className="font-lora text-3xl font-medium tracking-tight">Tell us where the workflow is stuck.</h2>
                          <p className="text-white/60 leading-relaxed text-[15px]">
                            Reach Margin for onboarding, Amazon connection issues, evidence questions, billing, API access, Audit problems, or anything blocking recovery work.
                          </p>
                          <div className="pt-6 space-y-4">
                            <div className="text-[11px] font-bold uppercase tracking-widest text-[#0B74DE]">Direct Email</div>
                            <a href="mailto:support@margin-finance.com" className="text-[16px] font-medium hover:underline">support@margin-finance.com</a>
                          </div>
                        </div>
                        <div className="pt-12 text-[12px] text-white/40 leading-relaxed">
                          Most support requests are reviewed within one business day. Requests involving account access, evidence, or an active recovery engagement may require additional verification before we can respond.
                        </div>
                      </div>
                      <div className="lg:col-span-3 p-8 md:p-12">
                        {isSubmitted ? (
                          <SuccessState 
                            title="Your request is with the Margin team."
                            message="We received your message and will review it within one business day. Keep your request reference available if you need to follow up."
                            onReset={resetForm}
                          />
                        ) : (
                          <form onSubmit={handleSupportSubmit} className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label className={fieldLabelClass}>Name</Label>
                                <Input 
                                  value={supportForm.name}
                                  onChange={(e) => setSupportForm({ ...supportForm, name: e.target.value })}
                                  placeholder="Your name"
                                  className={inputClass}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className={fieldLabelClass}>Work email</Label>
                                <Input 
                                  type="email"
                                  value={supportForm.email}
                                  onChange={(e) => setSupportForm({ ...supportForm, email: e.target.value })}
                                  placeholder="you@company.com"
                                  className={inputClass}
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label className={fieldLabelClass}>Company or store</Label>
                                <Input 
                                  value={supportForm.company}
                                  onChange={(e) => setSupportForm({ ...supportForm, company: e.target.value })}
                                  placeholder="Company, brand, or store name"
                                  className={inputClass}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className={fieldLabelClass}>What do you need help with?</Label>
                                <Select onValueChange={(v) => setSupportForm({ ...supportForm, topic: v })}>
                                  <SelectTrigger className={inputClass}>
                                    <SelectValue placeholder="Select topic" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {['Onboarding', 'Amazon connection', 'Audit', 'Evidence', 'Billing', 'API', 'Recovery engagement', 'Other'].map(t => (
                                      <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className={fieldLabelClass}>Workspace, Audit, engagement, or integration ID</Label>
                              <Input 
                                value={supportForm.contextId}
                                onChange={(e) => setSupportForm({ ...supportForm, contextId: e.target.value })}
                                placeholder="Optional, but helpful for routing"
                                className={inputClass}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className={fieldLabelClass}>Message</Label>
                              <Textarea 
                                value={supportForm.message}
                                onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                                placeholder="Tell us what is stuck and what you expected to happen."
                                className="min-h-[120px] rounded-[5px] border-[#DCE8EE] bg-white text-[14px] leading-relaxed focus-visible:ring-[#0B74DE]/10 focus-visible:border-[#0B74DE]"
                                required
                              />
                            </div>
                            <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-md bg-[#0B74DE] text-[14px] font-semibold text-white shadow-lg shadow-[#0B74DE]/20 hover:bg-[#075EBA] transition-all">
                              {isSubmitting ? 'Sending...' : 'Send Support Request'}
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedRoute === 'partnership' && (
                    <div className="grid lg:grid-cols-5">
                      <div className="lg:col-span-2 bg-[#182026] p-8 md:p-12 text-white flex flex-col justify-between">
                        <div className="space-y-6">
                          <h2 className="font-lora text-3xl font-medium tracking-tight">Build a better recovery operation for the businesses you serve.</h2>
                          <p className="text-white/60 leading-relaxed text-[15px]">
                            If you are an Amazon agency, aggregator, accountant, technology provider, data partner, or operator serving marketplace businesses, tell us where your clients or systems need a stronger recovery and evidence layer.
                          </p>
                        </div>
                        <div className="pt-12 text-[12px] text-white/40 leading-relaxed">
                          We will review the partnership request and route it to the right person. If there is a clear fit, we will come back with a focused next step.
                        </div>
                      </div>
                      <div className="lg:col-span-3 p-8 md:p-12">
                        {isSubmitted ? (
                          <SuccessState 
                            title="Thanks—we have the context."
                            message="We will review the partnership request and route it to the right person. If there is a clear fit, we will come back with a focused next step rather than a generic sales sequence."
                            onReset={resetForm}
                          />
                        ) : (
                          <form onSubmit={handlePartnershipSubmit} className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label className={fieldLabelClass}>Name</Label>
                                <Input 
                                  value={partnershipForm.name}
                                  onChange={(e) => setPartnershipForm({ ...partnershipForm, name: e.target.value })}
                                  placeholder="Your name"
                                  className={inputClass}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className={fieldLabelClass}>Work email</Label>
                                <Input 
                                  type="email"
                                  value={partnershipForm.email}
                                  onChange={(e) => setPartnershipForm({ ...partnershipForm, email: e.target.value })}
                                  placeholder="you@company.com"
                                  className={inputClass}
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label className={fieldLabelClass}>Company</Label>
                                <Input 
                                  value={partnershipForm.company}
                                  onChange={(e) => setPartnershipForm({ ...partnershipForm, company: e.target.value })}
                                  placeholder="Organization name"
                                  className={inputClass}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className={fieldLabelClass}>Your role</Label>
                                <Input 
                                  value={partnershipForm.role}
                                  onChange={(e) => setPartnershipForm({ ...partnershipForm, role: e.target.value })}
                                  placeholder="Job title"
                                  className={inputClass}
                                />
                              </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label className={fieldLabelClass}>Who do you serve?</Label>
                                <Input 
                                  value={partnershipForm.audience}
                                  onChange={(e) => setPartnershipForm({ ...partnershipForm, audience: e.target.value })}
                                  placeholder="e.g. 50 FBA brands"
                                  className={inputClass}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className={fieldLabelClass}>What would you like to explore?</Label>
                                <Select onValueChange={(v) => setPartnershipForm({ ...partnershipForm, topic: v })}>
                                  <SelectTrigger className={inputClass}>
                                    <SelectValue placeholder="Select path" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {['Client recovery', 'Data integration', 'Technology partnership', 'Referral relationship', 'Agency/aggregator workflow', 'Other'].map(t => (
                                      <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className={fieldLabelClass}>Message</Label>
                              <Textarea 
                                value={partnershipForm.message}
                                onChange={(e) => setPartnershipForm({ ...partnershipForm, message: e.target.value })}
                                placeholder="Tell us what you are trying to build or improve."
                                className="min-h-[120px] rounded-[5px] border-[#DCE8EE] bg-white text-[14px] leading-relaxed focus-visible:ring-[#0B74DE]/10 focus-visible:border-[#0B74DE]"
                                required
                              />
                            </div>
                            <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-md bg-[#0B74DE] text-[14px] font-semibold text-white shadow-lg shadow-[#0B74DE]/20 hover:bg-[#075EBA] transition-all">
                              {isSubmitting ? 'Sending...' : 'Discuss a Partnership'}
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedRoute === 'general' && (
                    <div className="grid lg:grid-cols-5">
                      <div className="lg:col-span-2 bg-[#182026] p-8 md:p-12 text-white flex flex-col justify-between">
                        <div className="space-y-6">
                          <h2 className="font-lora text-3xl font-medium tracking-tight">Have a question that does not fit the other paths?</h2>
                          <p className="text-white/60 leading-relaxed text-[15px]">
                            Send us a note about Margin, the Recovery Engine, research, media, hiring, investment, or anything else you need to ask.
                          </p>
                        </div>
                        <div className="pt-12 text-[12px] text-white/40 leading-relaxed">
                          We will route it to the right person. For a faster response about an Audit, Enterprise Assessment, or support issue, use the dedicated path above.
                        </div>
                      </div>
                      <div className="lg:col-span-3 p-8 md:p-12">
                        {isSubmitted ? (
                          <SuccessState 
                            title="Your message has been received."
                            message="We will route it to the right person. For a faster response about an Audit, Enterprise Assessment, or support issue, use the dedicated path above."
                            onReset={resetForm}
                          />
                        ) : (
                          <form onSubmit={handleGeneralSubmit} className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label className={fieldLabelClass}>Name</Label>
                                <Input 
                                  value={generalForm.name}
                                  onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })}
                                  placeholder="Your name"
                                  className={inputClass}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className={fieldLabelClass}>Email</Label>
                                <Input 
                                  type="email"
                                  value={generalForm.email}
                                  onChange={(e) => setGeneralForm({ ...generalForm, email: e.target.value })}
                                  placeholder="you@email.com"
                                  className={inputClass}
                                  required
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className={fieldLabelClass}>Company or organization</Label>
                              <Input 
                                value={generalForm.company}
                                onChange={(e) => setGeneralForm({ ...generalForm, company: e.target.value })}
                                placeholder="Optional"
                                className={inputClass}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className={fieldLabelClass}>What is this about?</Label>
                              <Select onValueChange={(v) => setGeneralForm({ ...generalForm, topic: v })}>
                                <SelectTrigger className={inputClass}>
                                  <SelectValue placeholder="Select topic" />
                                </SelectTrigger>
                                <SelectContent>
                                  {['General question', 'Media', 'Investor', 'Hiring', 'Research', 'Other'].map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className={fieldLabelClass}>Message</Label>
                              <Textarea 
                                value={generalForm.message}
                                onChange={(e) => setGeneralForm({ ...generalForm, message: e.target.value })}
                                placeholder="Tell us what you would like to know."
                                className="min-h-[120px] rounded-[5px] border-[#DCE8EE] bg-white text-[14px] leading-relaxed focus-visible:ring-[#0B74DE]/10 focus-visible:border-[#0B74DE]"
                                required
                              />
                            </div>
                            <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-md bg-[#0B74DE] text-[14px] font-semibold text-white shadow-lg shadow-[#0B74DE]/20 hover:bg-[#075EBA] transition-all">
                              {isSubmitting ? 'Sending...' : 'Send General Inquiry'}
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Direct Contact Table */}
          <section className="mb-24">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8C9BA6] mb-8">Direct contact</h3>
            <div className="rounded-lg border border-[#D8E3E8] bg-white shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFAF7] border-b border-[#D8E3E8]">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#182026]">Need</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#182026]">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E3E8]">
                  <tr>
                    <td className="px-6 py-4 text-[13px] font-medium text-[#182026]">Existing-customer support</td>
                    <td className="px-6 py-4 text-[13px] text-[#0B74DE] font-medium hover:underline"><a href="mailto:support@margin-finance.com">support@margin-finance.com</a></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-[13px] font-medium text-[#182026]">Enterprise Assessment</td>
                    <td className="px-6 py-4 text-[13px] text-[#0B74DE] font-medium hover:underline"><a href="mailto:enterprise@margin-finance.com">enterprise@margin-finance.com</a></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-[13px] font-medium text-[#182026]">Partnerships</td>
                    <td className="px-6 py-4 text-[13px] text-[#0B74DE] font-medium hover:underline"><a href="mailto:partnerships@margin-finance.com">partnerships@margin-finance.com</a></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-[13px] font-medium text-[#182026]">General inquiry</td>
                    <td className="px-6 py-4 text-[13px] text-[#0B74DE] font-medium hover:underline"><a href="mailto:hello@margin-finance.com">hello@margin-finance.com</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[12px] text-[#8C9BA6] italic">
              A smaller number of reliable routes is better than a directory of silent inboxes. We aim to respond within one business day.
            </p>
          </section>

          {/* Reassurance */}
          <section className="py-16 border-t border-[#D8E3E8] grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-[18px] font-bold text-[#182026]">You are contacting a team—not entering a sales funnel blind.</h3>
              <p className="text-[14px] text-[#66737F] leading-relaxed">
                A message to Margin does not connect your Amazon account, authorize a submission, change your provider, or commit you to a paid engagement.
              </p>
              <p className="text-[14px] text-[#66737F] leading-relaxed">
                We use the information you provide to understand the request, route it correctly, and determine the next useful step. If a connection, upload, authorization, or payment is needed later, we will explain why before asking for it.
              </p>
            </div>
            <div className="p-8 rounded-xl border border-[#D8E3E8] bg-white shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#0B74DE] uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4" />
                Privacy first
              </div>
              <p className="text-[14px] text-[#4D5B66] leading-relaxed">
                Please share only the context needed to route your request. Do not include passwords, secret keys, payment-card details, or unnecessary customer information.
              </p>
            </div>
          </section>

        </div>
      </main>

      <BrandFooter />
    </div>
  );
}

function IntentCard({ icon: Icon, title, description, cta, onClick }: { icon: any, title: string, description: string, cta: string, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer p-6 rounded-[6px] border border-[#D8E3E8] bg-white shadow-sm transition-all hover:border-[#0B74DE]/30 hover:shadow-md flex flex-col justify-between"
    >
      <div className="space-y-4">
        <div className="h-10 w-10 rounded-[4px] bg-[#F8FAFB] border border-[#D8E3E8] flex items-center justify-center transition-colors group-hover:bg-[#0B74DE]/5 group-hover:border-[#0B74DE]/20">
          <Icon className="h-5 w-5 text-[#66737F] transition-colors group-hover:text-[#0B74DE]" strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
          <h3 className="text-[16px] font-bold text-[#182026] tracking-tight">{title}</h3>
          <p className="text-[13px] text-[#66737F] leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-2 text-[12px] font-bold text-[#0B74DE] uppercase tracking-wider group-hover:gap-3 transition-all">
        {cta} <ChevronRight className="h-3 w-3" />
      </div>
    </div>
  );
}

function SuccessState({ title, message, onReset }: { title: string, message: string, onReset: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="h-16 w-16 rounded-full bg-[#0B74DE]/10 flex items-center justify-center mb-6">
        <CheckCircle2 className="h-8 w-8 text-[#0B74DE]" />
      </div>
      <h3 className="text-2xl font-bold text-[#182026] mb-4">{title}</h3>
      <p className="text-[#66737F] max-w-sm mb-8 leading-relaxed">
        {message}
      </p>
      <div className="space-y-4">
        <Button 
          onClick={onReset}
          variant="outline"
          className="h-11 rounded-md border-[#D8E3E8] px-8 text-[13px] font-semibold"
        >
          Back to contact paths
        </Button>
        <p className="text-[12px] text-[#8C9BA6] italic">
          Do not send passwords, access tokens, payment card details, or sensitive customer data by email.
        </p>
      </div>
    </div>
  );
}

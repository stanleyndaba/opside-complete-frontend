import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Mail, Send } from 'lucide-react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const fieldLabelClass = 'text-[11px] font-semibold tracking-tight text-[#66737F]';
const inputClass = 'h-14 rounded-[20px] border-[#CFE0EA] bg-white px-4 text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20';

export default function Contact() {
  usePageMeta({
    title: 'Contact Support | Margin',
    description: 'Contact Margin for support, onboarding, billing, API access, or recovery workflow questions.',
    url: `${SITE_META.url}/contact`,
    image: SITE_META.image,
  });

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      toast({
        title: 'Required fields missing',
        description: 'Please fill in your name, email, and message.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.createPublicSupportContact({
        name: form.name,
        email: form.email,
        company: form.company || undefined,
        subject: form.subject || 'Support request from Margin website',
        message: form.message,
        source_page: 'public_contact',
      });

      if (!response.ok || !response.data?.success) {
        throw new Error(response.error || 'Failed to send support request.');
      }

      setIsSubmitted(true);
      toast({
        title: 'Support request sent',
        description: `Your message was routed to ${response.data.email_sent_to}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Support request failed',
        description: err?.message || 'Please email support@margin-finance.com directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FAFAF7] text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_34%),radial-gradient(circle_at_84%_0%,rgba(46,125,91,0.1),transparent_32%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_18%_100%,rgba(191,216,234,0.24),transparent_44%),radial-gradient(circle_at_76%_88%,rgba(255,255,255,0.7),transparent_48%)]" />
      </div>

      <header className="fixed left-0 right-0 top-0 z-50 border-transparent bg-transparent">
        <div className="container mx-auto px-3 py-3 md:px-6 md:py-5">
          <div className="relative flex items-center justify-between rounded-[22px] border border-[#DCE8EE] bg-white/94 px-4 py-3 shadow-[0_18px_60px_rgba(37,49,58,0.08)] backdrop-blur-2xl md:px-6">
            <Link to="/" className="inline-flex items-center gap-2 rounded-full px-1 py-1 transition-colors hover:bg-[#F3F6F8] md:gap-2.5 md:px-2 md:py-1.5">
              <img src="/logoimagetwo.png" alt="Margin" width="20" height="20" className="h-4 w-auto object-contain md:h-5" />
              <span className="brand-wordmark font-merriweather text-base tracking-tight text-[#182026] md:text-lg">Margin</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 pb-24 pt-28 md:px-6 md:pb-28 md:pt-32">
        <div className="mx-auto max-w-[860px] space-y-8">
          <section className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#DCE8EE] bg-white/78 px-3 py-1.5 text-[11px] font-semibold tracking-tight text-[#0B74DE] shadow-[0_14px_40px_rgba(37,49,58,0.06)] backdrop-blur">
              <span>Margin support</span>
              <span className="h-1 w-1 rounded-full bg-[#0B74DE]/80" />
              <span className="text-[#66737F]">Contact us</span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-[680px] text-[38px] font-semibold leading-[0.95] tracking-[-0.06em] text-[#182026] md:text-[60px]">
                Tell us where the workflow is stuck.
              </h1>
              <p className="max-w-[580px] text-[16px] leading-7 text-[#4D5B66] md:text-lg md:leading-8">
                Reach Margin for onboarding, Amazon connection issues, evidence questions, billing, API access, or anything blocking recovery work.
              </p>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-white p-5 shadow-[0_34px_100px_rgba(37,49,58,0.11)] md:p-7">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#0B74DE]/24 to-transparent" />
            <div className="pointer-events-none absolute -right-16 top-10 h-32 w-32 rounded-full bg-[#0B74DE]/10 blur-3xl" />

            <div className="relative">
              <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">
                    Routed intake
                  </div>
                  <h2 className="text-[28px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] md:text-[34px]">
                    Send a support request.
                  </h2>
                  <p className="max-w-[560px] text-[14px] leading-6 text-[#66737F] md:text-[15px]">
                    Add the workspace, case, integration, or billing context that matters.
                  </p>
                </div>

                <a href="mailto:support@margin-finance.com" className="rounded-full border border-[#DCE8EE] bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-semibold tracking-tight text-[#66737F] transition-colors hover:bg-white hover:text-[#182026]">
                  support@margin-finance.com
                </a>
              </div>

              {isSubmitted ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[22px] border border-[#DCE8EE] bg-[#F8FAFC] px-5 py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="mt-7 text-[28px] font-semibold tracking-tight text-[#182026]">Message sent.</h2>
                  <p className="mt-3 max-w-[380px] text-[14px] leading-7 text-[#66737F]">
                    Your request has been routed to support@margin-finance.com. We will reply to the email address you provided.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="mt-8 h-11 rounded-full bg-[#0B74DE] px-5 text-[13px] font-semibold tracking-tight text-white hover:bg-[#0869C9]"
                  >
                    Start Another Request
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className={fieldLabelClass}>Name</label>
                      <Input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your name"
                        className={inputClass}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={fieldLabelClass}>Email</label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@company.com"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className={fieldLabelClass}>Company</label>
                      <Input
                        type="text"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        placeholder="Company or store"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={fieldLabelClass}>Topic</label>
                      <Input
                        type="text"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="Onboarding, API, billing, case help"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={fieldLabelClass}>Message</label>
                    <Textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us what you need help with."
                      className="min-h-[156px] resize-none rounded-[20px] border-[#CFE0EA] bg-white px-4 py-4 text-[14px] leading-6 tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-12 flex-1 justify-between rounded-full bg-[#0B74DE] px-5 text-[13px] font-semibold tracking-tight text-white shadow-[0_18px_40px_rgba(11,116,222,0.2)] hover:bg-[#0869C9]"
                    >
                      {isSubmitting ? 'Preparing message...' : 'Send Support Request'}
                      {!isSubmitting ? <Send className="h-4 w-4" /> : null}
                    </Button>
                    <Button asChild variant="outline" className="h-12 rounded-full border-[#CFE0EA] bg-white px-5 text-[13px] font-semibold tracking-tight text-[#25313A] hover:bg-[#F3F6F8]">
                      <Link to="/">
                        Back Home
                      </Link>
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </section>

          <section className="grid gap-3 text-[14px] leading-6 text-[#66737F] md:grid-cols-3">
            <div className="rounded-[22px] border border-[#DCE8EE] bg-white/70 px-4 py-4">
              Most launch support requests are reviewed within one business day.
            </div>
            <div className="rounded-[22px] border border-[#DCE8EE] bg-white/70 px-4 py-4">
              Workspace, case, or integration IDs help us route the request cleanly.
            </div>
            <div className="rounded-[22px] border border-[#DCE8EE] bg-white/70 px-4 py-4">
              API access questions can use this same support route.
            </div>
          </section>

          <p className="mx-auto max-w-[720px] text-center text-[14px] leading-6 text-[#66737F] md:text-[15px]">
            You can also email us directly at <a href="mailto:support@margin-finance.com" className="font-semibold text-[#0B74DE] transition-colors hover:text-[#0869C9]">support@margin-finance.com</a>.
          </p>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}

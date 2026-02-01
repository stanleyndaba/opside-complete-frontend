import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, Mail, Calendar, BookOpen, Video, Phone, ArrowRight, MessageSquare, Shield, Clock, Zap, Search as SearchIcon, ChevronRight, LifeBuoy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// FAQ data - Simplified language
const faqs = [
  {
    id: '1',
    question: 'How do you calculate the service fee?',
    answer: 'We only charge a 20% fee on what we actually recover for you. If we don\'t find any funds, you don\'t pay a cent. There are no monthly subscriptions or hidden costs.'
  },
  {
    id: '2',
    question: 'Is it safe to link my store?',
    answer: 'Yes, absolutely. We use a secure connection with restricted access that only lets us view data needed for recoveries. We can\'t change your prices, place orders, or see any of your private financial details.'
  },
  {
    id: '3',
    question: 'How long does it take to get my money back?',
    answer: 'Most requests are completed within 2 to 3 weeks. You\'ll see updates as things progress, and the funds are paid directly into your account.'
  },
  {
    id: '4',
    question: 'Where can I see my history?',
    answer: 'You can find everything in your sidebar. Click on "Settings" then "Billing" to see your past statements and recoveries.'
  },
  {
    id: '5',
    question: 'What kinds of issues do you find?',
    answer: 'Our systems look for lost inventory, warehouse damage, shipping mistakes, and overcharges. We essentially check everything to make sure you\'re not missing out on revenue.'
  },
  {
    id: '6',
    question: 'Do I need to manage the claims myself?',
    answer: 'No, we handle the entire process from start to finish. Once your store is connected, we monitor it daily and handle all the paperwork for you.'
  }
];

// Getting started steps - Simplified language
const gettingStartedSteps = [
  { step: 1, title: 'Link your store', time: '2 min', description: 'Connect your store to start the audit.' },
  { step: 2, title: 'Check your dashboard', time: '3 min', description: 'See your recovery potential in real-time.' },
  { step: 3, title: 'View your claims', time: '2 min', description: 'Track every dollar we find for you.' },
  { step: 4, title: 'Set up alerts', time: '1 min', description: 'Get notified when we find new funds.' }
];

export default function Help() {
  const [searchTerm, setSearchTerm] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    sellerId: '',
    category: '',
    message: ''
  });
  const { toast } = useToast();

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.sellerId || !contactForm.category || !contactForm.message) {
      toast({
        title: "Please fill in all fields",
        description: "We need these details to help you out.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Request submitted",
      description: "Our team will reach out to you shortly.",
    });
    setContactForm({ name: '', sellerId: '', category: '', message: '' });
  };

  return (
    <PageLayout title="Support and Requests" midnight>
      <div className="min-h-screen bg-[#050505] relative overflow-hidden">
        {/* Aesthetic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[600px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.06),transparent_70%)] pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

        <div className="relative z-10 container max-w-6xl mx-auto px-6 py-12">
          {/* Header Section */}
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-4">
              <LifeBuoy className="h-5 w-5 text-emerald-500" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-500/80">Support and Requests</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-white mb-6 italic">
              How can we <span className="text-white/40 not-italic">help you today?</span>
            </h1>
            <p className="text-gray-400 max-w-2xl text-lg leading-relaxed font-light italic">
              Whether you have a question about your account or need help with a specific claim, our team is here to support your business.
            </p>
          </motion.header>

          {/* Search Bar */}
          <div className="relative mb-16 max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
              <Input
                placeholder="Search for answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-6 h-14 text-sm border-white/5 bg-white/[0.02] focus:bg-white/[0.05] focus:border-emerald-500/30 text-white rounded-2xl transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-12">
            {/* FAQs Section */}
            <section className="w-full">
              <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-8 flex items-center gap-3">
                <div className="h-px w-8 bg-gray-500/30" />
                Common Questions
              </h2>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem
                      key={faq.id}
                      value={faq.id}
                      className={cn(
                        "px-6 border-white/5 transition-all hover:bg-white/[0.01]",
                        index !== filteredFaqs.length - 1 ? 'border-b' : 'border-0'
                      )}
                    >
                      <AccordionTrigger className="py-6 text-left hover:no-underline text-sm font-medium text-white/80 hover:text-white transition-colors">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="pb-6 text-sm text-gray-400 leading-relaxed font-light">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                {filteredFaqs.length === 0 && (
                  <div className="text-center py-12 text-gray-500 italic font-light">
                    We couldn't find any results matching your search.
                  </div>
                )}
              </div>
            </section>

            {/* Guides Section */}
            <section className="w-full">
              <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-8 flex items-center gap-3">
                <div className="h-px w-8 bg-gray-500/30" />
                Quick Guides
              </h2>
              <div className="flex flex-col gap-6">
                {gettingStartedSteps.map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: 4 }}
                    className="p-6 bg-[#0c0c0c] border border-white/5 rounded-2xl group hover:border-emerald-500/30 transition-all flex items-center gap-6"
                  >
                    <div className="h-12 w-12 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-mono text-white group-hover:bg-emerald-500 group-hover:text-black transition-all">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-medium">{item.title}</h3>
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{item.time}</span>
                      </div>
                      <p className="text-xs text-gray-400 font-light leading-relaxed mb-2">{item.description}</p>
                      <Button variant="ghost" className="h-auto p-0 text-[10px] font-mono uppercase tracking-widest text-emerald-500/60 hover:text-emerald-500 hover:bg-transparent group/btn">
                        Learn More <ChevronRight className="h-3 w-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Reach Out Section */}
            <section className="w-full">
              <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-8 flex items-center gap-3">
                <div className="h-px w-8 bg-gray-500/30" />
                Reach Out
              </h2>

              <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-[0.03] transition-opacity">
                  <Mail className="h-24 w-24 text-white" />
                </div>

                <form onSubmit={handleContactSubmit} className="space-y-6 relative z-10 max-w-2xl">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] font-mono uppercase tracking-widest text-gray-500 ml-1">Your Name</Label>
                      <Input
                        id="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Name"
                        className="bg-white/[0.02] border-white/5 h-12 text-sm text-white rounded-xl focus:border-emerald-500/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sellerId" className="text-[10px] font-mono uppercase tracking-widest text-gray-500 ml-1">Store Name or ID</Label>
                      <Input
                        id="sellerId"
                        value={contactForm.sellerId}
                        onChange={(e) => setContactForm({ ...contactForm, sellerId: e.target.value })}
                        placeholder="Store Name"
                        className="bg-white/[0.02] border-white/5 h-12 text-sm text-white rounded-xl focus:border-emerald-500/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-[10px] font-mono uppercase tracking-widest text-gray-500 ml-1">How can we help?</Label>
                    <Select value={contactForm.category} onValueChange={(value) => setContactForm({ ...contactForm, category: value })}>
                      <SelectTrigger className="bg-white/[0.02] border-white/5 h-12 text-sm text-white rounded-xl focus:ring-0 focus:border-emerald-500/30">
                        <SelectValue placeholder="Select a topic..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0c0c0c] border-white/10 text-white rounded-xl">
                        <SelectItem value="billing">Billing & Payments</SelectItem>
                        <SelectItem value="technical">App Support</SelectItem>
                        <SelectItem value="account">Manage My Account</SelectItem>
                        <SelectItem value="recovery">Help With a Claim</SelectItem>
                        <SelectItem value="general">Other Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-[10px] font-mono uppercase tracking-widest text-gray-500 ml-1">Tell us more</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Type your message here..."
                      rows={4}
                      className="bg-white/[0.02] border-white/5 text-sm text-white rounded-xl focus:border-emerald-500/30 resize-none"
                    />
                  </div>

                  <Button type="submit" className="w-full md:w-auto px-12 h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-widest transition-all rounded-xl">
                    Submit Request
                  </Button>
                </form>
              </div>

              {/* Secondary Contact Info */}
              <div className="mt-8 grid md:grid-cols-2 gap-4 max-w-2xl">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4 group hover:bg-white/[0.04] transition-all">
                  <div className="h-10 w-10 shrink-0 bg-white/5 rounded-xl flex items-center justify-center">
                    <Mail className="h-4 w-4 text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">Email Support</span>
                    <span className="text-[11px] text-white/60">support@opside.app</span>
                  </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4 group hover:bg-white/[0.04] transition-all">
                  <div className="h-10 w-10 shrink-0 bg-white/5 rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">Response Time</span>
                    <span className="text-[11px] text-white/60">Under 24 Hours</span>
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

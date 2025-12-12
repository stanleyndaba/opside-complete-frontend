import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Search, Mail, Calendar, BookOpen, Video, Phone, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// FAQ data
const faqs = [
  {
    id: '1',
    question: 'How do you calculate the recovery fee?',
    answer: 'We charge a success-based fee of 20% only on funds we successfully recover for you. There are no upfront costs, monthly fees, or charges if we don\'t recover anything. For example, if we recover $1,000, our fee would be $200, and you keep $800.'
  },
  {
    id: '2',
    question: 'Is it safe to connect my Amazon account?',
    answer: 'Yes, completely safe. We use read-only API access that only allows us to view your account data - we cannot make any changes, place orders, or access sensitive information like your bank details. We use bank-level encryption to protect your data.'
  },
  {
    id: '3',
    question: 'How long does a typical recovery take?',
    answer: 'Most recoveries are completed within 14-21 days from when we submit the claim to Amazon. Our average recovery time is 16.8 days. Some complex cases may take longer, but we provide regular updates throughout the process.'
  },
  {
    id: '4',
    question: 'Where can I find my invoices?',
    answer: 'All your invoices are available in the Billing section of your dashboard. You can access them by clicking on "Billing" in the sidebar, then viewing the "Invoice History" tab.'
  },
  {
    id: '5',
    question: 'What types of losses can you recover?',
    answer: 'We recover lost inventory, damaged goods, fee disputes, storage overcharges, FBA fulfillment errors, and various Amazon billing mistakes. Our system continuously monitors your account for any discrepancies.'
  },
  {
    id: '6',
    question: 'Do I need to do anything after connecting my account?',
    answer: 'No! Once connected, our system automatically monitors your account 24/7, detects issues, and files recovery claims on your behalf. You\'ll receive notifications when we find new recovery opportunities.'
  }
];

// Getting started steps
const gettingStartedSteps = [
  { step: 1, title: 'Connect Your Amazon Account', time: '2 min' },
  { step: 2, title: 'Review Your Command Center', time: '3 min' },
  { step: 3, title: 'Explore Active Recoveries', time: '2 min' },
  { step: 4, title: 'Set Up Notifications', time: '1 min' }
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
        description: "All fields are required to submit your support request.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Support request submitted",
      description: "We'll get back to you within 24 hours.",
    });
    setContactForm({ name: '', sellerId: '', category: '', message: '' });
  };

  return (
    <PageLayout title="Help">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="relative mx-auto max-w-3xl px-6 pt-12 md:pt-16 pb-16">

            {/* Header */}
            <header className="mb-12">
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
                How can we help?
              </h1>
              <p className="mt-3 text-lg text-gray-600">
                Find answers, learn the platform, or contact our team.
              </p>
            </header>

            {/* Search */}
            <div className="relative mb-12">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for help..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-6 text-base border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-300"
              />
            </div>

            {/* FAQs */}
            <section className="mb-16">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs.map((faq, index) => (
                      <AccordionItem
                        key={faq.id}
                        value={faq.id}
                        className={index !== filteredFaqs.length - 1 ? 'border-b border-gray-100' : 'border-0'}
                      >
                        <AccordionTrigger className="px-5 py-4 text-left hover:no-underline text-sm font-medium text-gray-900 hover:bg-gray-50">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  {filteredFaqs.length === 0 && searchTerm && (
                    <div className="text-center py-8 text-sm text-gray-500">
                      No matching questions found.
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Getting Started & Guides */}
            <section className="mb-16">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Learn the Platform</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Getting Started */}
                <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5">
                    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      Getting Started
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="space-y-3 mb-4">
                      {gettingStartedSteps.map((item) => (
                        <div key={item.step} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-6 w-6 rounded-full bg-gray-900 text-white text-xs font-medium flex items-center justify-center">
                              {item.step}
                            </div>
                            <span className="text-sm text-gray-700">{item.title}</span>
                          </div>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-xs">
                            {item.time}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm">
                      <Video className="h-4 w-4 mr-2" />
                      Watch Tutorial
                    </Button>
                  </CardContent>
                </Card>

                {/* Dashboard Guide */}
                <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5">
                    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Video className="h-4 w-4 text-purple-600" />
                      </div>
                      Understanding Your Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="space-y-3 mb-4">
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <p className="text-sm font-medium text-gray-900">Total Guaranteed</p>
                        <p className="text-xs text-gray-500 mt-0.5">Amount committed to recover for active claims</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <p className="text-sm font-medium text-gray-900">Recovery Success Rate</p>
                        <p className="text-xs text-gray-500 mt-0.5">Percentage of claims that result in payouts</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <p className="text-sm font-medium text-gray-900">Avg Processing Time</p>
                        <p className="text-xs text-gray-500 mt-0.5">Time from submission to payout</p>
                      </div>
                    </div>
                    <a href="#" className="inline-flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-gray-600">
                      Read full guide
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Contact Support */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Contact Support</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Email Form */}
                <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5">
                    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-emerald-600" />
                      </div>
                      Email Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-xs font-medium text-gray-500">Name</Label>
                        <Input
                          id="name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="Your name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sellerId" className="text-xs font-medium text-gray-500">Seller ID</Label>
                        <Input
                          id="sellerId"
                          value={contactForm.sellerId}
                          onChange={(e) => setContactForm({ ...contactForm, sellerId: e.target.value })}
                          placeholder="A1B2C3D4E5F6G7"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category" className="text-xs font-medium text-gray-500">Category</Label>
                        <Select value={contactForm.category} onValueChange={(value) => setContactForm({ ...contactForm, category: value })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="billing">Billing</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="account">Account</SelectItem>
                            <SelectItem value="recovery">Recovery</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="message" className="text-xs font-medium text-gray-500">Message</Label>
                        <Textarea
                          id="message"
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder="Describe your issue..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm">
                        Send Message
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Book a Call */}
                <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5">
                    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-amber-600" />
                      </div>
                      Book a Call
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Direct Access</p>
                          <p className="text-xs text-gray-500">Speak with a recovery specialist</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Flexible Scheduling</p>
                          <p className="text-xs text-gray-500">Choose a time that works for you</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <Video className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Screen Sharing</p>
                          <p className="text-xs text-gray-500">Walk through your dashboard together</p>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm">
                      Schedule 15-min Call
                    </Button>
                    <p className="text-xs text-gray-400 text-center mt-3">
                      Mon-Fri, 9 AM - 6 PM EST
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}
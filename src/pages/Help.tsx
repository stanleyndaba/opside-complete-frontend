import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Mail, Calendar, BookOpen, Video, HelpCircle, MessageSquare, Phone, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// FAQ data
const faqs = [
  {
    id: '1',
    question: 'How do you calculate the recovery fee?',
    answer: 'We charge a success-based fee of 25% only on funds we successfully recover for you. There are no upfront costs, monthly fees, or charges if we don\'t recover anything. For example, if we recover $1,000, our fee would be $250, and you keep $750.'
  },
  {
    id: '2',
    question: 'Is it safe to connect my Amazon account?',
    answer: 'Yes, completely safe. We use read-only API access that only allows us to view your account data - we cannot make any changes, place orders, or access sensitive information like your bank details. We\'re SOC 2 Type II certified and use bank-level encryption to protect your data.'
  },
  {
    id: '3',
    question: 'How long does a typical recovery take?',
    answer: 'Most recoveries are completed within 14-21 days from when we submit the claim to Amazon. Our average recovery time is 16.8 days. Some complex cases may take longer, but we provide regular updates throughout the process.'
  },
  {
    id: '4',
    question: 'Where can I find my invoices?',
    answer: 'All your invoices are available in the Billing section of your dashboard. You can access them by clicking on "Billing" in the sidebar, then viewing the "Invoice History" tab. You can download PDFs of all past invoices there.'
  },
  {
    id: '5',
    question: 'How do I update my payment method?',
    answer: 'Go to Settings > Billing Information in your dashboard. Click "Update Payment Method" and enter your new card details. Changes take effect immediately for future charges.'
  },
  {
    id: '6',
    question: 'What types of losses can you recover?',
    answer: 'We recover lost inventory, damaged goods, fee disputes, storage overcharges, FBA fulfillment errors, and various Amazon billing mistakes. Our AI continuously monitors your account for any discrepancies.'
  },
  {
    id: '7',
    question: 'Do I need to do anything after connecting my account?',
    answer: 'No! Once connected, our system automatically monitors your account 24/7, detects issues, and files recovery claims on your behalf. You\'ll receive notifications when we find new recovery opportunities.'
  },
  {
    id: '8',
    question: 'Can I see proof of the losses you claim?',
    answer: 'Absolutely. Every claim includes detailed evidence in our Evidence Locker. You can view transaction logs, photos of damaged goods, Amazon correspondence, and all supporting documentation for complete transparency.'
  }
];

// Getting started steps
const gettingStartedSteps = [
  {
    title: 'Connect Your Amazon Account',
    description: 'Securely link your seller account using our read-only integration',
    duration: '2 minutes'
  },
  {
    title: 'Review Your Command Center',
    description: 'See the overview of detected losses and recovery opportunities',
    duration: '3 minutes'
  },
  {
    title: 'Explore Active Recoveries',
    description: 'Check the Recoveries page to see claims in progress',
    duration: '2 minutes'
  },
  {
    title: 'Set Up Notifications',
    description: 'Configure alerts for new recoveries and payouts',
    duration: '1 minute'
  }
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

  // Filter FAQs based on search
  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!contactForm.name || !contactForm.sellerId || !contactForm.category || !contactForm.message) {
      toast({
        title: "Please fill in all fields",
        description: "All fields are required to submit your support request.",
        variant: "destructive"
      });
      return;
    }

    // Simulate form submission
    toast({
      title: "Support request submitted",
      description: "We'll get back to you within 24 hours. Check your email for a confirmation.",
    });

    // Reset form
    setContactForm({
      name: '',
      sellerId: '',
      category: '',
      message: ''
    });
  };

  return (
    <PageLayout title="Help & Support">
      <div className="container max-w-4xl p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Help & Support</h1>
          <p className="text-muted-foreground text-lg">Get the help you need, when you need it</p>
        </div>

        {/* Tier 1: Instant Answers */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-4">Find Answers Instantly</h2>
            
            {/* Prominent Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder='Search for help (e.g., "How is my bill calculated?")'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-6 text-lg border-2 focus:border-primary"
              />
            </div>
          </div>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Quick answers to the most common questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              {filteredFaqs.length === 0 && searchTerm && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No matching questions found. Try a different search term or contact support below.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Tier 2: Guided Help */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-4">Learn More</h2>
            <p className="text-muted-foreground">Comprehensive guides and tutorials</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Getting Started Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Getting Started Guide
                </CardTitle>
                <CardDescription>
                  New to Opside? Start here for a complete walkthrough
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {gettingStartedSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{step.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {step.duration}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                <Button className="w-full mt-4" variant="outline">
                  <Video className="h-4 w-4 mr-2" />
                  Watch Video Tutorial
                </Button>
              </CardContent>
            </Card>

            {/* Understanding Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Understanding Your Dashboard
                </CardTitle>
                <CardDescription>
                  Learn what each metric means and how it's calculated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm">Total Guaranteed</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      The total amount we've committed to recover for active claims
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm">Recovery Success Rate</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Percentage of submitted claims that result in successful payouts
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm">Average Processing Time</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Typical time from claim submission to payout completion
                    </p>
                  </div>
                </div>
                
                <Button className="w-full mt-4" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Read Full Guide
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-12" />

        {/* Tier 3: Human Assistance */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-4">Still need help?</h2>
            <p className="text-muted-foreground">Our support team is here to assist you</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Email Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Support
                </CardTitle>
                <CardDescription>
                  Get detailed help via email - we respond within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sellerId">Seller ID</Label>
                    <Input
                      id="sellerId"
                      value={contactForm.sellerId}
                      onChange={(e) => setContactForm({ ...contactForm, sellerId: e.target.value })}
                      placeholder="e.g., A1B2C3D4E5F6G7"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Issue Category</Label>
                    <Select value={contactForm.category} onValueChange={(value) => setContactForm({ ...contactForm, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="billing">Billing Question</SelectItem>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="account">Account Setup</SelectItem>
                        <SelectItem value="recovery">Recovery Question</SelectItem>
                        <SelectItem value="general">General Question</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Describe your issue in detail..."
                      rows={4}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Book a Call */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Book a 15-Minute Call
                </CardTitle>
                <CardDescription>
                  Schedule a video call for urgent or complex issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Direct Access</p>
                      <p className="text-xs text-muted-foreground">Speak with a recovery specialist</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Flexible Scheduling</p>
                      <p className="text-xs text-muted-foreground">Choose a time that works for you</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Screen Sharing</p>
                      <p className="text-xs text-muted-foreground">We can walk through your dashboard together</p>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full" variant="default">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Call
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Available Monday-Friday, 9 AM - 6 PM EST
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
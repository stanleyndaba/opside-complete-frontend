import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Star, Zap, Bug } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';

// Updates (reverse-chronological)
const updates = [{
  id: 1,
  title: "New: Filter Your Reports to Find Insights Faster",
  date: "September 4, 2025",
  tag: "NEW FEATURE",
  tagColor: "bg-emerald-500 text-white",
  icon: Star,
  image: "/lovable-uploads/ac3dc504-c896-4f73-9e7e-aefc77dd6e9f.png",
  description: "We heard from many of you that you wanted an easier way to analyze quarterly performance, so we've added a powerful new Date Range Picker to the Reports page.",
  content: ["Filter reports by custom date ranges", "Compare performance across different time periods", "Export filtered data for deeper analysis"],
  cta: "You can try it out now on your Reports page."
}, {
  id: 2,
  title: "Improved: Faster Recovery Detection System",
  date: "August 28, 2025",
  tag: "IMPROVEMENT",
  tagColor: "bg-blue-500 text-white",
  icon: Zap,
  image: "/lovable-uploads/14f98d63-9a1a-4128-8021-1d840d778ea5.png",
  description: "Our AI-powered recovery detection system is now 3x faster at identifying potential claims, getting your money back sooner.",
  content: ["50% reduction in detection time", "More accurate claim categorization", "Improved false positive filtering"],
  cta: "Check your Recoveries page to see the improvements in action."
}, {
  id: 3,
  title: "Fixed: Dashboard Loading Issues on Mobile",
  date: "August 22, 2025",
  tag: "BUG FIX",
  tagColor: "bg-amber-500 text-white",
  icon: Bug,
  image: "/lovable-uploads/8efb84ba-e777-4413-ae5a-f7f54bfa6cab.png",
  description: "We've resolved the slow loading times some users experienced on mobile devices when accessing the Command Center.",
  content: ["75% faster mobile load times", "Improved responsive design", "Better touch interactions"],
  cta: "Your mobile experience should now be lightning fast."
}, {
  id: 4,
  title: "New: Enhanced Evidence Locker with Document Preview",
  date: "August 15, 2025",
  tag: "NEW FEATURE",
  tagColor: "bg-emerald-500 text-white",
  icon: Star,
  image: "/lovable-uploads/cef56367-b57b-46cc-b0cb-a2ffad47fb03.png",
  description: "You can now preview documents directly in the Evidence Locker without downloading them, making case review faster and more efficient.",
  content: ["In-browser PDF preview", "Image thumbnail gallery", "Quick document search and filtering"],
  cta: "Visit the Evidence Locker to see your documents in a whole new way."
}];
const getTagIcon = (tag: string) => {
  switch (tag) {
    case 'NEW FEATURE':
      return Star;
    case 'IMPROVEMENT':
      return Zap;
    case 'BUG FIX':
      return Bug;
    default:
      return Star;
  }
};
export default function WhatsNew() {
  // Group by month label
  const groups = updates.reduce<Record<string, typeof updates>>((acc, u) => {
    const month = new Date(u.date + ' UTC').toLocaleString('en-US', { month: 'long', year: 'numeric' });
    acc[month] = acc[month] || [];
    acc[month].push(u);
    return acc;
  }, {});
  const orderedMonths = Object.keys(groups);
  return (
    <PageLayout title="What's New at Clario">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 font-brand">What's New at Clario</h1>
          <p className="text-muted-foreground font-body">
            We're relentlessly improving our platform to find and recover more for you. Here's a log of our latest updates.
          </p>
        </div>

        {/* Momentum Feed */}
        <div className="space-y-10">
          {orderedMonths.map((month) => (
            <div key={month} className="space-y-4">
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground">{month}</h3>
              <div className="space-y-6">
                {groups[month].map((update) => {
                  const TagIcon = getTagIcon(update.tag);
                  return (
                    <Card key={update.id} className="overflow-hidden border border-white/10 bg-white/5">
                      <CardHeader className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {update.date}
                          </div>
                          <Badge className={`${update.tagColor}`}>
                            <TagIcon className="h-3 w-3 mr-1" />
                            {update.tag}
                          </Badge>
                        </div>
                        <h2 className="text-xl font-semibold text-foreground font-brand">
                          {update.title}
                        </h2>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground leading-relaxed font-body">
                          {update.description}
                        </p>
                        <div className="space-y-2">
                          <h3 className="font-medium text-foreground">What's included:</h3>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {update.content.map((item, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-2 border-t border-border">
                          <p className="text-sm font-medium text-primary">{update.cta}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
            <h2 className="text-xl font-semibold text-foreground">COMING SOON: The Zero-Effort Evidence Engine</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm leading-relaxed text-foreground">
              <p>To our founding users,</p>
              <p>
                Thank you for being a part of the Clario journey. You're already experiencing our "Glass Box" approach to recoveries—finding claims and linking them directly to the proof.
              </p>
              <p>But we're just getting started.</p>
              <p>
                We are currently building the next evolution of Clario: a proactive, intelligent engine designed to eliminate the single most annoying part of the reimbursement process—digging for documents.
              </p>
              <p className="font-medium">What's Coming:</p>
              <p>
                Imagine a world where you never have to search for an old supplier invoice again. The Clario Evidence Engine will securely connect to your email (Gmail/Outlook) and cloud storage to automatically build a complete, private library of your financial proof.
              </p>
              <p>
                When we find a claim, our system will instantly find and match the correct invoice from your library, ensuring you get the maximum possible refund with zero work from you. No more email requests. No more digging through folders. Just faster, larger recoveries.
              </p>
              <p>This is more than a recovery tool. This is your automated forensic accountant.</p>
              <p className="font-medium">Get Early Access:</p>
              <p>
                This feature is currently in a closed beta. As a founding member, you have the first opportunity to join the waitlist.
              </p>
            </div>
            <div>
              <a href="/integrations-hub" className="inline-flex items-center justify-center rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5">
                Join the Evidence Engine Beta Waitlist →
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Updates Feed */}
        <div className="space-y-6">
          {updates.map(update => {
          const TagIcon = getTagIcon(update.tag);
          return <Card key={update.id} className="overflow-hidden">
                <CardHeader className="space-y-4">
                  {/* Date and Tag */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {update.date}
                    </div>
                    <Badge className={`${update.tagColor} hover:${update.tagColor}/80`}>
                      <TagIcon className="h-3 w-3 mr-1" />
                      {update.tag}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-semibold text-foreground">
                    {update.title}
                  </h2>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Featured Image - reduced height for a more professional look */}
                  <div className="rounded-lg overflow-hidden bg-muted border border-border/60">
                    <div className="w-full h-40 md:h-48">
                      <img src={update.image} alt={update.title} className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed">
                    {update.description}
                  </p>

                  {/* Content Bullets */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-foreground">What's included:</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {update.content.map((item, index) => <li key={index} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                          {item}
                        </li>)}
                    </ul>
                  </div>

                  {/* Call to Action */}
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm font-medium text-primary">
                      {update.cta}
                    </p>
                  </div>
                </CardContent>
              </Card>;
        })}
        </div>

        {/* Suggestions Banner */}
        <div className="py-6">
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-center">
            <p className="text-sm text-blue-900">
              Have suggestions for new features? We'd love to hear from you!{' '}
              <a href="/help" className="text-blue-700 hover:underline font-medium">
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
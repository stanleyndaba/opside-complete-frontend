import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Star, Zap, Bug } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';

// Mock data for updates - this would typically come from a CMS or API
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
  return <PageLayout title="What's New at Opside">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">What's New at Opside</h1>
          <p className="text-muted-foreground">
            Stay up to date with the latest features, improvements, and fixes to help you recover more money faster.
          </p>
        </div>

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
                  {/* Featured Image */}
                  <div className="rounded-lg overflow-hidden bg-muted h-40 md:h-48">
                    <img src={update.image} alt={update.title} className="w-full h-full object-cover" />
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

        {/* Footer Note */}
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Have suggestions for new features? We'd love to hear from you!{' '}
            <a href="/help" className="text-primary hover:underline font-medium">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </PageLayout>;
}
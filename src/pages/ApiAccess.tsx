import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const ApiAccess = () => {
  return (
    <PageLayout title="API Access">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">

          <div className="relative mx-auto max-w-3xl px-6 pt-16 md:pt-24 pb-16">
            {/* Header */}
            <header className="mb-16">
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight tracking-tight">
                The Opside API: The Financial Engine for Modern Commerce
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                At Opside, we are building more than a dashboard. We are building the intelligent financial recovery layer for e-commerce. Our future-facing API will allow developers, agencies, and enterprise brands to programmatically access the full power of our platform, integrating automated reimbursement data and workflows directly into their own systems.
              </p>
            </header>

            {/* Code Preview */}
            <section className="mb-16">
              <Card className="bg-gray-900 border-gray-800 shadow-xl rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border-b border-gray-700/50">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="ml-3 text-xs text-gray-500" style={{ fontFamily: 'Fira Code, Consolas, Monaco, monospace' }}>example.py</span>
                </div>
                <CardContent className="p-0">
                  <pre
                    className="p-6 overflow-x-auto text-sm md:text-base leading-relaxed text-gray-300"
                    style={{ fontFamily: 'Fira Code, JetBrains Mono, Consolas, Monaco, monospace' }}
                  >
                    {`import opside
from datetime import datetime, timedelta

# Initialize the Opside client
client = opside.Client(api_key="os_live_xxxxxxxxxxxxxxxx")

# Fetch all recoverable claims from the last 30 days
claims = client.claims.list(
    status="recoverable",
    created_after=datetime.now() - timedelta(days=30),
    marketplace="amazon_us",
    limit=50
)

print(f"Found {len(claims)} recoverable claims")

# Get estimated recovery value
total_value = sum(claim.amount for claim in claims)
print(f"Total estimated recovery: $" + f"{total_value:,.2f}")

# Submit claims for recovery
for claim in claims:
    if claim.confidence >= 0.85:
        result = client.claims.submit(claim.id)
        print(f"Submitted claim {claim.id}: {result.status}")`}
                  </pre>
                </CardContent>
              </Card>
            </section>

            {/* What You Can Do */}
            <section className="mb-16">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">
                What You Will Be Able to Do
              </h2>
              <div className="space-y-6">
                <div className="border-l-2 border-gray-200 pl-6">
                  <h3 className="font-medium text-gray-900 mb-1">Sync Recovery Data</h3>
                  <p className="text-gray-600">
                    Pull all detected claims, their statuses, and their financial value directly into your own internal dashboards, data warehouses, or ERP systems.
                  </p>
                </div>
                <div className="border-l-2 border-gray-200 pl-6">
                  <h3 className="font-medium text-gray-900 mb-1">Build Custom Reporting</h3>
                  <p className="text-gray-600">
                    Create bespoke financial reports and analytics for your team or your clients, leveraging real-time data from the Clario engine.
                  </p>
                </div>
                <div className="border-l-2 border-gray-200 pl-6">
                  <h3 className="font-medium text-gray-900 mb-1">Automate Workflows</h3>
                  <p className="text-gray-600">
                    Programmatically approve claims, trigger scans, and manage your recovery pipeline without ever needing to log into the Clario UI.
                  </p>
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section className="mb-16">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">
                How It Will Work
              </h2>
              <div className="space-y-6">
                <div className="border-l-2 border-gray-200 pl-6">
                  <h3 className="font-medium text-gray-900 mb-1">Modern REST Architecture</h3>
                  <p className="text-gray-600">
                    A clean, predictable, and well-documented REST API that is easy to integrate with.
                  </p>
                </div>
                <div className="border-l-2 border-gray-200 pl-6">
                  <h3 className="font-medium text-gray-900 mb-1">Real-Time Webhooks</h3>
                  <p className="text-gray-600">
                    Receive real-time push notifications to your own services for key events like{' '}
                    <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-sm">claim.detected</code>,{' '}
                    <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-sm">claim.submitted</code>, and{' '}
                    <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-sm">funds.recovered</code>.
                  </p>
                </div>
                <div className="border-l-2 border-gray-200 pl-6">
                  <h3 className="font-medium text-gray-900 mb-1">Secure and Scalable</h3>
                  <p className="text-gray-600">
                    Built with the same enterprise-grade security and reliability as our core platform, ensuring your data is always safe and accessible.
                  </p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="pt-8 border-t border-gray-100">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                Get Notified
              </h2>
              <p className="text-gray-600 mb-6">
                Our developer API is currently in a private beta with select partners. If you are an enterprise brand, an agency, or a developer interested in building on the Clario platform, please contact us to be added to the early access list.
              </p>
              <Button
                asChild
                className="bg-gray-900 hover:bg-gray-800 text-white font-medium"
              >
                <a href="mailto:hello@getclario.com?subject=Clario%20API%20Early%20Access">
                  Request Early Access
                  <ArrowRight className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ApiAccess;

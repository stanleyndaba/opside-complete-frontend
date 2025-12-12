import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Code2, Webhook, Shield, ArrowRight } from 'lucide-react';

const ApiAccess = () => {
  return (
    <PageLayout title="API Access">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-gray-50 min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-transparent to-gray-100" />

          <div className="relative mx-auto max-w-3xl px-6 pt-12 md:pt-16 pb-16">
            {/* Header */}
            <header className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-4">
                Coming Soon
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight leading-tight">
                The Clario API
              </h1>
              <p className="mt-4 text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
                Programmatic access to automated reimbursement data and workflows.
                Build on top of the intelligent financial recovery layer for e-commerce.
              </p>
            </header>

            {/* Code Preview */}
            <div className="mb-12">
              <Card className="bg-gray-900 border-gray-800 shadow-xl rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border-b border-gray-700/50">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-gray-500 font-mono">example.py</span>
                </div>
                <CardContent className="p-0">
                  <pre className="p-5 overflow-x-auto text-sm leading-relaxed font-mono text-gray-300">
                    {`# Get the latest recovered claims
from clario import Clario

client = Clario(api_key="YOUR_API_KEY")

claims = client.claims.list(
    status="recovered",
    limit=10
)

for claim in claims:
    print(f"Recovered {claim.amount} for {claim.id}")`}
                  </pre>
                </CardContent>
              </Card>
            </div>

            {/* Features Grid */}
            <div className="grid gap-4 mb-12">
              <Card className="bg-white border-gray-200 shadow-sm rounded-xl">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Code2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">REST API</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Clean, predictable endpoints. Pull claims, statuses, and financial data into your dashboards or ERP systems.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 shadow-sm rounded-xl">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Webhook className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Webhooks</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Real-time push notifications for <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">claim.detected</code>, <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">funds.recovered</code>, and more.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 shadow-sm rounded-xl">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Enterprise Security</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Scoped API keys, rate limiting, and audit logs. Built with the same security as our core platform.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-0 shadow-lg rounded-xl">
                <CardContent className="p-8">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Get Early Access
                  </h3>
                  <p className="text-sm text-gray-400 mb-5 max-w-md mx-auto">
                    Our API is in private beta with select partners. Contact us to join the early access program.
                  </p>
                  <Button
                    asChild
                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-medium"
                  >
                    <a href="mailto:hello@getclario.com?subject=Clario%20API%20Early%20Access">
                      Request Access
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ApiAccess;

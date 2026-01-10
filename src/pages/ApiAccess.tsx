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
                The Margin API: The Financial Engine for Modern Commerce
              </h1>
              <p className="mt-5 text-lg md:text-xl text-gray-600 font-body">
                At Margin, we are building more than a dashboard. We are building the intelligent financial recovery layer for e-commerce. Our future-facing API will allow developers, agencies, and enterprise brands to programmatically access the full power of our platform, integrating automated reimbursement data and workflows directly into their own systems.
              </p>
            </header>

            {/* Code Preview */}
            <section className="mb-16">
              <Card className="bg-gray-900 border-gray-800 shadow-xl rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border-b border-gray-700/50">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="ml-3 text-xs text-gray-500 font-mono">example.py</span>
                </div>
                <CardContent className="p-0">
                  <pre className="p-6 overflow-x-auto text-[11px] md:text-xs leading-loose" style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', monospace" }}>
                    <code style={{ fontFamily: 'inherit' }}>
                      <span className="text-purple-400">import</span> <span className="text-blue-300">margin</span>{'\n'}
                      <span className="text-purple-400">from</span> <span className="text-blue-300">datetime</span> <span className="text-purple-400">import</span> <span className="text-yellow-300">datetime</span>, <span className="text-yellow-300">timedelta</span>{'\n'}
                      {'\n'}
                      <span className="text-gray-500"># Initialize the Margin client</span>{'\n'}
                      <span className="text-gray-300">client</span> <span className="text-pink-400">=</span> <span className="text-blue-300">Margin</span>(<span className="text-orange-400">api_key</span><span className="text-pink-400">=</span><span className="text-green-400">"os_live_xxxxxxxxxxxxxxxx"</span>){'\n'}
                      {'\n'}
                      <span className="text-gray-500"># Fetch all recoverable claims from the last 30 days</span>{'\n'}
                      <span className="text-gray-300">claims</span> <span className="text-pink-400">=</span> <span className="text-gray-300">client</span>.<span className="text-gray-300">claims</span>.<span className="text-yellow-300">list</span>({'\n'}
                      {'    '}<span className="text-orange-400">status</span><span className="text-pink-400">=</span><span className="text-green-400">"recoverable"</span>,{'\n'}
                      {'    '}<span className="text-orange-400">created_after</span><span className="text-pink-400">=</span><span className="text-yellow-300">datetime</span>.<span className="text-yellow-300">now</span>() <span className="text-pink-400">-</span> <span className="text-yellow-300">timedelta</span>(<span className="text-orange-400">days</span><span className="text-pink-400">=</span><span className="text-cyan-400">30</span>),{'\n'}
                      {'    '}<span className="text-orange-400">marketplace</span><span className="text-pink-400">=</span><span className="text-green-400">"amazon_us"</span>,{'\n'}
                      {'    '}<span className="text-orange-400">limit</span><span className="text-pink-400">=</span><span className="text-cyan-400">50</span>{'\n'}
                      ){'\n'}
                      {'\n'}
                      <span className="text-yellow-300">print</span>(<span className="text-green-400">f"Found </span><span className="text-cyan-300">{'{'}<span className="text-gray-300">len</span>(<span className="text-gray-300">claims</span>){'}'}</span><span className="text-green-400"> recoverable claims"</span>){'\n'}
                      {'\n'}
                      <span className="text-gray-500"># Get estimated recovery value</span>{'\n'}
                      <span className="text-gray-300">total_value</span> <span className="text-pink-400">=</span> <span className="text-yellow-300">sum</span>(<span className="text-gray-300">claim</span>.<span className="text-gray-300">amount</span> <span className="text-purple-400">for</span> <span className="text-gray-300">claim</span> <span className="text-purple-400">in</span> <span className="text-gray-300">claims</span>){'\n'}
                      <span className="text-yellow-300">print</span>(<span className="text-green-400">f"Total estimated recovery: $</span><span className="text-cyan-300">{'{'}<span className="text-gray-300">total_value</span>:,.2f{'}'}</span><span className="text-green-400">"</span>){'\n'}
                      {'\n'}
                      <span className="text-gray-500"># Submit claims for recovery</span>{'\n'}
                      <span className="text-purple-400">for</span> <span className="text-gray-300">claim</span> <span className="text-purple-400">in</span> <span className="text-gray-300">claims</span>:{'\n'}
                      {'    '}<span className="text-purple-400">if</span> <span className="text-gray-300">claim</span>.<span className="text-gray-300">confidence</span> <span className="text-pink-400">&gt;=</span> <span className="text-cyan-400">0.85</span>:{'\n'}
                      {'        '}<span className="text-gray-300">result</span> <span className="text-pink-400">=</span> <span className="text-gray-300">client</span>.<span className="text-gray-300">claims</span>.<span className="text-yellow-300">submit</span>(<span className="text-gray-300">claim</span>.<span className="text-gray-300">id</span>){'\n'}
                      {'        '}<span className="text-yellow-300">print</span>(<span className="text-green-400">f"Submitted claim </span><span className="text-cyan-300">{'{'}<span className="text-gray-300">claim</span>.<span className="text-gray-300">id</span>{'}'}</span><span className="text-green-400">: </span><span className="text-cyan-300">{'{'}<span className="text-gray-300">result</span>.<span className="text-gray-300">status</span>{'}'}</span><span className="text-green-400">"</span>)
                    </code>
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
                    Programmatically pull recovery totals, claim statuses, and payout timelines into your dashboards or accounting tools.
                  </p>
                </div>
                <div className="border-l-2 border-gray-200 pl-6">
                  <h3 className="font-medium text-gray-900 mb-1">Automate Workflows</h3>
                  <p className="text-gray-600">
                    Trigger claim submissions, approve matches, or fetch evidence documents via simple REST endpoints.
                  </p>
                </div>
                <div className="border-l-2 border-gray-200 pl-6">
                  <h3 className="font-medium text-gray-900 mb-1">Build Custom Integrations</h3>
                  <p className="text-gray-600">
                    Embed recovery alerts, performance metrics, or recovery insights directly into your own client portals.
                  </p>
                </div>
              </div>
            </section>

            {/* Coming Soon */}
            <section className="mb-16">
              <Card className="bg-gray-50 border-gray-200 shadow-sm rounded-xl">
                <CardContent className="p-8 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Coming Soon
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    We're finalizing our developer documentation and authentication flows.
                    Be among the first to get access when we launch.
                  </p>
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                    Join Waitlist
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </section>

            {/* Footer Note */}
            <footer className="text-center">
              <p className="text-sm text-gray-500">
                Questions about API access?{' '}
                <a href="mailto:support@margin.app" className="text-gray-900 hover:text-gray-600 font-medium">
                  Contact our team
                </a>
              </p>
            </footer>

          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ApiAccess;

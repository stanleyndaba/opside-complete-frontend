import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';

const ApiAccess = () => {
  return (
    <PageLayout title="API Access">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">

          <div className="relative mx-auto max-w-3xl px-6 pt-16 md:pt-24 pb-0 text-gray-700">
            {/* Headline */}
            <header>
              <h1 className="font-brand text-4xl md:text-5xl leading-tight text-gray-900">
                The Clario API: The Financial Engine for Modern Commerce
              </h1>
              <p className="mt-5 text-lg md:text-xl text-gray-600 font-body">
                At Clario, we are building more than a dashboard. We are building the intelligent financial recovery layer for e-commerce. Our future-facing API will allow developers, agencies, and enterprise brands to programmatically access the full power of our platform, integrating automated reimbursement data and workflows directly into their own systems.
              </p>
            </header>

            {/* Visual Anchor: Code Snippet */}
            <section className="mt-10">
              <div className="rounded-xl border border-gray-200 bg-gray-900 shadow-lg">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="ml-3 text-xs uppercase tracking-wider text-gray-400">example.py</span>
                </div>
                <pre className="p-6 overflow-x-auto text-sm md:text-base leading-relaxed text-gray-100" style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace" }}>
<code style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace" }}>
<span style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace" }} className="text-gray-400"># Get the latest recovered claims</span>
<br />
<span style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace" }} className="text-emerald-400">from</span> clario <span style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace" }} className="text-emerald-400">import</span> <span style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace" }} className="text-sky-300">Clario</span>
<br />
<br />
clario <span style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace" }} className="text-emerald-400">=</span> <span style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace" }} className="text-sky-300">Clario</span>(api_key=<span style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace" }} className="text-amber-300">"YOUR_API_KEY"</span>)
<br />
<br />
recovered_claims <span style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace" }} className="text-emerald-400">=</span> clario.claims.list(
  status=<span style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace" }} className="text-amber-300">"recovered"</span>,
  limit=<span style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace" }} className="text-rose-300">10</span>
)
<br />
<br />
<span style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace" }} className="text-emerald-400">for</span> claim <span style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace" }} className="text-emerald-400">in</span> recovered_claims:
  print(f<span style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', 'Menlo', 'Courier New', monospace" }} className="text-amber-300">{"\"Recovered {claim.amount} for claim ID: {claim.id}\""}</span>)
</code>
                </pre>
              </div>
            </section>

            {/* Feature Sections */}
            <section className="mt-12 space-y-10">
              <div>
                <h2 className="font-body text-xl md:text-2xl font-semibold text-gray-900">
                  What You Will Be Able to Do
                </h2>
                <ul className="mt-4 space-y-3 text-gray-700">
                  <li>
                    <span className="text-gray-600">Sync Recovery Data:</span> Pull all detected claims, their statuses, and their financial value directly into your own internal dashboards, data warehouses, or ERP systems.
                  </li>
                  <li>
                    <span className="text-gray-600">Build Custom Reporting:</span> Create bespoke financial reports and analytics for your team or your clients, leveraging real-time data from the Clario engine.
                  </li>
                  <li>
                    <span className="text-gray-600">Automate Workflows:</span> Programmatically approve claims, trigger scans, and manage your recovery pipeline without ever needing to log into the Clario UI.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-body text-xl md:text-2xl font-semibold text-gray-900">
                  How It Will Work
                </h2>
                <ul className="mt-4 space-y-3 text-gray-700">
                  <li>
                    <span className="text-gray-600">Modern REST Architecture:</span> A clean, predictable, and well-documented REST API that is easy to integrate with.
                  </li>
                  <li>
                    <span className="text-gray-600">Real-Time Webhooks:</span> Receive real-time push notifications to your own services for key events like <code className="font-mono bg-gray-100 px-1 rounded">claim.detected</code>, <code className="font-mono bg-gray-100 px-1 rounded">claim.submitted</code>, and <code className="font-mono bg-gray-100 px-1 rounded">funds.recovered</code>.
                  </li>
                  <li>
                    <span className="text-gray-600">Secure and Scalable:</span> Built with the same enterprise-grade security and reliability as our core platform, ensuring your data is always safe and accessible.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-body text-xl md:text-2xl font-semibold text-gray-900">
                  Get Notified
                </h2>
                <p className="mt-4 text-gray-600">
                  Our developer API is currently in a private beta with select partners. If you are an enterprise brand, an agency, or a developer interested in building on the Clario platform, please contact us to be added to the early access list.
                </p>
                <div className="mt-6">
                  <Button asChild className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold">
                    <a href="mailto:hello@getclario.com?subject=Clario%20API%20Early%20Access">Request Early Access</a>
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ApiAccess;

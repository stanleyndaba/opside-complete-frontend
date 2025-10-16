import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const ApiLanding = () => {
  return (
    <PageLayout title="The Clario API">
      <section className="relative -m-4 lg:-m-6 min-h-[calc(100vh-64px)] bg-[#0B1220] text-[#D6DBE3]">
        {/* Blueprint grid background */}
        <div className="pointer-events-none absolute inset-0 [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.04),rgba(255,255,255,0.04)_1px,transparent_1px,transparent_32px),repeating-linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.04)_1px,transparent_1px,transparent_32px)] [background-size:32px_32px]"></div>
        <div className="relative mx-auto max-w-3xl px-6 py-16 md:py-24">
          <header className="mb-12 md:mb-16">
            <h1 className="font-heading text-[32px] leading-tight md:text-5xl md:leading-[1.15] text-[#E8EDF5]">
              The Clario API: The Financial Engine for Modern Commerce
            </h1>
            <p className="mt-5 text-base md:text-lg text-[#AAB4C0] font-body">
              At Clario, we are building more than a dashboard. We are building the intelligent financial recovery layer for e-commerce. Our future-facing API will allow developers, agencies, and enterprise brands to programmatically access the full power of our platform, integrating automated reimbursement data and workflows directly into their own systems.
            </p>
          </header>

          {/* Visual anchor: stylized code snippet */}
          <div className="mb-12 overflow-hidden rounded-xl border border-white/10 bg-[#0F1629] shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
              <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
              <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
              <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
              <span className="ml-3 text-xs text-[#7D8EA3]">example.py</span>
            </div>
            <pre className="p-5 md:p-6 font-mono text-sm leading-6 text-[#D6DBE3]">
              <code>
                <span className="text-[#7D8EA3]"># Get the latest recovered claims</span>
                {'\n'}
                clario = <span className="text-[#00E18C]">Clario</span>(api_key=<span className="text-[#00E18C]">"YOUR_API_KEY"</span>)
                {'\n'}
                {'\n'}
                recovered_claims = clario.claims.list(
                {'\n'}  status=<span className="text-[#00E18C]">"recovered"</span>,
                {'\n'}  limit=<span className="text-[#00E18C]">10</span>
                {'\n'})
                {'\n'}
                {'\n'}
                for claim in recovered_claims:
                {'\n'}  print(f<span className="text-[#00E18C]">"Recovered {'{'}claim.amount{'}'} for claim ID: {'{'}claim.id{'}'}"</span>)
              </code>
            </pre>
          </div>

          {/* What You Will Be Able to Do */}
          <section className="mb-10 md:mb-12">
            <h3 className="font-body text-lg md:text-xl font-semibold text-[#E0E6EF]">What You Will Be Able to Do</h3>
            <ul className="mt-4 space-y-3 text-sm md:text-base text-[#C3CBD6]">
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-[#00E18C]" />
                <span><strong className="text-[#E8EDF5]">Sync Recovery Data:</strong> Pull all detected claims, their statuses, and their financial value directly into your own internal dashboards, data warehouses, or ERP systems.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-[#00E18C]" />
                <span><strong className="text-[#E8EDF5]">Build Custom Reporting:</strong> Create bespoke financial reports and analytics for your team or your clients, leveraging real-time data from the Clario engine.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-[#00E18C]" />
                <span><strong className="text-[#E8EDF5]">Automate Workflows:</strong> Programmatically approve claims, trigger scans, and manage your recovery pipeline without ever needing to log into the Clario UI.</span>
              </li>
            </ul>
          </section>

          {/* How It Will Work */}
          <section className="mb-10 md:mb-12">
            <h3 className="font-body text-lg md:text-xl font-semibold text-[#E0E6EF]">How It Will Work</h3>
            <ul className="mt-4 space-y-3 text-sm md:text-base text-[#C3CBD6]">
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-[#00E18C]" />
                <span><strong className="text-[#E8EDF5]">Modern REST Architecture:</strong> A clean, predictable, and well-documented REST API that is easy to integrate with.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-[#00E18C]" />
                <span><strong className="text-[#E8EDF5]">Real-Time Webhooks:</strong> Receive real-time push notifications to your own services for key events like <code className="font-mono">claim.detected</code>, <code className="font-mono">claim.submitted</code>, and <code className="font-mono">funds.recovered</code>.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-[#00E18C]" />
                <span><strong className="text-[#E8EDF5]">Secure and Scalable:</strong> Built with the same enterprise-grade security and reliability as our core platform, ensuring your data is always safe and accessible.</span>
              </li>
            </ul>
          </section>

          {/* Get Notified */}
          <section className="mb-2 md:mb-4">
            <h3 className="font-body text-lg md:text-xl font-semibold text-[#E0E6EF]">Get Notified</h3>
            <p className="mt-4 text-sm md:text-base text-[#AAB4C0]">
              Our developer API is currently in a private beta with select partners. If you are an enterprise brand, an agency, or a developer interested in building on the Clario platform, please contact us to be added to the early access list.
            </p>
            <div className="mt-6">
              <Button asChild className="h-11 rounded-lg bg-[#00E18C] px-6 text-sm font-semibold text-black transition-colors hover:bg-[#00cf80]">
                <a href="mailto:hello@getclario.com?subject=Clario%20API%20Early%20Access&body=Hi%20Clario%20Team%2C%0A%0AI%27d%20like%20to%20request%20early%20access%20to%20the%20Clario%20API.%0A%0ACompany%3A%20%0ARole%3A%20%0AUse%20case%3A%20%0A%0AThanks!">
                  Request Early Access
                </a>
              </Button>
            </div>
          </section>
        </div>
      </section>
    </PageLayout>
  );
};

export default ApiLanding;

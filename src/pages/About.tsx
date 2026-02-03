import React from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

export default function About() {
  usePageMeta({
    title: 'Corporate Profile | Forensic Reconciliation Protocol',
    description: 'Margin is a high-frequency forensic audit layer for Amazon FBA sellers, optimized for data sovereignty and strict policy compliance.',
    url: `${SITE_META.url}/about`,
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30">
      <PageLayout title="About Margin" midnight>
        <div className="max-w-7xl mx-auto py-24 md:py-32">

          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 mb-32 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-white/30 font-mono tracking-[0.4em] uppercase">
                  CORPORATE MANDATE
                </span>
                <h1 className="text-4xl md:text-6xl font-merriweather font-bold text-white tracking-tight leading-[1.1]">
                  Corporate Profile & <br />
                  <span className="text-white/40 italic">Operational Mandate</span>
                </h1>
              </div>
              <p className="max-w-md text-white/30 text-base md:text-lg font-montserrat leading-relaxed font-medium">
                To ensure institutional-grade forensic validation and priority API rate limits, Margin is strictly optimized for high-complexity FBA operations.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-8">
              {[
                {
                  id: '01',
                  title: 'Algorithmic Reconciliation',
                  color: 'text-emerald-500',
                  desc: 'Margin functions as a high-frequency forensic audit layer for Amazon FBA sellers. Unlike manual virtual assistants, our proprietary logic nodes continually monitor inventory ledgers against financial settlements. We identify statistical anomalies in lost inventory, damaged stock, and uncredited returns with mathematical precision.'
                },
                {
                  id: '02',
                  title: 'Data Sovereignty & Security',
                  color: 'text-blue-500',
                  desc: 'We treat seller data as a financial asset. Margin is built on an isolated, multi-tenant architecture that ensures strict data segregation. We utilize the official Amazon Selling Partner API (SP-API) for all data ingress, ensuring that no sensitive credentials are ever scraped or compromised.'
                },
                {
                  id: '03',
                  title: 'Strict Policy Compliance',
                  color: 'text-amber-500',
                  desc: 'Margin is engineered to operate strictly within the bounds of Amazon’s Terms of Service (ToS). Our "Zero-Risk" claim engine ensures that all reimbursement requests are validated against Amazon\'s own policy windows before generation. We do not automate prohibited actions—protecting account health.'
                }
              ].map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="group border-t border-white/10 py-8 first:border-0"
                >
                  <div className="flex gap-8">
                    <span className={`text-[10px] font-mono ${item.color.replace('text-', 'text-opacity-20 ')} mt-1.5 font-bold`}>{item.id}</span>
                    <div className="space-y-2">
                      <h3 className={`text-sm font-bold text-white font-montserrat uppercase tracking-widest group-hover:${item.color} transition-colors`}>
                        {item.title}
                      </h3>
                      <p className="text-white/40 text-[13px] font-montserrat leading-relaxed font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Infrastructure Metrics */}
          <div className="border-t border-white/5 pt-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-x-12 mb-24">
              <div className="space-y-6">
                <span className="text-[10px] font-bold text-white/30 font-mono tracking-[0.2em] uppercase">THROUGHPUT CAPACITY</span>
                <div className="text-4xl md:text-5xl font-inter font-bold text-white tracking-tight">10k TPS</div>
                <p className="text-white/40 text-sm font-montserrat leading-relaxed font-medium">
                  Enterprise-grade ingestion engine capable of processing 10,000 inventory events per second.
                </p>
              </div>
              <div className="space-y-6">
                <span className="text-[10px] font-bold text-white/30 font-mono tracking-[0.2em] uppercase">AUDIT LATENCY</span>
                <div className="text-4xl md:text-5xl font-inter font-bold text-white tracking-tight">&lt; 200ms</div>
                <p className="text-white/40 text-sm font-montserrat leading-relaxed font-medium">
                  Real-time discrepancy detection. Logic nodes execute immediately upon data ingress from SP-API.
                </p>
              </div>
              <div className="space-y-6">
                <span className="text-[10px] font-bold text-white/30 font-mono tracking-[0.2em] uppercase">SYSTEM UPTIME</span>
                <div className="text-4xl md:text-5xl font-inter font-bold text-white tracking-tight">99.99%</div>
                <p className="text-white/40 text-sm font-montserrat leading-relaxed font-medium">
                  Redundant server clusters ensure your audit process never sleeps, even during global traffic surges.
                </p>
              </div>
            </div>
            <div className="text-center bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
              <p className="text-[10px] text-white/20 font-mono uppercase tracking-[0.2em]">
                Technical performance based on current infrastructure capacity // Audit_Node_Sigma_Active
              </p>
            </div>
          </div>
        </div>
      </PageLayout>
      <BrandFooter />
    </div>
  );
}

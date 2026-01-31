import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Terminal,
  Zap,
  Database,
  RefreshCcw,
  ShieldCheck,
  Layers,
  Building2,
  Code2,
  Lock,
  Workflow
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const ApiAccess = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const pillars = [
    {
      title: "Data Lake Feeder",
      subtitle: "BI Centralization",
      problem: "Enterprise sellers have massive data warehouses (Snowflake, BigQuery). They don't want to log in to Margin—they want the data in their own report.",
      purpose: "Our API dumps the raw Audit Ledger directly into your data warehouse every night.",
      win: "Overlay Recovery Data on top of Supply Chain Data to triangulate supplier risk. You become a data source, not just a tool.",
      icon: Database
    },
    {
      title: "ERP Financial Sync",
      subtitle: "Automated Reconciliation",
      problem: "Recoveries hit bank accounts as random deposits. Accountants have to manually reconcile these to close books in NetSuite or Xero.",
      purpose: "Our endpoints allow your ERP to automatically tag and reconcile cash deposits as 'COGS Recovery' without human touch.",
      win: "Save your accounting team 20+ hours a month. We turn financial tail-chasing into invisible reconciliation.",
      icon: RefreshCcw
    },
    {
      title: "Yield Stream",
      subtitle: "Real-Time Webhooks",
      problem: "Dashboards are passive. If Amazon loses 500 units today, you might not check for a week. That latency is capital leakage.",
      purpose: "We provide high-frequency Webhooks (event: inventory.lost) that fire into your internal infrastructure.",
      win: "As soon as a loss is detected, fire signals to Slack or JIRA. Your logistics team is alerted instantly: 'Alert: Warehouse DAL3 lost 500 units.'",
      icon: Zap
    },
    {
      title: "Headless Management",
      subtitle: "For Aggregators",
      problem: "Aggregators buy new brands weekly. They cannot waste time manually clicking 'Connect Store' in a UI for every acquisition.",
      purpose: "Use our 'Handshake' endpoints to programmatically add new stores to your auditing cycle at scale.",
      win: "Scale with zero friction. Write a script once, and audit 100 brands as easily as one. True Headless Margin.",
      icon: Layers
    }
  ];

  const features = [
    {
      id: "webhooks",
      title: "The Yield Stream",
      status: "LIVE",
      type: "WEBHOOKS",
      desc: "Instant JSON payloads pushed to your endpoints in real-time.",
      events: ["discrepancy.detected", "recovery.settled"],
      code: `{
  "event": "discrepancy.detected",
  "payload": {
    "sku": "A123-PRM",
    "magnitude": 150.00,
    "type": "inbound_defect",
    "node_id": "US-WEST-4"
  }
}`
    },
    {
      id: "etl",
      title: "The Ledger Pipe",
      status: "BETA",
      type: "ETL / BULK DATA",
      desc: "High-throughput endpoints for dumping massive transaction histories.",
      events: ["GET /v1/audit-ledger/stream"],
      code: `curl -X GET "https://api.margin.app/v1/audit-ledger/stream" \\
     -H "Authorization: Bearer os_live_xxxx" \\
     -d "format=json" \\
     -d "range=last_24h"`
    }
  ];

  return (
    <PageLayout title="API Terminal" midnight>
      <div className="min-h-screen bg-[#050505] relative overflow-hidden">
        {/* Matrix Background Aesthetic */}
        <div className="absolute top-0 left-0 w-full h-[1000px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

        <div className="relative container mx-auto px-8 py-20">
          <div className="max-w-6xl mx-auto space-y-24">

            {/* Enterprise Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="flex justify-center">
                <Badge variant="outline" className="px-4 py-1.5 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 font-mono text-[10px] tracking-[0.3em] uppercase">
                  v1.0.0 // ENTERPRISE_GATEWAY
                </Badge>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif text-white tracking-tighter leading-tight max-w-4xl mx-auto">
                Invisible Infrastructure for the <span className="text-emerald-500">Whales</span>.
              </h1>
              <p className="text-xl md:text-2xl text-white/40 font-serif max-w-2xl mx-auto italic">
                "Don't change your workflow. Just consume our stream. We are the pipe that pushes recovered capital back into your P&L."
              </p>
              <div className="pt-8">
                <Button
                  className="bg-white text-black hover:bg-emerald-500 transition-all rounded-xl h-14 px-10 font-serif font-bold uppercase tracking-widest text-sm shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                  onClick={() => window.location.href = 'mailto:enterprise@margin.app'}
                >
                  Request Dedicated Tunnel
                </Button>
              </div>
            </motion.div>

            {/* The 4 Pillars of Headless Margin */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {pillars.map((pillar, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-2xl h-full rounded-2xl backdrop-blur-3xl group hover:border-emerald-500/20 transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none">
                      <pillar.icon className="h-32 w-32 text-emerald-500 rotate-12" />
                    </div>
                    <CardHeader className="p-8 pb-4">
                      <p className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-[0.4em] mb-2">{pillar.subtitle}</p>
                      <CardTitle className="text-2xl font-serif tracking-tight">{pillar.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">Issue</p>
                          <p className="text-xs text-white/60 leading-relaxed italic">"{pillar.problem}"</p>
                        </div>
                        <div className="p-4 border border-emerald-500/10 bg-emerald-500/[0.02] rounded-xl">
                          <p className="text-[10px] font-mono text-emerald-500/40 uppercase tracking-widest mb-1">Tunnel Purpose</p>
                          <p className="text-xs text-white/80 leading-relaxed font-serif">{pillar.purpose}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-emerald-500">
                        <Zap className="h-4 w-4" />
                        <span className="text-[11px] font-mono font-bold uppercase tracking-widest">Yield: {pillar.win}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* API Infrastructure Package */}
            <div className="space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-serif text-white tracking-tight">The Infrastructure Package</h2>
                <p className="text-white/40 font-serif italic text-lg max-w-xl mx-auto">
                  Engineered for $1M - $50M+ GMV sellers and multi-brand Aggregators.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                  >
                    <Card className="bg-[#0c0c0c] border-white/10 text-white rounded-2xl overflow-hidden shadow-2xl">
                      <div className="bg-white/[0.02] border-b border-white/10 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Code2 className="h-5 w-5 text-emerald-500" />
                          <h3 className="text-sm font-mono font-bold uppercase tracking-widest">{feature.title}</h3>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-mono px-3 py-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 tracking-widest">
                          {feature.status} // {feature.type}
                        </Badge>
                      </div>
                      <CardContent className="p-0">
                        <div className="p-8 space-y-6">
                          <p className="text-xs text-white/40 font-serif italic leading-relaxed">
                            "{feature.desc}"
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {feature.events.map(ev => (
                              <Badge key={ev} className="bg-white/5 text-white/60 border-white/10 font-mono text-[9px] px-2 py-0.5">
                                {ev}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="bg-black/40 p-6 relative group">
                          <pre className="text-[11px] font-mono leading-relaxed text-emerald-500/90 whitespace-pre-wrap">
                            <code>{feature.code}</code>
                          </pre>
                          <div className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <Terminal className="h-4 w-4 text-white/40" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Final Enterprise Pitch */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden border border-emerald-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="p-12 md:p-20 text-center space-y-8 relative z-10 backdrop-blur-3xl bg-black/40">
                <div className="flex justify-center">
                  <ShieldCheck className="h-16 w-16 text-emerald-500" />
                </div>
                <h2 className="text-4xl md:text-5xl font-serif text-white tracking-tighter">
                  Scale your forensic audit cycle to <span className="text-emerald-500">infinity</span>.
                </h2>
                <p className="text-lg text-white/40 font-serif max-w-2xl mx-auto italic">
                  "When you acquisition a new $10M brand on Tuesday, your IT team runs a script on Wednesday, and by Thursday, that brand is generating yield in our engine. We are the invisible automation that scales with your fleet."
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                  <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-black font-serif font-bold uppercase tracking-widest h-14 px-12 rounded-xl transition-all shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                    Enterprise Onboarding
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-white/10 hover:border-emerald-500/50 text-white font-mono uppercase tracking-widest text-xs h-14 px-10 rounded-xl"
                  >
                    View API Spec
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Footer Institutional Proof */}
            <div className="pt-20 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-white/20">
              <div className="flex items-center gap-4">
                <Lock className="h-4 w-4" />
                <span className="text-[10px] font-mono tracking-widest uppercase">Encryption: AES-256 // TLS 1.3</span>
              </div>
              <div className="flex items-center gap-12">
                <span className="text-[10px] font-mono tracking-widest uppercase">Architecture: Serverless TUNNEL</span>
                <span className="font-serif italic text-xs">"Yield focused. Data sovereign."</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ApiAccess;

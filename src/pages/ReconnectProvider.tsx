import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { tenantRoute } from '@/lib/routes';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Lock,
  Zap,
  FileText,
  Database,
  Globe,
  CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';

const PROVIDER_META: Record<string, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  amazon: {
    label: 'Amazon SP-API',
    icon: <Database className="h-6 w-6 text-emerald-500" />,
    color: 'emerald',
    description: 'Direct institutional connection for real-time inventory and financial event mapping.',
  },
  gmail: {
    label: 'Gmail Recovery Node',
    icon: <Globe className="h-6 w-6 text-red-500" />,
    color: 'red',
    description: 'Evidence extraction node for matching unreturned refund emails to recovery cases.',
  },
  outlook: {
    label: 'Outlook Recovery Node',
    icon: <Globe className="h-6 w-6 text-blue-500" />,
    color: 'blue',
    description: 'Enterprise email bridge for automated evidence ingestion and matching.',
  },
  gdrive: {
    label: 'Google Drive Repository',
    icon: <Database className="h-6 w-6 text-emerald-500" />,
    color: 'emerald',
    description: 'Secure document repository access for high-volume evidence storage.',
  },
  dropbox: {
    label: 'Dropbox Repository',
    icon: <Database className="h-6 w-6 text-sky-500" />,
    color: 'sky',
    description: 'Cloud-based evidence processing for centralized document management.',
  },
};

const PERMISSION_MAPPING: Record<string, { title: string; desc: string }> = {
  'orders.read': { title: 'Order Forensics', desc: 'Deep-level sync of transaction logs for SKU mapping.' },
  'inventory.read': { title: 'Drift Identification', desc: 'Real-time monitoring of warehouse inventory movement.' },
  'transactions.read': { title: 'Financial Reconciliation', desc: 'Direct mapping of financial events to approved claims.' },
  'mail.readonly': { title: 'Evidence Ingestion', desc: 'Passive scanning for refund and return confirmations.' },
  'mail.read': { title: 'Evidence Ingestion', desc: 'Passive scanning for refund and return confirmations.' },
  'drive.readonly': { title: 'Document Extraction', desc: 'Secure access to support documentation and proof.' },
  'files.metadata.read': { title: 'Metadata Analysis', desc: 'Structure-level scanning for specific evidence tags.' },
};

export default function ReconnectProvider() {
  const { provider = 'amazon', tenantSlug } = useParams<{ provider: string, tenantSlug: string }>();
  const { tenant } = useTenant();
  const activeTenantSlug = tenantSlug || tenant?.slug || 'default';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const meta = useMemo(() => PROVIDER_META[provider] || PROVIDER_META.amazon, [provider]);
  const scopes = (provider === 'amazon' ? ['orders.read', 'inventory.read', 'transactions.read'] :
    provider === 'gmail' ? ['mail.readonly'] :
      provider === 'outlook' ? ['mail.read'] :
        provider === 'gdrive' ? ['drive.readonly'] :
          ['files.metadata.read']);

  const begin = useCallback(async () => {
    setLoading(true);
    try {
      if (provider === 'amazon') {
        const res = await api.connectAmazon();
        const url = res.data?.auth_url;
        if ((res as any)?.ok && url) {
          window.location.assign(url as string);
          return;
        }
        window.location.assign('/auth/amazon-sandbox');
        return;
      }

      if (['gmail', 'outlook', 'gdrive', 'dropbox'].includes(provider)) {
        const r = await api.connectDocs(provider as 'gmail' | 'outlook' | 'gdrive' | 'dropbox');
        if (r.ok && r.data?.auth_url) {
          window.location.assign(r.data.auth_url);
          return;
        }
        window.location.assign(`/auth/${provider}-sandbox`);
        return;
      }

      const r = await api.connectIntegration(provider);
      const url = (r as any)?.data?.auth_url;
      if ((r as any)?.ok && url) {
        window.location.assign(url as string);
      } else {
        window.location.assign(`/auth/${provider}-sandbox`);
      }
    } catch {
      window.location.assign(`/auth/${provider}-sandbox`);
    } finally {
      setLoading(false);
    }
  }, [provider]);

  return (
    <PageLayout title={`Connect ${meta.label}`} midnight hideNavbar hideSidebar>
      <div className="min-h-screen py-12 px-6 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Aesthetic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="container max-w-2xl relative z-10"
        >
          {/* Back Navigation */}
          <div className="mb-12">
            <Link to={tenantRoute(activeTenantSlug, '/integrations-hub')} className="group flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-mono text-white/30 hover:text-white transition-all cursor-pointer">
              <div className="p-2 border border-white/10 group-hover:border-white/30 transition-all rounded-sm">
                <ArrowLeft className="h-3 w-3" />
              </div>
              Back to Integrations
            </Link>
          </div>

          {/* Connection Header */}
          <div className="space-y-8 mb-12">
            <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-sm">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-white/60 font-mono tracking-widest uppercase">Institutional Connection</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="h-20 w-20 flex items-center justify-center bg-white/5 border border-white/10 rounded-sm p-4 relative group">
                <div className="absolute inset-0 bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition-all" />
                {provider === 'amazon' ? (
                  <img src="/Amazon-logo.png" alt="Amazon" className="h-10 w-10 object-contain relative z-10" />
                ) : (
                  <div className="relative z-10">{meta.icon}</div>
                )}
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-merriweather font-bold tracking-tight text-white mb-2">
                  {meta.label}
                </h1>
                <p className="text-white/50 text-sm font-medium leading-relaxed max-w-sm">
                  {meta.description}
                </p>
              </div>
            </div>
          </div>

          {/* Main Action Area */}
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-sm p-8 space-y-8 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-all">
                <Database className="h-32 w-32" />
              </div>

              <div className="space-y-6 relative z-10">
                <h3 className="text-xs font-bold text-white/40 font-mono tracking-[0.2em] uppercase">Required Authorizations</h3>

                <div className="grid gap-4">
                  {scopes.map((s, idx) => {
                    const info = PERMISSION_MAPPING[s] || { title: s, desc: 'Required for platform functionality.' };
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        key={s}
                        className="flex gap-4 p-4 bg-white/5 border border-white/5 rounded-sm hover:border-white/10 transition-all"
                      >
                        <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center bg-white/5 rounded-sm border border-white/10">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white/90 uppercase tracking-tighter mb-1">{info.title}</p>
                          <p className="text-[11px] text-white/40 leading-relaxed font-inter">{info.desc}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 relative z-10">
                <Button
                  onClick={begin}
                  disabled={loading}
                  className="w-full sm:w-auto h-14 px-10 bg-white text-black hover:bg-white/90 rounded-sm font-bold text-[10px] uppercase tracking-[0.2em] transition-all"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <Zap className="h-4 w-4 mr-3 fill-current" />}
                  Establish Terminal Connection
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate(tenantRoute(activeTenantSlug, '/integrations-hub'))}
                  className="w-full sm:w-auto h-14 px-8 text-white/40 hover:text-white hover:bg-white/5 rounded-sm font-bold text-[10px] uppercase tracking-[0.2em] transition-all"
                >
                  Terminate
                </Button>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="grid sm:grid-cols-3 gap-6 pt-6">
              {[
                { icon: <Lock className="h-4 w-4" />, label: "End-to-End Encryption" },
                { icon: <ShieldCheck className="h-4 w-4" />, label: "OIDC Protocol" },
                { icon: <FileText className="h-4 w-4" />, label: "Audit Traceable" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/5 rounded-sm">
                  <div className="text-white/20">{item.icon}</div>
                  <span className="text-[9px] font-bold text-white/40 font-mono tracking-widest uppercase">{item.label}</span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-center text-white/20 font-mono tracking-widest uppercase pt-12">
              Margin Nodes Utilize Bank-Grade Key Exchange Protocols. Access can be revoked in real-time.
            </p>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}

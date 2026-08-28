import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import AdminOnly from '@/components/routes/AdminOnly';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

type SalesLead = {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  annual_gmv: string;
  accounts_marketplaces?: string | null;
  catalogue_complexity?: string | null;
  current_process?: string | null;
  objective?: string | null;
  notes?: string | null;
  status: string;
  created_at: string;
};

const display = (value?: string | null) => value?.trim() || '—';

export default function SalesLeads() {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    const response = await api.getSalesLeads(100, 0);
    if (response.ok && response.data?.success) setLeads(response.data.leads as SalesLead[]);
    else setError(response.error || 'Could not load sales leads.');
    setLoading(false);
  };

  useEffect(() => { void loadLeads(); }, []);

  return (
    <AdminOnly>
      <PageLayout title="Admin // Sales Leads" midnight>
        <div className="min-h-screen bg-[#050505] px-4 py-8 text-white lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#7EA9FF]">Talk to Sales inbox</p>
                <h1 className="mt-2 text-3xl font-semibold">Persisted assessment leads</h1>
                <p className="mt-2 text-sm text-white/60">Review the information sellers submitted before assigning Recovery Control, Enterprise, or Scale.</p>
              </div>
              <Button onClick={() => void loadLeads()} disabled={loading} variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
            {error && <div className="rounded-lg border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200">{error}</div>}
            {!loading && !error && leads.length === 0 && <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-sm text-white/60">No sales leads have been submitted yet.</div>}
            {leads.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.03]">
                <table className="min-w-[1050px] w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/50">
                    <tr>{['Submitted', 'Seller', 'Company', 'Role', 'Annual GMV', 'Accounts / marketplaces', 'Objective', 'Status'].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {leads.map((lead) => <tr key={lead.id} className="align-top hover:bg-white/[0.04]">
                      <td className="whitespace-nowrap px-4 py-4 text-white/60">{new Date(lead.created_at).toLocaleString()}</td>
                      <td className="px-4 py-4"><div className="font-medium">{lead.name}</div><a className="text-[#7EA9FF] hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a></td>
                      <td className="px-4 py-4">{lead.company}</td>
                      <td className="px-4 py-4">{lead.role}</td>
                      <td className="px-4 py-4">{lead.annual_gmv}</td>
                      <td className="max-w-[220px] px-4 py-4 text-white/70">{display(lead.accounts_marketplaces)}</td>
                      <td className="max-w-[260px] px-4 py-4 text-white/70">{display(lead.objective)}</td>
                      <td className="px-4 py-4"><span className="rounded-full border border-[#7EA9FF]/30 px-2 py-1 text-xs text-[#B9D0FF]">{lead.status}</span></td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </PageLayout>
    </AdminOnly>
  );
}

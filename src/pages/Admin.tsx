import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const v = typeof window !== 'undefined' ? localStorage.getItem('clario.admin') : null;
      setIsAdmin(v === 'true');
    } catch {}
  }, []);

  const toggle = (value: boolean) => {
    setIsAdmin(value);
    try { localStorage.setItem('clario.admin', value ? 'true' : 'false'); } catch {}
  };

  return (
    <PageLayout title="Admin">
      <div className="relative -m-4 lg:-m-6 min-h-screen bg-[#0B1220]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
        <div className="container mx-auto px-6 md:px-10 lg:px-12">
        <Card className="bg-white/10 backdrop-blur-xl border-white/10 rounded-2xl text-gray-300">
          <CardHeader>
            <CardTitle className="text-gray-100">Admin Mode</CardTitle>
            <CardDescription>Enable admin access to internal tools.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-gray-100 font-medium">Admin access</div>
                <div className="text-gray-400 text-sm">Controls visibility of internal pages e.g. revenue model.</div>
              </div>
              <Switch checked={isAdmin} onCheckedChange={toggle} />
            </div>
            <div className="pt-4">
              <Button asChild className="bg-white/10 hover:bg-white/20 border border-white/10 text-gray-100">
                <a href="/revenue-model">Open Revenue Model</a>
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </PageLayout>
  );
}

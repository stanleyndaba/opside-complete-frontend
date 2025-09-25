
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

const Index = () => {
  return <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
      <header className="border-b bg-[hsl(var(--card))]/60 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="font-logo text-xl tracking-tight text-foreground">Clario</div>
          <nav className="flex items-center gap-4 text-sm">
            <Button variant="ghost" onClick={async () => { const res = await api.connectAmazon(); if (res.ok && res.data?.redirect_url) window.location.href = res.data.redirect_url; }}>
              Login
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg" onClick={async () => { const res = await api.connectAmazon(); if (res.ok && res.data?.redirect_url) window.location.href = res.data.redirect_url; }}>
              Connect Amazon
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-6 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              The end of FBA reimbursement work.
            </h1>
            <p className="font-body text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Clario works silently in the background to find, prove, and file every claim.  Free to start. No credit card required.
            </p>
            <div className="pt-2">
              <div className="flex items-center justify-center gap-3">
                <Button size="lg" className="bg-emerald-500/90 hover:bg-emerald-600 text-white font-body shadow-lg" onClick={async () => {
                  const res = await api.connectAmazon();
                  if (res.ok && res.data?.redirect_url) window.location.href = res.data.redirect_url;
                }}>
                  Connect Amazon
                </Button>
                <Button size="lg" variant="outline" className="bg-white text-black border-gray-200 hover:bg-gray-50">
                  45s Demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-6 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Clario, Inc. All rights reserved.
        </div>
      </footer>
    </div>;
};

export default Index;


import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

const Index = () => {
  return <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
      <header className="border-b bg-[hsl(var(--card))]/60 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-5 flex items-center justify-end">
          <nav className="flex items-center gap-4 text-sm">
            <Button variant="ghost" onClick={async () => { const res = await api.connectAmazon(); if (res.ok && res.data?.redirect_url) window.location.href = res.data.redirect_url; }}>
              Login
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg" onClick={async () => { const res = await api.connectAmazon(); if (res.ok && res.data?.redirect_url) window.location.href = res.data.redirect_url; }}>
              Connect Amazon & Start Free Audit
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-6 py-20 md:py-28">
          <div className="max-w-4xl space-y-6">
            <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Recover more, with zero effort.
            </h1>
            <p className="font-body text-base md:text-xl text-muted-foreground max-w-2xl">
              Clario is your automated forensic accountant. We find, file, and prove every FBA claim you're owed. No upfront fees. We only win when you win.
            </p>
            <ul className="mt-3 space-y-2 text-sm md:text-base text-foreground">
              <li>✅ Instantly discover what you're owed with our 60-second Value Audit.</li>
              <li>✅ Automatically find proof for higher claims by connecting your email.</li>
              <li>✅ Track your recoveries and predictable payouts in a simple Command Center.</li>
            </ul>
            <div className="pt-2">
              <div className="flex items-center gap-3">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-body shadow-lg" onClick={async () => {
                  const res = await api.connectAmazon();
                  if (res.ok && res.data?.redirect_url) window.location.href = res.data.redirect_url;
                }}>
                  <img src="/lovable-uploads/14f98d63-9a1a-4128-8021-1d840d778ea5.png" alt="Amazon" className="h-5 w-5 mr-2" width="20" height="20" decoding="async" loading="lazy" />
                  Connect Amazon & Start Audit
                </Button>
                <Button variant="outline" size="lg" asChild className="border-emerald-500 text-emerald-600 hover:bg-emerald-50">
                  <Link to="/app">Watch a 2-Min Demo</Link>
                </Button>
              </div>
              <div className="mt-2 text-center">
                <span className="text-xs text-muted-foreground">Free to start. No credit card required.</span>
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

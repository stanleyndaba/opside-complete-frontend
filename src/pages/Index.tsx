
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

const Index = () => {
  return <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/clario-logo.svg" alt="Clario" className="h-8 sm:h-9 w-auto dark:hidden" decoding="async" fetchpriority="high" />
            <img src="/clario-logo-dark.svg" alt="Clario" className="h-8 sm:h-9 w-auto hidden dark:block" decoding="async" fetchpriority="high" />
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <button className="text-muted-foreground hover:text-foreground" onClick={() => { window.location.href = api.getAmazonOAuthStartUrl('/oauth/success'); }}>Login</button>
            <Button className="bg-[#FF9900] hover:bg-[#e68900] text-black" onClick={() => { window.location.href = api.getAmazonOAuthStartUrl('/oauth/success'); }}>
              Get Started Free
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-6 py-16 md:py-24">
          <div className="max-w-3xl space-y-4">
            <h1 className="font-montserrat text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
              Recover more, with zero effort.
            </h1>
            <p className="font-montserrat text-base md:text-lg text-muted-foreground">
              Clario is your automated forensic accountant. We find, file, and prove every FBA claim you're owed. No upfront fees. We only win when you win.
            </p>
            <ul className="mt-2 space-y-2 text-sm md:text-base text-foreground">
              <li>✅ Instantly discover what you're owed with our 60-second Value Audit.</li>
              <li>✅ Automatically find proof for higher claims by connecting your email.</li>
              <li>✅ Track your recoveries and predictable payouts in a simple Command Center.</li>
            </ul>
            <div className="pt-2">
              <div className="flex items-center gap-3">
                <Button size="lg" className="bg-[#FF9900] hover:bg-[#e68900] text-black font-montserrat" onClick={() => {
                  window.location.href = api.getAmazonOAuthStartUrl('/oauth/success');
                }}>
                  <img src="/lovable-uploads/14f98d63-9a1a-4128-8021-1d840d778ea5.png" alt="Amazon" className="h-5 w-5 mr-2" width="20" height="20" decoding="async" loading="lazy" />
                  Connect Amazon & Start Audit
                </Button>
                <Button variant="outline" size="lg" asChild>
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

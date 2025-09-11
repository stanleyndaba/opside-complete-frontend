
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

const Index = () => {
  return <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/clario-logo.svg" alt="Clario" className="h-6 w-6" />
            <span className="font-montserrat font-semibold">Clario</span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/app" className="hover:text-foreground">Dashboard</Link>
            <Link to="/integrations-hub" className="hover:text-foreground">Integrations</Link>
            <Link to="/recoveries" className="hover:text-foreground">Recoveries</Link>
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
              We automatically find, file, and prove every eligible claim. Transparent 20% performance cap. No upfront costs.
            </p>
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              Optional: Supercharge automation — connect Gmail or Drive to auto-collect invoices and receipts.
            </div>
            <div className="pt-2 flex items-center gap-3">
              <Button size="lg" className="bg-[#FF9900] hover:bg-[#e68900] text-black font-montserrat" onClick={() => {
                window.location.href = api.getAmazonOAuthStartUrl('/app');
              }}>
                <img src="/lovable-uploads/14f98d63-9a1a-4128-8021-1d840d778ea5.png" alt="Amazon" className="h-5 w-5 mr-2" />
                Sign in with Amazon
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/app">View Demo</Link>
              </Button>
              <span className="text-xs text-muted-foreground">No credit card required</span>
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

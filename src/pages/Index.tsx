
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plug, Link as LinkIcon, Mail, Twitter } from 'lucide-react';
import { api } from '@/lib/api';

const Index = () => {
  return <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
      <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur-md">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="font-logo text-xl tracking-tight text-foreground">Clario</div>
          <nav className="flex items-center gap-4 text-sm">
            <Button variant="ghost" onClick={async () => { const res = await api.connectAmazon(); if (res.ok && res.data?.redirect_url) window.location.href = res.data.redirect_url; }}>
              Login
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg" asChild>
              <Link to="/integrations-hub">
                <Plug className="h-5 w-5 mr-2" strokeWidth={1.75} />
                Integrations
              </Link>
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
                  <LinkIcon className="h-5 w-5 mr-2" strokeWidth={1.75} />
                  Connect Amazon
                </Button>
                <Button size="lg" variant="outline" className="bg-white text-black border-gray-200 hover:bg-gray-50" asChild>
                  <Link to="/app">45s Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between text-sm">
          <div className="font-logo text-base text-foreground">Clario</div>
          <div className="flex items-center gap-6 text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground">Terms of use</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          </div>
        </div>
      </div>

      <footer>
        <div className="container mx-auto px-6 py-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <a href="mailto:hello@getclario.com" aria-label="Email" className="hover:text-foreground">
            <Mail className="h-5 w-5" strokeWidth={1.75} />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="hover:text-foreground">
            <Twitter className="h-5 w-5" strokeWidth={1.75} />
          </a>
          <span>© {new Date().getFullYear()} Clario, Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>;
};

export default Index;

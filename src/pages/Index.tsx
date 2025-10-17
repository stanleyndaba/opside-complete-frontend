import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Link as LinkIcon, Mail, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

const Index = () => {
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1220] landing">
      <header className="sticky top-0 z-40 border-transparent bg-transparent">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo-abstract.svg" alt="Logo" className="h-8 w-8" />
            <span className="font-medium text-gray-100">Clario</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Button variant="ghost" className="text-gray-200 hover:bg-white/10 hover:text-white" type="button" disabled={connecting} onClick={async () => { 
              if (connecting) return; setConnecting(true);
              try {
                const res = await api.connectAmazon(); 
                const url = (res as any)?.data?.auth_url || (res as any)?.data?.redirect_url;
                if ((res as any)?.ok && url) window.location.assign(url as string); else window.location.assign('/auth/amazon-sandbox');
              } catch {
                window.location.assign('/auth/amazon-sandbox');
              }
            }}>
              Login
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-6 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight text-gray-100">
              The <span className="text-emerald-500">end</span> of FBA reimbursement work.
            </h1>
            <p className="font-body text-base md:text-xl text-gray-300 max-w-3xl mx-auto">
              Clario is the zero-effort platform that automates your FBA financial audits. We find discrepancies, build the evidence, and manage the full recovery process, so you can focus on building your brand.
            </p>
            <div className="pt-2">
              <div className="flex items-center justify-center gap-3">
                <Button size="lg" type="button" disabled={connecting} className="bg-emerald-500 hover:bg-emerald-600 text-white font-body shadow-lg" onClick={async () => {
                  if (connecting) return; setConnecting(true);
                  try {
                    const res = await (api as any).connectAmazon?.();
                    const url = (res as any)?.data?.auth_url || (res as any)?.data?.redirect_url;
                    if ((res as any)?.ok && url) {
                      window.location.assign(url as string);
                    } else {
                      window.location.assign('/auth/amazon-sandbox');
                    }
                  } catch {
                    window.location.assign('/auth/amazon-sandbox');
                  }
                }}>
                  <LinkIcon className="h-5 w-5 mr-2" strokeWidth={1.75} />
                  Connect Amazon
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div>
        <div className="container mx-auto px-6 py-4 flex items-center justify-end text-sm">
          <div className="flex items-center gap-6 text-gray-400">
            <Link to="/terms" className="hover:text-gray-200">Terms of use</Link>
            <Link to="/privacy" className="hover:text-gray-200">Privacy Policy</Link>
          </div>
        </div>
      </div>

      <footer id="core-footer">
        <div className="container mx-auto px-6 py-6 flex items-center justify-center gap-4 text-xs text-gray-400">
          <a href="mailto:hello@getclario.com" aria-label="Email" className="hover:text-foreground">
            <Mail className="h-5 w-5" strokeWidth={1.75} />
          </a>
          <span>© {new Date().getFullYear()} Clario, Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;

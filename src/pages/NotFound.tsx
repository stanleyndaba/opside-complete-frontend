import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Compass, HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { normalizeTenantSlug, tenantRoute } from "@/lib/routes";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("404 route miss:", location.pathname);
  }, [location.pathname]);

  const routeContext = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const tenantSlug = segments[0] === "app" ? normalizeTenantSlug(segments[1]) : null;
    const inWorkspace = Boolean(tenantSlug);

    return {
      inWorkspace,
      primaryHref: inWorkspace ? tenantRoute(tenantSlug, "/dashboard") : "/",
      primaryLabel: inWorkspace ? "Return to workspace" : "Go to Margin",
      supportHref: inWorkspace ? tenantRoute(tenantSlug, "/help") : "/contact",
      recoveryHint: inWorkspace
        ? "Return to the workspace home, then reopen this area from the sidebar or recent activity."
        : "Return to the main site and open the page you need from the main navigation.",
    };
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070707] text-white">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10 lg:px-10">
        <div className="w-full max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/55">
              404
            </div>
            <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/28">
              Route unavailable
            </div>
          </div>

          <h1 className="max-w-3xl text-4xl font-sans font-light tracking-tight text-white lg:text-5xl">
            We could not find that page.
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-sans leading-6 text-white/46">
            The link may be incomplete, expired, or no longer active. You can get back to a live page from here without losing your place.
          </p>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border-y border-white/8">
              <div className="py-5">
                <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/28">
                  Requested path
                </div>
                <div className="mt-3 break-all font-mono text-[11px] leading-6 text-white/52">
                  {location.pathname}
                </div>
              </div>
              <div className="border-t border-white/8 py-5">
                <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/28">
                  Best next step
                </div>
                <p className="mt-3 max-w-xl text-sm font-sans leading-6 text-white/46">
                  {routeContext.recoveryHint}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-start gap-3">
              <Button
                asChild
                className="h-11 justify-between rounded-lg border border-white/10 bg-[#141414] px-4 text-white shadow-lg shadow-[0_0_20px_rgba(0,0,0,0.25)] hover:bg-[#1b1b1b]"
              >
                <Link to={routeContext.primaryHref}>
                  <span className="inline-flex items-center gap-2 font-sans font-medium tracking-tight">
                    <Compass className="h-4 w-4" />
                    {routeContext.primaryLabel}
                  </span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-11 justify-between rounded-lg border-white/10 bg-transparent px-4 text-white/70 hover:bg-white/[0.03] hover:text-white"
              >
                <Link to={routeContext.supportHref}>
                  <span className="inline-flex items-center gap-2 font-sans font-medium tracking-tight">
                    <HelpCircle className="h-4 w-4" />
                    Open support
                  </span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>

              <button
                type="button"
                onClick={() => window.history.back()}
                className="mt-2 inline-flex items-center gap-2 text-left text-sm font-sans text-white/42 transition-colors hover:text-white/70"
              >
                <ArrowLeft className="h-4 w-4" />
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

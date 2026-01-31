import React, { useState, useCallback, useMemo } from 'react';
import { LayoutDashboard, ShieldCheck, Settings2, Sparkles, ChevronLeft, ChevronRight, BarChart3, LogOut, FileText, LifeBuoy, User, Plug, Box, Menu, Zap, Headset, Gift, Copy, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { motion, AnimatePresence } from 'framer-motion';

// Lightweight prefetch using dynamic import hints matching route chunks
const prefetchRoute = (path: string) => {
  try {
    switch (path) {
      case '/app':
        import('@/components/layout/Dashboard');
        break;
      case '/reports':
        import('@/pages/Reports');
        break;
      case '/upcoming-payments':
        import('@/pages/UpcomingPayments');
        break;
      case '/recoveries':
        import('@/pages/Recoveries');
        break;
      case '/settings':
        import('@/pages/Settings');
        break;
      case '/help':
        import('@/pages/Help');
        break;
      case '/whats-new':
        import('@/pages/WhatsNew');
        break;
      case '/integrations-hub':
        import('@/pages/IntegrationsHub');
        break;
      default:
        break;
    }
  } catch { }
};
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}
interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
}
interface NavSection {
  title: string;
  items: NavItem[];
}
export function Sidebar({
  isCollapsed,
  onToggle,
  className
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { tenant } = useTenant();
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [claimCount, setClaimCount] = useState<number | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);

  // States for referral functionality
  const [showReferralPopup, setShowReferralPopup] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Referral link helpers
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/signup?ref=demo-user`
    : '/signup?ref=demo-user';

  const getShortLink = (link: string) => {
    try {
      const url = new URL(link);
      const domain = url.hostname.replace('www.', '');
      const path = url.pathname + url.search;
      if (domain.length > 20) return `...${domain.slice(-15)}${path}`;
      return `${domain}${path}`;
    } catch {
      return link.length > 30 ? `...${link.slice(-25)}` : link;
    }
  };

  const shortLink = getShortLink(referralLink);

  const handleSignOut = async () => {
    try { await api.logout(); } catch (_) { }
    window.location.href = '/';
  };

  // Get tenant slug from URL or context
  const currentTenantSlug = tenantSlug || tenant?.slug || 'default';

  // Fetch connected email from evidence sources
  React.useEffect(() => {
    (async () => {
      try {
        const r = await api.getEvidenceSources();
        if (r.ok && r.data?.sources) {
          const gmailSource = r.data.sources.find((s: any) => s.provider === 'gmail' && s.status === 'connected');
          if (gmailSource?.account_email) {
            setConnectedEmail(gmailSource.account_email);
          }
        }
      } catch { }
    })();
  }, []);

  // Fetch claim count
  React.useEffect(() => {
    (async () => {
      try {
        const r = await api.getRecoveriesMetrics(currentTenantSlug);
        if (r.ok && r.data?.totalClaimsFound !== undefined) {
          setClaimCount(r.data.totalClaimsFound);
        }
      } catch { }
    })();
  }, [currentTenantSlug]);

  // Check if we're on the Dashboard (Command Center) page
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/app' || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/app');

  const primaryItems: NavItem[] = [
    { title: 'Overview', icon: LayoutDashboard, href: `/app/${currentTenantSlug}` },
    { title: 'Claims', icon: ShieldCheck, href: `/app/${currentTenantSlug}/recoveries` },
    { title: 'Documents and Files', icon: FileText, href: `/app/${currentTenantSlug}/evidence-locker` },
    // { title: 'Reports', icon: BarChart3, href: `/app/${currentTenantSlug}/reports` },
    { title: 'Refund Recoveries', icon: Plug, href: `/app/${currentTenantSlug}/upcoming-payments` },
    { title: 'Transaction History', icon: BarChart3, href: `/app/${currentTenantSlug}/transaction-history` },
    { title: 'Integrations', icon: Box, href: `/app/${currentTenantSlug}/integrations-hub` }
  ];

  const secondaryItems: NavItem[] = []; // Moved to "More" menu
  const NavItemComponent = React.memo(({
    item
  }: {
    item: NavItem;
  }) => {
    const isActive = location.pathname === item.href;
    const handlePrefetch = useCallback(() => {
      prefetchRoute(item.href);
      if (item.href === '/app') {
        queryClient.prefetchQuery({
          queryKey: ['dashboard-aggregates', '30d'], queryFn: async () => {
            const r = await api.getDashboardAggregates('30d');
            if (!r.ok || !r.data) throw new Error('aggregate prefetch');
            return r.data;
          }
        });
        queryClient.prefetchQuery({
          queryKey: ['recoveries-metrics'], queryFn: async () => {
            const r = await api.getRecoveriesMetrics();
            if (!r.ok || !r.data) throw new Error('metrics prefetch');
            return r.data;
          }
        });
      }
      if (item.href === '/recoveries') {
        queryClient.prefetchQuery({
          queryKey: ['recoveries-metrics'], queryFn: async () => {
            const r = await api.getRecoveriesMetrics();
            if (!r.ok || !r.data) throw new Error('metrics prefetch');
            return r.data;
          }
        });
      }
    }, [item.href, queryClient]);
    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={item.href}
                onMouseEnter={handlePrefetch}
                className={cn(
                  "relative flex items-center justify-center w-12 h-12 transition-all duration-300 rounded-xl group",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : "text-white/30 hover:bg-white/5 hover:text-white"
                )}
                style={{ willChange: 'background-color' }}>
                {isActive && (
                  <motion.span
                    layoutId="active-indicator-collapsed"
                    className="absolute left-0 top-3 bottom-3 w-[3px] bg-emerald-500 rounded-r-full shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                  />
                )}
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#0c0c0c] border border-white/10 text-emerald-500 text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 backdrop-blur-xl">
              {item.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <Link
        to={item.href}
        onMouseEnter={handlePrefetch}
        className={cn(
          "relative flex items-center gap-3 w-full px-5 py-2.5 transition-all duration-300 group rounded-xl mb-1",
          isActive
            ? "bg-white/[0.03] text-white shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            : "text-white/40 hover:bg-white/[0.02] hover:text-white"
        )}
        style={{ willChange: 'background-color, transform' }}>
        {isActive && (
          <motion.span
            layoutId="active-indicator"
            className="absolute left-0 top-3 bottom-3 w-[3px] bg-emerald-500 rounded-r-full shadow-[0_0_12px_rgba(16,185,129,0.6)]"
          />
        )}
        {!isActive && (
          <span className="absolute left-0 top-3 bottom-3 w-[3px] bg-emerald-500/20 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
        <item.icon strokeWidth={isActive ? 2 : 1.5} className={cn("h-4.5 w-4.5 shrink-0 transition-all duration-300", isActive ? "text-emerald-500 scale-110" : "text-white/20 group-hover:text-white")} />
        <span className={cn(
          "text-[11px] font-serif transition-colors tracking-[0.1em] uppercase",
          isActive ? "font-medium text-white" : "font-light"
        )}>{item.title}</span>
        {item.title === 'Claims' && claimCount !== null && !isCollapsed && (
          <span className={cn(
            "ml-auto text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-md border",
            isActive
              ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
              : "text-white/20 bg-white/5 border-white/5"
          )}>
            {claimCount}
          </span>
        )}
      </Link>
    );
  });
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 transition-all duration-500 ease-in-out flex flex-col h-screen z-40 gpu-accelerated font-serif shadow-[10px_0_50px_rgba(0,0,0,0.8)]",
        isCollapsed ? "w-20" : "w-64",
        "text-white/60 border-r border-white/5",
        "bg-[#070707]",
        className
      )}
      style={{ willChange: 'width' }}>
      {/* Branding Header */}
      <div
        className={cn(
          "border-b border-white/5 flex items-center h-16",
          isCollapsed ? "justify-center px-2" : "justify-between px-6"
        )}>
        <div className={cn("flex items-center", isCollapsed ? "gap-0" : "gap-3")}>
          <img
            src="/logoimagetwo.png"
            alt="Margin"
            className={cn(isCollapsed ? "h-5" : "h-5", "w-auto object-contain brightness-200")}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div
          className={cn(
            "h-full flex",
            isCollapsed ? "px-2" : "px-3"
          )}>
          <nav className={cn("w-full flex flex-col items-center pt-6 pb-4 space-y-1", isCollapsed ? "space-y-0.5" : "space-y-3")}>
            <div className={cn("w-full flex flex-col", isCollapsed ? "items-center space-y-1" : "items-start space-y-1")}>
              {primaryItems.map((item) => (
                <NavItemComponent key={item.title} item={item} />
              ))}
            </div>
            {!isCollapsed && <div className="h-px bg-white/5 w-full mx-4 my-2" />}
            <div className={cn("w-full flex flex-col", isCollapsed ? "items-center space-y-0.5" : "items-start space-y-0.5")}>
              {secondaryItems.map((item) => (
                <NavItemComponent key={item.title} item={item} />
              ))}
            </div>
          </nav>
        </div>
      </ScrollArea>

      {/* Version Badge */}
      <div className={cn(
        "border-t border-white/5 py-3",
        isCollapsed ? "px-2 text-center" : "px-6"
      )}>
        <span className={cn(
          "text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]",
          isCollapsed ? "block" : ""
        )}>
          {isCollapsed ? "v1" : "v1.0.0-GOLD // PROD"}
        </span>
      </div>

      {/* More Menu / Logout */}
      <div className={cn(
        "mt-auto border-t border-white/5 py-3",
        isCollapsed ? "px-2 flex justify-center" : ""
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center transition-all group outline-none",
                isCollapsed
                  ? "justify-center p-3 rounded-xl hover:bg-white/5"
                  : "gap-3 px-6 py-3 text-left hover:bg-white/[0.02] text-white/50 hover:text-white"
              )}>
              <Menu className={cn("h-4.5 w-4.5 transition-colors", isCollapsed ? "" : "shrink-0")} strokeWidth={1.5} />
              {!isCollapsed && <span className="text-[11px] font-serif uppercase tracking-[0.2em]">More_System</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={isCollapsed ? "right" : "top"} align={isCollapsed ? "start" : "center"} className="w-56 p-1.5 bg-[#0c0c0c] border border-white/10 text-white shadow-2xl backdrop-blur-xl mb-2 ml-2 rounded-xl">
            <DropdownMenuItem
              onClick={() => navigate(`/app/${currentTenantSlug}/help`)}
              className="flex items-center gap-3 px-3 py-2 text-[11px] text-white/50 hover:bg-white/5 hover:text-white cursor-pointer rounded-lg font-serif uppercase tracking-widest">
              <LifeBuoy className="h-4 w-4 text-emerald-500/50" strokeWidth={1.5} />
              <span>Support and Requests</span>
            </DropdownMenuItem>
            {/* <DropdownMenuItem
              onClick={() => navigate(`/app/${currentTenantSlug}/whats-new`)}
              className="flex items-center gap-3 px-3 py-2 text-[11px] text-white/50 hover:bg-white/5 hover:text-white cursor-pointer rounded-lg font-serif uppercase tracking-widest">
              <Sparkles className="h-4 w-4 text-orange-400/50" strokeWidth={1.5} />
              <span>Patch_Notes</span>
            </DropdownMenuItem> */}

            {/* Limited Offer / Referral */}
            {/* <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                setShowReferralPopup(true);
              }}
              className="p-0">
              <HoverCard openDelay={100} closeDelay={200}>
                <HoverCardTrigger asChild>
                  <div className="flex items-center justify-between w-full px-3 py-2 text-[11px] text-emerald-500 hover:bg-emerald-500/10 cursor-pointer rounded-lg transition-all font-serif uppercase tracking-widest">
                    <div className="flex items-center gap-3">
                      <Gift className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
                      <span className="font-medium">Alpha_Provision</span>
                    </div>
                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent
                  side="right"
                  align="start"
                  className="w-72 p-0 bg-[#0c0c0c] border border-white/10 shadow-[20px_0_40px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden z-[100] backdrop-blur-xl">
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Gift className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Limited_Alpha_Provision</span>
                    </div>
                    <h4 className="text-sm font-serif text-white mb-2">Network Expansion</h4>
                    <p className="text-[11px] text-white/40 leading-relaxed font-serif italic">
                      "Sellers that invite other institutional heads secure 100% of their recovered artifacts without commission deductions."
                    </p>
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">System Instruction: Click to Invoke</span>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </DropdownMenuItem> */}
            <DropdownMenuItem
              onClick={() => navigate(`/app/${currentTenantSlug}/settings`)}
              className="flex items-center gap-3 px-3 py-2 text-[11px] text-white/50 hover:bg-white/5 hover:text-white cursor-pointer rounded-lg font-serif uppercase tracking-widest">
              <Settings2 className="h-4 w-4 text-white/20" strokeWidth={1.5} />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5 my-1" />
            <DropdownMenuItem
              onClick={() => setSignOutOpen(true)}
              className="flex items-center gap-3 px-3 py-2 text-[11px] text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer rounded-lg font-serif uppercase tracking-widest">
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              <span className="font-medium">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <DialogContent className="sm:max-w-[420px] bg-[#0c0c0c] border border-white/10 p-0 gap-0 overflow-hidden shadow-2xl rounded-2xl">
          <DialogHeader className="px-8 pt-8 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-serif text-white tracking-tight">
                  Sign Out?
                </DialogTitle>
                <DialogDescription className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mt-1">
                  SIGN OUT SESSION // READY
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-8 py-6">
            <p className="text-[13px] text-white/40 leading-relaxed font-serif italic">
              "Opside continues to monitor your store and recover funds for you automatically. You don't need to be logged in for the system to work."
            </p>
          </div>
          <DialogFooter className="px-8 py-6 bg-white/[0.02] flex gap-3 sm:justify-end border-t border-white/5">
            <Button
              variant="outline"
              onClick={() => setSignOutOpen(false)}
              className="bg-transparent border-white/10 text-white hover:bg-white/5 rounded-xl font-serif uppercase tracking-widest text-[10px] h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSignOut}
              className="bg-white text-black hover:bg-white/90 rounded-xl font-serif font-bold uppercase tracking-widest text-[10px] h-10 px-6"
            >
              Confirm Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Referral Popup - Institutional Style */}
      <Dialog open={showReferralPopup} onOpenChange={setShowReferralPopup}>
        <DialogContent className="max-w-md bg-[#0c0c0c] border border-white/10 shadow-3xl rounded-2xl p-0 overflow-hidden backdrop-blur-3xl">
          {/* Header - Institutional Dark */}
          <div className="px-8 py-7 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-3 mb-1">
              <Gift className="h-5 w-5 text-emerald-500" />
              <h3 className="text-xl font-serif text-white tracking-tight">
                Alpha_Provision
              </h3>
            </div>
            <p className="text-[10px] text-emerald-500/50 font-mono uppercase tracking-[0.3em]">
              COMMISSION-FREE_NETWORK_EXPANSION
            </p>
          </div>

          <div className="p-8">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-[13px] text-white/50 leading-relaxed font-serif italic">
                  "PROVISION: Integrate strategic allies into the Margin matrix to secure 100% of recovered artifacts without commission deductions."
                </p>

                {/* Value Proposition */}
                <div className="p-5 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl relative group overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-500" />
                  <p className="text-[9px] text-emerald-500/40 font-mono mb-2 uppercase tracking-widest">NETWORK_BENEFIT_PROTOCOL</p>
                  <p className="text-base font-serif font-bold text-white tracking-tight uppercase">100%_RECOVERY_YIELD</p>
                </div>
              </div>

              {/* Action */}
              <Button
                onClick={() => {
                  setShowReferralPopup(false);
                  setShowInviteForm(true);
                }}
                className="w-full bg-white text-black hover:bg-white/90 text-[10px] h-12 font-bold font-serif uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Invoke_Invitation_Sequence
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Form Popup - Institutional style */}
      <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
        <DialogContent className="max-w-lg bg-[#0c0c0c] border border-white/10 shadow-3xl rounded-2xl p-0 overflow-hidden backdrop-blur-3xl">
          <div className="px-8 py-7 border-b border-white/5 bg-white/[0.01]">
            <h3 className="text-xl font-serif text-white tracking-tight">Transmit_Invitation</h3>
            <p className="text-[10px] text-emerald-500/50 font-mono mt-1 uppercase tracking-[0.3em]">TARGET: EXTERNAL_SELLER_ALLIANCE</p>
          </div>

          <div className="p-8 space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest block">Recipient_Coordinate (Email)</label>
              <Input
                type="email"
                placeholder="SELLER@ENTITY.INTEL"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full border-white/10 h-12 text-sm font-mono rounded-xl bg-white/[0.02] text-white focus:bg-white/[0.05] focus:border-emerald-500/50 transition-all placeholder:text-white/10"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest block">Authentication_Protocol_Link</label>
              <div className="flex items-center gap-0 p-4 bg-white/[0.02] border border-white/5 rounded-xl group hover:border-white/10 transition-all">
                <span className="flex-1 text-[11px] text-emerald-500/70 font-mono break-all truncate overflow-hidden">{shortLink}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralLink);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-mono font-bold text-white/30 hover:text-white transition-colors shrink-0 uppercase tracking-widest">
                  {linkCopied ? (
                    <div className="flex items-center gap-2 text-emerald-500">
                      <Check className="h-3 w-3" />
                      <span>COPIED</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Copy className="h-3 w-3" />
                      <span>CLONE</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <Button
              onClick={async () => {
                if (!inviteEmail || !inviteEmail.includes('@')) {
                  alert('PROTOCOL_ERROR: INVALID_COORDINATES');
                  return;
                }

                try {
                  const response = await fetch(`${window.location.origin.includes('localhost') ? 'http://localhost:3001' : 'https://opside-node-api-woco.onrender.com'}/api/invites/send`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-user-id': 'demo-user'
                    },
                    body: JSON.stringify({
                      email: inviteEmail,
                      message: `Protocol: Invitation for institutional access generated. Link: ${referralLink}`
                    })
                  });

                  const result = await response.json();

                  if (result.success) {
                    alert(`TRANSMISSION_COMPLETE: NODE_ALERT_SENT to ${inviteEmail}`);
                    setShowInviteForm(false);
                    setInviteEmail('');
                  } else {
                    alert(`TRANSMISSION_FAILED: ${result.error || 'UNSTABLE_STATE'}`);
                  }
                } catch (error: any) {
                  console.error('Transmission processing error:', error);
                  alert('INTERNAL_MATRIX_ERROR');
                }
              }}
              className="w-full bg-white text-black hover:bg-white/90 text-[10px] h-12 font-bold font-serif uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Execute_Transmission
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Edge toggle handle */}
      <button
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={onToggle}
        className={cn(
          'absolute top-14 -right-3 z-50 h-6 w-6 rounded-full border border-white/10 bg-[#0c0c0c]/80 backdrop-blur-md flex items-center justify-center text-white/40 hover:text-white hover:border-emerald-500/50 shadow-2xl transition-all duration-300',
        )}>
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}

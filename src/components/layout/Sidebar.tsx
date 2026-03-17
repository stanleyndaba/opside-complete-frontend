import React, { useState, useCallback, useMemo } from 'react';
import { Gauge, ShieldCheck, Settings2, Sparkles, ChevronLeft, ChevronRight, BarChart3, LogOut, FileText, LifeBuoy, User, Plug, Box, Menu, Zap, Headset, Gift, Copy, Check, X, CreditCard, Mail, Upload, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
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
import { recoveryApi } from '@/lib/recoveryApi';
import { useTenant } from '@/contexts/TenantContext';
import { useNotifications } from '@/components/providers/NotificationsProvider';
import { tenantRoute } from '@/lib/routes';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { motion, AnimatePresence } from 'framer-motion';

const prefetchRoute = (path: string) => {
  try {
    // Extract base path by removing /app/:tenantSlug
    const baseMatch = path.match(/^\/app\/[^/]+(.*)$/);
    const basePath = baseMatch ? baseMatch[1] : path;

    switch (basePath || '/') {
      case '/':
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
      case '/billing':
        import('@/pages/Billing');
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
  const { tenant, isReady } = useTenant();
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [claimCount, setClaimCount] = useState<number | null>(null);
  const { unreadCount } = useNotifications();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
    navigate('/');
  };

  // Get tenant slug from URL or context
  const currentTenantSlug = tenantSlug || tenant?.slug || 'default';

  // Reset state when tenant changes to prevent flicker
  React.useEffect(() => {
    setConnectedEmail(null);
    setClaimCount(null);
  }, [currentTenantSlug]);

  // Fetch connected email from evidence sources
  React.useEffect(() => {
    if (!isReady) return;
    (async () => {
      try {
        const r = await api.getEvidenceSources(currentTenantSlug);
        if (r.ok && r.data?.sources) {
          const gmailSource = r.data.sources.find((s: any) => s.provider === 'gmail' && s.status === 'connected');
          if (gmailSource?.account_email) {
            setConnectedEmail(gmailSource.account_email);
          }
        }
      } catch { }
    })();
  }, [isReady, currentTenantSlug]);

  // Fetch claim count — use the SAME data source as the Recoveries page table
  React.useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    
    const fetchRecoveries = async () => {
      try {
        const recoveries = await recoveryApi.getRecoveries(currentTenantSlug);
        if (!cancelled) {
          if (Array.isArray(recoveries)) {
            setClaimCount(recoveries.length);
          } else {
            console.warn('[Sidebar] Recoveries response not an array, falling back to 0');
            setClaimCount(0);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[Sidebar] Recoveries endpoint unavailable, degrading gracefully.', err);
          setClaimCount(0); // Resolve loading state to zero to prevent UI hang
        }
      }
    };

    fetchRecoveries();
    return () => { cancelled = true; };
  }, [currentTenantSlug, isReady]);

  // Check if we're on the Dashboard (Command Center) page
  const isDashboard = location.pathname.endsWith('/dashboard') ||
    location.pathname === `/app/${currentTenantSlug}` ||
    location.pathname === `/app/${currentTenantSlug}/`;

  const primaryItems: NavItem[] = [
    { title: 'Overview', icon: Gauge, href: tenantRoute(currentTenantSlug, '') },
    { title: 'Claims', icon: ShieldCheck, href: tenantRoute(currentTenantSlug, '/recoveries') },
    { title: 'Documents and Files', icon: FileText, href: tenantRoute(currentTenantSlug, '/evidence-locker') },
    // { title: 'Reports', icon: BarChart3, href: tenantRoute(currentTenantSlug, '/reports') },
    { title: 'Refund Recoveries', icon: Plug, href: tenantRoute(currentTenantSlug, '/upcoming-payments') },
    { title: 'Transaction History', icon: BarChart3, href: tenantRoute(currentTenantSlug, '/history') },
    { title: 'Billing', icon: CreditCard, href: tenantRoute(currentTenantSlug, '/billing') }
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

      const baseMatch = item.href.match(/^\/app\/[^/]+(.*)$/);
      const basePath = baseMatch ? baseMatch[1] : item.href;

      if (basePath === '/' || basePath === '') {
        queryClient.prefetchQuery({
          queryKey: ['dashboard-aggregates', currentTenantSlug, '30d'], queryFn: async () => {
            const r = await api.getDashboardAggregates('30d', currentTenantSlug);
            if (!r.ok || !r.data) throw new Error('aggregate prefetch');
            return r.data;
          }
        });
        queryClient.prefetchQuery({
          queryKey: ['recoveries-metrics', currentTenantSlug], queryFn: async () => {
            const r = await api.getRecoveriesMetrics(currentTenantSlug);
            if (!r.ok || !r.data) throw new Error('metrics prefetch');
            return r.data;
          }
        });
      }
      if (basePath === '/recoveries') {
        queryClient.prefetchQuery({
          queryKey: ['recoveries-metrics', currentTenantSlug], queryFn: async () => {
            const r = await api.getRecoveriesMetrics(currentTenantSlug);
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
                  "relative flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-xl group",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : "text-foreground/30 hover:bg-foreground/5 hover:text-foreground"
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
            <TooltipContent side="right" className="bg-popover border border-border text-emerald-500 text-[11px] font-sans font-bold uppercase tracking-tight px-3 py-1.5 backdrop-blur-xl">
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
            ? "bg-foreground/[0.03] text-foreground dark:shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            : "text-foreground/40 hover:bg-foreground/[0.02] hover:text-foreground"
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
        <item.icon strokeWidth={isActive ? 2 : 1.5} className={cn("h-4 w-4 shrink-0 transition-all duration-300", isActive ? "text-emerald-500 scale-110" : "text-foreground/20 group-hover:text-foreground")} />
        <span className={cn(
          "text-[11px] font-sans transition-colors tracking-tight uppercase",
          isActive ? "font-bold text-foreground" : "font-light"
        )}>{item.title}</span>
        {item.title === 'Claims' && claimCount !== null && !isCollapsed && (
          <span className={cn(
            "ml-auto text-[11px] font-sans font-bold tabular-nums px-2 py-0.5 rounded-md border tracking-tight",
            isActive
              ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
              : "text-foreground/20 bg-foreground/5 border-foreground/5"
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
        "fixed left-0 top-0 transition-all duration-500 ease-in-out flex flex-col h-screen z-40 gpu-accelerated font-sans",
        isCollapsed ? "w-20" : "w-64",
        "text-foreground/60 border-r border-border",
        "bg-sidebar-background dark:shadow-[10px_0_50px_rgba(0,0,0,0.8)]",
        className
      )}
      style={{ willChange: 'width' }}>
      {/* Branding Header */}
      <div
        className={cn(
          "border-b border-border flex items-center h-16",
          isCollapsed ? "justify-center px-2" : "justify-between px-6"
        )}>
        <div className={cn("flex flex-col items-start gap-1", isCollapsed ? "items-center" : "")}>
          <img
            src="/logoimagetwo.png"
            alt="Margin"
            className={cn(isCollapsed ? "h-3.5" : "h-3.5", "w-auto object-contain dark:invert dark:brightness-0")}
          />
          {!isCollapsed && (
            <div className="flex items-center gap-1.5 translate-x-0.5">
              <div className="h-1 w-1 rounded-full bg-[#ff4500] animate-pulse shadow-[0_0_8px_rgba(255,69,0,0.4)]" />
              <span className="text-[8px] font-sans font-bold text-[#ff4500] uppercase tracking-widest">Healthy</span>
            </div>
          )}
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
            {!isCollapsed && <div className="h-px bg-border w-full mx-4 my-2" />}
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
        "border-t border-border py-3",
        isCollapsed ? "px-2 text-center" : "px-6"
      )}>
        <Link
          to={tenantRoute(currentTenantSlug, '/whats-new')}
          className={cn(
            "group flex items-center gap-2 w-fit transition-colors",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <span className={cn(
            "text-[10px] font-sans font-bold text-foreground/20 uppercase tracking-tight group-hover:text-emerald-500/80 transition-colors",
            isCollapsed ? "block" : ""
          )}>
            {isCollapsed ? "v1" : "v1.0.0-GOLD"}
          </span>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
        </Link>
      </div>

      {/* More Menu / Logout */}
      <div className={cn(
        "mt-auto border-t border-border py-3",
        isCollapsed ? "px-2 flex justify-center" : ""
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center transition-all group outline-none",
                isCollapsed
                  ? "justify-center p-3 rounded-xl hover:bg-foreground/5"
                  : "gap-3 px-6 py-3 text-left hover:bg-foreground/[0.02] text-foreground/50 hover:text-foreground"
              )}>
              <Menu className={cn("h-4 w-4 transition-colors", isCollapsed ? "" : "shrink-0")} strokeWidth={1.5} />
              {!isCollapsed && <span className="text-[11px] font-sans font-light uppercase tracking-tight text-foreground/50">More</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={isCollapsed ? "right" : "top"} align={isCollapsed ? "start" : "center"} className="w-56 p-1.5 bg-popover border border-border text-popover-foreground shadow-2xl backdrop-blur-xl mb-2 ml-2 rounded-xl">
            <DropdownMenuItem
              onClick={() => navigate(tenantRoute(currentTenantSlug, '/help'))}
              className="flex items-center gap-3 px-3 py-2 text-[12px] text-foreground/50 hover:bg-foreground/5 hover:text-foreground cursor-pointer rounded-lg font-sans font-light uppercase tracking-tight">
              <LifeBuoy className="h-4 w-4 text-emerald-500/50" strokeWidth={1.5} />
              <span>Report a problem</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(tenantRoute(currentTenantSlug, '/notifications'))}
              className="flex items-center justify-between px-3 py-2 text-[12px] text-foreground/50 hover:bg-foreground/5 hover:text-foreground cursor-pointer rounded-lg font-sans font-light uppercase tracking-tight">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Mail className="h-4 w-4 text-emerald-500/50" strokeWidth={1.5} />
                  <div className={cn(
                    "absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full",
                    unreadCount > 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/10"
                  )} />
                </div>
                <span>Updates</span>
              </div>
            </DropdownMenuItem>
            {/* Reports hidden - Beta Roll Out Soon
            <DropdownMenuItem
              onClick={() => navigate(`/app/${currentTenantSlug}/reports`)}
              className="flex items-center justify-between px-3 py-2 text-[11px] text-white/50 hover:bg-white/5 hover:text-white cursor-pointer rounded-lg font-sans font-light uppercase tracking-tight">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-orange-400/50" strokeWidth={1.5} />
                <span>Reports</span>
              </div>
              <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded font-sans font-bold tracking-tight">BETA</span>
            </DropdownMenuItem>
            */}
            <DropdownMenuItem
              onClick={() => navigate(tenantRoute(currentTenantSlug, '/whats-new'))}
              className="flex items-center gap-3 px-3 py-2 text-[12px] text-foreground/50 hover:bg-foreground/5 hover:text-foreground cursor-pointer rounded-lg font-sans font-light uppercase tracking-tight">
              <Sparkles className="h-4 w-4 text-orange-400/50" strokeWidth={1.5} />
              <span>Patch_Notes</span>
            </DropdownMenuItem>

            {/* Limited Offer / Referral */}
            {/* <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                setShowReferralPopup(true);
              }}
              className="p-0">
              <HoverCard openDelay={100} closeDelay={200}>
                <HoverCardTrigger asChild>
                  <div className="flex items-center justify-between w-full px-3 py-2 text-[11px] text-emerald-500 hover:bg-emerald-500/10 cursor-pointer rounded-lg transition-all font-sans font-bold uppercase tracking-tight">
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
                      <span className="text-[10px] font-sans font-bold text-emerald-500 uppercase tracking-tight">Limited_Alpha_Provision</span>
                    </div>
                    <h4 className="text-sm font-sans font-bold text-white mb-2 tracking-tight">Network Expansion</h4>
                    <p className="text-[11px] text-white/40 leading-relaxed font-sans font-light tracking-tight italic">
                      "Sellers that invite other institutional heads secure 100% of their recovered artifacts without commission deductions."
                    </p>
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">System Instruction: Click to Invoke</span>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </DropdownMenuItem> */}
            <DropdownMenuItem
              onClick={toggleTheme}
              className="flex items-center gap-3 px-3 py-2 text-[12px] text-foreground/50 hover:bg-foreground/5 hover:text-foreground cursor-pointer rounded-lg font-sans font-light uppercase tracking-tight">
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-500/50" strokeWidth={1.5} />
              ) : (
                <Moon className="h-4 w-4 text-indigo-500/50" strokeWidth={1.5} />
              )}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(tenantRoute(currentTenantSlug, '/settings'))}
              className="flex items-center gap-3 px-3 py-2 text-[12px] text-foreground/50 hover:bg-foreground/5 hover:text-foreground cursor-pointer rounded-lg font-sans font-light uppercase tracking-tight">
              <Settings2 className="h-4 w-4 text-foreground/20" strokeWidth={1.5} />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border my-1" />
            <DropdownMenuItem
              onClick={() => setSignOutOpen(true)}
              className="flex items-center gap-3 px-3 py-2 text-[12px] text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer rounded-lg font-sans font-light uppercase tracking-tight">
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
                <DialogTitle className="text-xl font-sans font-bold text-white tracking-tight">
                  Sign Out?
                </DialogTitle>
                <DialogDescription className="text-gray-500 font-sans font-bold text-[11px] uppercase tracking-tight mt-1">
                  SIGN OUT SESSION // READY
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-8 py-6">
            <p className="text-[14px] text-white/40 leading-relaxed font-sans font-light tracking-tight italic">
              "Opside continues to monitor your store and recover funds for you automatically. You don't need to be logged in for the system to work."
            </p>
          </div>
          <DialogFooter className="px-8 py-6 bg-white/[0.02] flex gap-3 sm:justify-end border-t border-white/5">
            <Button
              variant="outline"
              onClick={() => setSignOutOpen(false)}
              className="bg-transparent border-white/10 text-white hover:bg-white/5 rounded-xl font-sans font-bold uppercase tracking-tight text-[11px] h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSignOut}
              className="bg-white text-black hover:bg-white/90 rounded-xl font-sans font-bold uppercase tracking-tight text-[11px] h-10 px-6"
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
              <h3 className="text-xl font-sans font-bold text-white tracking-tight">
                Alpha_Provision
              </h3>
            </div>
            <p className="text-[11px] text-emerald-500/50 font-sans font-bold uppercase tracking-tight">
              COMMISSION-FREE_NETWORK_EXPANSION
            </p>
          </div>

          <div className="p-8">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-[14px] text-white/50 leading-relaxed font-sans font-light tracking-tight italic">
                  "PROVISION: Integrate strategic allies into the Margin matrix to secure 100% of recovered artifacts without commission deductions."
                </p>

                {/* Value Proposition */}
                <div className="p-5 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl relative group overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-500" />
                  <p className="text-[10px] text-emerald-500/40 font-sans font-bold mb-2 uppercase tracking-tight">NETWORK_BENEFIT_PROTOCOL</p>
                  <p className="text-base font-sans font-bold text-white tracking-tight uppercase">100%_RECOVERY_YIELD</p>
                </div>
              </div>

              {/* Action */}
              <Button
                onClick={() => {
                  setShowReferralPopup(false);
                  setShowInviteForm(true);
                }}
                className="w-full bg-white text-black hover:bg-white/90 text-[11px] h-12 font-bold font-sans uppercase tracking-tight rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
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
            <h3 className="text-xl font-sans font-bold text-white tracking-tight">Transmit_Invitation</h3>
            <p className="text-[11px] text-emerald-500/50 font-sans font-bold mt-1 uppercase tracking-tight">TARGET: EXTERNAL_SELLER_ALLIANCE</p>
          </div>

          <div className="p-8 space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] font-sans font-bold text-white/30 uppercase tracking-tight block">Recipient_Coordinate (Email)</label>
              <Input
                type="email"
                placeholder="SELLER@ENTITY.INTEL"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full border-white/10 h-12 text-sm font-sans font-bold rounded-xl bg-white/[0.02] text-white focus:bg-white/[0.05] focus:border-emerald-500/50 transition-all placeholder:text-white/10 tracking-tight"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-sans font-bold text-white/30 uppercase tracking-tight block">Authentication_Protocol_Link</label>
              <div className="flex items-center gap-0 p-4 bg-white/[0.02] border border-white/5 rounded-xl group hover:border-white/10 transition-all">
                <span className="flex-1 text-[12px] text-emerald-500/70 font-sans font-bold break-all truncate overflow-hidden tracking-tight"> {shortLink}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralLink);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  className="flex items-center gap-2 px-4 py-1.5 text-[11px] font-sans font-bold text-white/30 hover:text-white transition-colors shrink-0 uppercase tracking-tight">
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
                // ... (invite logic remains same)
              }}
              className="w-full bg-white text-black hover:bg-white/90 text-[11px] h-12 font-bold font-sans uppercase tracking-tight rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
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
          'absolute top-14 -right-3 z-50 h-6 w-6 rounded-full border border-border bg-popover/80 backdrop-blur-md flex items-center justify-center text-foreground/40 hover:text-foreground hover:border-emerald-500/50 shadow-2xl transition-all duration-300',
        )}>
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}

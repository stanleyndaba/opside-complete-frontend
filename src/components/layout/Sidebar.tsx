import React, { useState, useCallback } from 'react';
import { Gauge, Workflow, Settings2, NotebookPen, ChevronLeft, ChevronRight, LogOut, FileText, LifeBuoy, User, Plug, Box, Menu, Zap, Headset, Gift, Copy, Check, X, CreditCard, Mail, Upload, Inbox, RefreshCcw } from 'lucide-react';
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
import { useNotifications } from '@/components/providers/NotificationsProvider';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';
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
      case '/recoveries':
        import('@/pages/RecoveryPipelineAgent8');
        break;
      case '/appeals':
        import('@/pages/Appeals');
        break;
      case '/dispute-cases':
        import('@/pages/DisputeCases');
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
  const [claimCount, setClaimCount] = useState<number | null>(null);
  const { unreadCount } = useNotifications();
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
    navigate('/');
  };

  // Get tenant slug from URL or context
  const currentTenantSlug =
    normalizeTenantSlug(tenantSlug) ||
    normalizeTenantSlug(tenant?.slug) ||
    normalizeTenantSlug(localStorage.getItem('active_tenant_slug')) ||
    '';

  // Reset state when tenant changes to prevent flicker
  React.useEffect(() => {
    setClaimCount(null);
  }, [currentTenantSlug]);

  // Fetch claim count from Agent 8 so the sidebar reflects the same source as the Recovery Pipeline page
  React.useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    
    const fetchRecoveries = async () => {
      try {
        const response = await api.getAmazonRecoveries(currentTenantSlug);
        if (!cancelled) {
          const claimCount = response.ok && typeof response.data?.claimCount === 'number'
            ? response.data.claimCount
            : 0;
          setClaimCount(claimCount);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[Sidebar] Agent 8 recoveries endpoint unavailable, degrading gracefully.', err);
          setClaimCount(0); // Resolve loading state to zero to prevent UI hang
        }
      }
    };

    fetchRecoveries();
    return () => { cancelled = true; };
  }, [currentTenantSlug, isReady]);

  const overviewHref = tenantRoute(currentTenantSlug, '');
  const coreItem: NavItem = { title: 'Recovery Pipeline', icon: Workflow, href: tenantRoute(currentTenantSlug, '/recoveries') };
  const operationItems: NavItem[] = [
    { title: 'Dispute Cases', icon: Inbox, href: tenantRoute(currentTenantSlug, '/dispute-cases') },
    { title: 'Documents and Files', icon: FileText, href: tenantRoute(currentTenantSlug, '/evidence-locker') },
    { title: 'Billing', icon: CreditCard, href: tenantRoute(currentTenantSlug, '/billing') }
  ];
  const actionItems: NavItem[] = [
    { title: 'Reopen Claims', icon: RefreshCcw, href: tenantRoute(currentTenantSlug, '/appeals') }
  ];
  const NavItemComponent = React.memo(({
    item,
    variant = 'default'
  }: {
    item: NavItem;
    variant?: 'core' | 'default' | 'utility';
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
      const collapsedBaseClasses = variant === 'core'
        ? "w-10.5 h-10.5 rounded-lg"
        : variant === 'utility'
          ? "w-8.5 h-8.5 rounded-lg"
          : "w-9 h-9 rounded-lg";

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={item.href}
                onMouseEnter={handlePrefetch}
                className={cn(
                  "relative flex items-center justify-center transition-all duration-300 group",
                  collapsedBaseClasses,
                  isActive
                    ? "bg-white/[0.065] text-white"
                    : variant === 'core'
                      ? "bg-white/[0.03] text-white/78 hover:bg-white/[0.05] hover:text-white"
                      : "text-foreground/30 hover:bg-foreground/5 hover:text-foreground"
                )}
                style={{ willChange: 'background-color' }}>
                {isActive && (
                  <motion.span
                    layoutId="active-indicator-collapsed"
                    className="absolute left-0 top-2.5 bottom-2.5 w-[3px] bg-sky-300 rounded-r-full shadow-[0_0_12px_rgba(125,211,252,0.45)]"
                  />
                )}
                <item.icon
                  className={cn(
                    "transition-colors duration-300",
                    variant === 'core' ? "h-[18px] w-[18px]" : "h-4 w-4",
                    isActive
                      ? "text-white/88"
                      : variant === 'core'
                        ? "text-white/68 group-hover:text-white/88"
                        : "text-foreground/20 group-hover:text-foreground/45"
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover border border-border px-3 py-2 backdrop-blur-xl">
              <div className="text-[10px] font-sans font-medium tracking-tight text-white/88">
                {item.title}
              </div>
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
          "relative flex items-start w-full transition-all duration-300 group",
          variant === 'core'
            ? "gap-2.5 rounded-lg px-2.5 py-2.25"
            : variant === 'utility'
              ? "gap-1.75 rounded-md px-2 py-1.5"
              : "gap-2 rounded-lg px-2.25 py-1.5",
          isActive
            ? variant === 'core'
              ? "bg-white/[0.07] text-white"
              : "bg-white/[0.04] text-white"
            : variant === 'core'
              ? "bg-white/[0.028] text-white/88 hover:bg-white/[0.045] hover:text-white"
              : variant === 'utility'
                ? "text-white/50 hover:bg-white/[0.02] hover:text-white/78"
                : "text-foreground/42 hover:bg-white/[0.02] hover:text-white/88"
        )}
        style={{ willChange: 'background-color, transform' }}>
        {isActive && (
          <motion.span
            layoutId="active-indicator"
            className="absolute left-0 top-2.5 bottom-2.5 w-[3px] bg-sky-300 rounded-r-full shadow-[0_0_12px_rgba(125,211,252,0.45)]"
          />
        )}
        {!isActive && (
          <span
            className={cn(
              "absolute left-0 top-2 bottom-2 w-[2px] rounded-r-full transition-opacity",
              variant === 'core'
                ? "bg-sky-300/30 opacity-100"
                : "bg-sky-300/20 opacity-0 group-hover:opacity-100"
            )}
          />
        )}
        <item.icon
          strokeWidth={isActive ? 2 : 1.5}
          className={cn(
            "shrink-0 transition-all duration-300",
            variant === 'core' ? "mt-0.5 h-[18px] w-[18px]" : "mt-0.5 h-3.5 w-3.5",
            isActive
              ? "text-white/84 scale-105"
              : variant === 'core'
                ? "text-white/64 group-hover:text-white/86"
                : "text-foreground/24 group-hover:text-white/55"
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "font-sans transition-colors tracking-tight",
              variant === 'core'
                ? "text-[16px] font-semibold leading-[1.15]"
                : variant === 'utility'
                  ? "text-[16px] font-medium leading-[1.15] text-white/58"
                  : "text-[16px] font-medium leading-[1.15]",
              isActive ? "text-white" : ""
            )}>
              {item.title}
            </span>
          </div>
        </div>
        <ChevronRight
          className={cn(
            "mt-0.5 h-3 w-3 shrink-0 transition-all duration-300",
            isActive
              ? "translate-x-0 text-sky-200/72"
              : "translate-x-[-2px] text-white/10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-white/35"
          )}
          strokeWidth={1.6}
        />
        {item.title === 'Claims' && claimCount !== null && !isCollapsed && (
          <span className={cn(
            "ml-auto text-[10px] font-sans font-bold tabular-nums px-1.5 py-0.5 rounded-md border tracking-tight",
            isActive
              ? "text-sky-100 bg-sky-400/10 border-sky-300/20 shadow-[0_0_10px_rgba(125,211,252,0.1)]"
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
        isCollapsed ? "w-[74px]" : "w-[240px]",
        "text-foreground/60 border-r border-border",
        "bg-sidebar-background dark:shadow-[10px_0_50px_rgba(0,0,0,0.8)]",
        className
      )}
      style={{ willChange: 'width' }}>
      {/* Branding Header */}
      <div
        className={cn(
          "",
          isCollapsed ? "px-2 py-3.5" : "px-3.5 py-4"
        )}>
        <Link
          to={overviewHref}
          className={cn(
            "w-full transition-colors",
            isCollapsed ? "flex items-center justify-center px-1 py-1" : "block px-0.5 py-0.5"
          )}
        >
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "")}>
            <img
              src="/logoimagetwo.png"
              alt="Margin"
              className="h-3.5 w-auto object-contain dark:invert dark:brightness-0"
            />
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <div
          className={cn(
            "h-full flex",
            isCollapsed ? "px-2" : "px-2.5"
          )}>
          <nav className={cn("w-full flex flex-col pt-2.5 pb-3.5", isCollapsed ? "items-center gap-3.5" : "gap-5.5")}>
            {!isCollapsed && (
              <div className="w-full">
                <NavItemComponent item={{ title: 'Overview', icon: Gauge, href: overviewHref }} variant="utility" />
              </div>
            )}

            <div className="w-full">
              {!isCollapsed && (
                <div className="mb-1.25 px-1 text-[10px] font-medium tracking-tight text-white/28">
                  Engine
                </div>
              )}
              <div className={cn("w-full", isCollapsed ? "flex justify-center" : "")}>
                <NavItemComponent item={coreItem} variant="core" />
              </div>
            </div>

            <div className="w-full">
              {!isCollapsed && (
                <div className="mb-1.25 px-1 text-[10px] font-medium tracking-tight text-white/28">
                  Operations
                </div>
              )}
              <div className={cn("w-full flex flex-col", isCollapsed ? "items-center gap-1.25" : "gap-0.25")}>
                {operationItems.map((item) => (
                  <NavItemComponent key={item.title} item={item} />
                ))}
              </div>
            </div>

            <div className="w-full">
              {!isCollapsed && (
                <div className="mb-1.25 px-1 text-[10px] font-medium tracking-tight text-white/28">
                  Actions
                </div>
              )}
              <div className={cn("w-full flex flex-col", isCollapsed ? "items-center gap-1.25" : "gap-0.25")}>
                {actionItems.map((item) => (
                  <NavItemComponent key={item.title} item={item} />
                ))}
              </div>
            </div>
          </nav>
        </div>
      </ScrollArea>

      {/* Version Badge */}
      <div className={cn(
        "border-t border-border py-2.5",
        isCollapsed ? "px-2 text-center" : "px-5"
      )}>
        <Link
          to={tenantRoute(currentTenantSlug, '/whats-new')}
          className={cn(
            "group flex items-center gap-2 w-fit transition-colors",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <span className={cn(
            "text-[9px] font-sans font-medium text-foreground/24 tracking-tight group-hover:text-white/40 transition-colors",
            isCollapsed ? "block" : ""
          )}>
            {isCollapsed ? "v1" : "v1.0.0 Gold"}
          </span>
          <div className="h-1 w-1 rounded-full bg-white/24 flex-shrink-0" />
        </Link>
      </div>

      {/* More Menu / Logout */}
      <div className={cn(
        "mt-auto border-t border-border py-2.5",
        isCollapsed ? "px-2 flex justify-center" : ""
      )}>
        {(() => {
          const helpActive = location.pathname.startsWith(tenantRoute(currentTenantSlug, '/help'));
          const updatesActive = location.pathname.startsWith(tenantRoute(currentTenantSlug, '/notifications'));
          const notesActive = location.pathname.startsWith(tenantRoute(currentTenantSlug, '/whats-new'));
          const settingsActive = location.pathname.startsWith(tenantRoute(currentTenantSlug, '/settings'));

          return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center transition-all group outline-none",
                isCollapsed
                  ? "justify-center p-2 rounded-lg hover:bg-foreground/5"
                  : "gap-2 px-5 py-2 text-left hover:bg-foreground/[0.02] text-foreground/34 hover:text-foreground/72"
              )}>
              <Menu className={cn("h-4 w-4 transition-colors text-foreground/20", isCollapsed ? "" : "shrink-0")} strokeWidth={1.5} />
              {!isCollapsed && <span className="text-[10px] font-sans font-medium tracking-tight text-foreground/34">More</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={isCollapsed ? "right" : "top"} align={isCollapsed ? "start" : "center"} className="w-64 p-1.5 bg-popover border border-border text-popover-foreground shadow-2xl backdrop-blur-xl mb-2 ml-2 rounded-xl">
            <DropdownMenuItem
              onClick={() => navigate(tenantRoute(currentTenantSlug, '/help'))}
              className={cn(
                "group/more-item flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg font-sans transition-colors",
                "text-[11px] text-foreground/50 hover:bg-foreground/5 hover:text-foreground",
                "data-[highlighted]:bg-white data-[highlighted]:text-black data-[highlighted]:outline-none",
                helpActive && "bg-white text-black"
              )}>
              <LifeBuoy
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  helpActive ? "text-black" : "text-foreground/20 group-data-[highlighted]/more-item:text-black"
                )}
                strokeWidth={1.5}
              />
              <div className="min-w-0">
                <div className="tracking-tight">Report a problem</div>
                <div className={cn(
                  "mt-0.5 text-[10px] font-sans tracking-tight normal-case",
                  helpActive ? "text-black/60" : "text-foreground/30 group-data-[highlighted]/more-item:text-black/60"
                )}>
                  5 minute response
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(tenantRoute(currentTenantSlug, '/notifications'))}
              className={cn(
                "group/more-item flex items-center justify-between px-3 py-2 text-[11px] cursor-pointer rounded-lg font-sans font-light tracking-tight transition-colors",
                "text-foreground/50 hover:bg-foreground/5 hover:text-foreground",
                "data-[highlighted]:bg-white data-[highlighted]:text-black data-[highlighted]:outline-none",
                updatesActive && "bg-white text-black"
              )}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Mail
                    className={cn(
                      "h-4 w-4 transition-colors",
                      updatesActive ? "text-black" : "text-foreground/20 group-data-[highlighted]/more-item:text-black"
                    )}
                    strokeWidth={1.5}
                  />
                  <div className={cn(
                    "absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full",
                    unreadCount > 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/10"
                  )} />
                </div>
                <span>Updates</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(tenantRoute(currentTenantSlug, '/whats-new'))}
              className={cn(
                "group/more-item flex items-center gap-3 px-3 py-2 text-[11px] cursor-pointer rounded-lg font-sans font-light tracking-tight transition-colors",
                "text-foreground/50 hover:bg-foreground/5 hover:text-foreground",
                "data-[highlighted]:bg-white data-[highlighted]:text-black data-[highlighted]:outline-none",
                notesActive && "bg-white text-black"
              )}>
              <NotebookPen
                className={cn(
                  "h-4 w-4 transition-colors",
                  notesActive ? "text-black" : "text-foreground/20 group-data-[highlighted]/more-item:text-black"
                )}
                strokeWidth={1.5}
              />
              <span>Latest Changes</span>
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
              onClick={() => navigate(tenantRoute(currentTenantSlug, '/settings'))}
              className={cn(
                "group/more-item flex items-center gap-3 px-3 py-2 text-[11px] cursor-pointer rounded-lg font-sans font-light tracking-tight transition-colors",
                "text-foreground/50 hover:bg-foreground/5 hover:text-foreground",
                "data-[highlighted]:bg-white data-[highlighted]:text-black data-[highlighted]:outline-none",
                settingsActive && "bg-white text-black"
              )}>
              <Settings2
                className={cn(
                  "h-4 w-4 transition-colors",
                  settingsActive ? "text-black" : "text-foreground/20 group-data-[highlighted]/more-item:text-black"
                )}
                strokeWidth={1.5}
              />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border my-1" />
            <DropdownMenuItem
              onClick={() => setSignOutOpen(true)}
              className="flex items-center gap-3 px-3 py-2 text-[11px] text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer rounded-lg font-sans font-light tracking-tight">
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              <span className="font-medium">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
          )})()}
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

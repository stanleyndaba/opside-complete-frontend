import React, { useState, useCallback } from 'react';
import { Gauge, Workflow, Settings2, NotebookPen, ChevronLeft, ChevronRight, LogOut, FileText, LifeBuoy, User, Plug, Box, Menu, Send, Headset, Gift, Copy, Check, X, CreditCard, Mail, Upload, Inbox, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { useSession } from '@/contexts/SessionContext';
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
      case '/pricing-adjust':
        import('@/pages/PricingAdjust');
        break;
      case '/recoveries':
        import('@/pages/RecoveryPipelineAgent8');
        break;
      case '/filing-pipeline':
        import('@/pages/FilingPipeline');
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
  count?: number | null;
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
  const { isAuthReady, authToken, isSessionValid } = useSession();
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

  const subscriptionTierLabel =
    tenant?.plan === 'enterprise'
      ? 'Enterprise'
      : tenant?.plan === 'professional'
        ? 'Pro'
        : tenant?.plan === 'starter' || tenant?.plan === 'free'
          ? 'Basic'
          : null;

  // Reset state when tenant changes to prevent flicker
  React.useEffect(() => {
    setClaimCount(null);
  }, [currentTenantSlug]);

  // Fetch claim count from Agent 8 so the sidebar reflects the same source as the Recovery Pipeline page
  React.useEffect(() => {
    if (!isReady || !isAuthReady || !authToken || !isSessionValid) return;
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
  }, [authToken, currentTenantSlug, isAuthReady, isReady, isSessionValid]);

  const overviewHref = tenantRoute(currentTenantSlug, '');
  const pricingAdjustHref = tenantRoute(currentTenantSlug, '/pricing-adjust');
  const navItems: NavItem[] = [
    { title: 'Overview', icon: Gauge, href: overviewHref },
    { title: 'Recoveries', icon: Workflow, href: tenantRoute(currentTenantSlug, '/recoveries') },
    { title: 'Dispute Claims', icon: Inbox, href: tenantRoute(currentTenantSlug, '/dispute-cases') },
    { title: 'Documentation', icon: FileText, href: tenantRoute(currentTenantSlug, '/evidence-locker') },
    { title: 'Submission Structure', icon: Send, href: tenantRoute(currentTenantSlug, '/filing-pipeline') },
    { title: 'Appeal Claims', icon: RefreshCw, href: tenantRoute(currentTenantSlug, '/appeals') },
    { title: 'Notifications', icon: Mail, href: tenantRoute(currentTenantSlug, '/notifications'), count: unreadCount }
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
        ? "h-10 w-10"
        : variant === 'utility'
          ? "h-9 w-9"
          : "h-10 w-10";

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={item.href}
                onMouseEnter={handlePrefetch}
                className={cn(
                  "group relative flex items-center justify-center border-l transition-all duration-200",
                  collapsedBaseClasses,
                  isActive
                    ? "border-[#0052FF] bg-[#F3F7FF] text-[#0052FF]"
                    : variant === 'core'
                      ? "border-transparent text-[#4B5563] hover:border-[#D8E7FF] hover:bg-[#F3F7FF] hover:text-[#0052FF]"
                      : "border-transparent text-[#6B7280] hover:border-[#D8E7FF] hover:bg-[#F3F7FF] hover:text-[#0052FF]"
                )}
                style={{ willChange: 'background-color' }}>
                {isActive && (
                  <motion.span
                    layoutId="active-indicator-collapsed"
                    className="absolute bottom-2 left-0 top-2 w-[2px] bg-[#0052FF]"
                  />
                )}
                <item.icon
                  className={cn(
                    "transition-colors duration-200",
                    variant === 'core' ? "h-[17px] w-[17px]" : "h-4 w-4",
                    isActive
                      ? "text-[#0052FF]"
                      : variant === 'core'
                        ? "text-[#4B5563] group-hover:text-[#0052FF]"
                        : "text-[#6B7280] group-hover:text-[#0052FF]"
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="border border-[#E5E7EB] bg-white px-3 py-2 text-[#111827] shadow-[0_18px_45px_rgba(17,24,39,0.12)]">
              <div className="text-[10px] font-sans font-medium tracking-tight text-[#111827]">
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
          "group relative flex w-full items-center border-l transition-all duration-200",
          variant === 'core'
            ? "gap-2.5 px-3 py-2.5"
            : variant === 'utility'
              ? "gap-2 px-2.5 py-1.5"
              : "gap-2.5 px-3 py-2",
          isActive
            ? variant === 'core'
              ? "border-[#0052FF] bg-[#F3F7FF] text-[#0052FF]"
              : variant === 'utility'
                ? "border-[#0052FF] bg-transparent text-[#0052FF]"
                : "border-[#0052FF] bg-[#F3F7FF] text-[#0052FF]"
            : variant === 'core'
              ? "border-transparent text-[#4B5563] hover:border-[#D8E7FF] hover:bg-[#F3F7FF] hover:text-[#0052FF]"
              : variant === 'utility'
                ? "border-transparent text-[#6B7280] hover:border-[#D8E7FF] hover:text-[#0052FF]"
                : "border-transparent text-[#4B5563] hover:border-[#D8E7FF] hover:bg-[#F3F7FF] hover:text-[#0052FF]"
        )}
        style={{ willChange: 'background-color, transform' }}>
        {isActive && (
          <motion.span
            layoutId="active-indicator"
            className={cn(
              "absolute left-0 w-[2px] bg-[#0052FF]",
              variant === 'utility' ? "top-1.5 bottom-1.5" : "top-2 bottom-2"
            )}
          />
        )}
        <item.icon
          strokeWidth={isActive ? 2 : 1.5}
          className={cn(
            "h-4 w-4 shrink-0 transition-all duration-200",
            variant === 'core' ? "h-[17px] w-[17px]" : "",
            isActive
              ? "text-[#0052FF]"
              : variant === 'core'
                ? "text-[#4B5563] group-hover:text-[#0052FF]"
                : variant === 'utility'
                  ? "text-[#6B7280] group-hover:text-[#0052FF]"
                : "text-[#6B7280] group-hover:text-[#0052FF]"
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "font-sans tracking-tight transition-colors",
              variant === 'core'
                ? "text-[13.5px] font-[300] leading-5"
                : variant === 'utility'
                  ? "text-[13px] font-medium leading-5"
                  : "text-[13.5px] font-[300] leading-5",
              isActive ? "text-[#0052FF]" : ""
            )}>
              {item.title}
            </span>
          </div>
        </div>
        {variant !== 'utility' ? (
          <ChevronRight
            className={cn(
              "h-3 w-3 shrink-0 transition-all duration-200",
            isActive
                ? "translate-x-0 text-[#0052FF]/60"
                : "translate-x-[-2px] text-[#9CA3AF] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-[#0052FF]/60"
            )}
            strokeWidth={1.6}
          />
        ) : null}
        {item.count != null && !isCollapsed && (
          <span className={cn(
            "ml-auto border-l px-1.5 text-[10px] font-sans font-medium tabular-nums tracking-tight",
            isActive
              ? "border-[#BFD7FF] text-[#0052FF]"
              : "border-[#E5E7EB] text-[#6B7280]"
          )}>
            {item.count}
          </span>
        )}
      </Link>
    );
  });
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col font-sans transition-all duration-500 ease-in-out gpu-accelerated",
        isCollapsed ? "w-16" : "w-60",
        "border-r border-[#E5E7EB] bg-white/92 text-[#4B5563] shadow-[8px_0_28px_rgba(17,24,39,0.04)] backdrop-blur-xl",
        className
      )}
      style={{
        willChange: 'width',
        fontFamily: "Inter, 'SF Pro Text', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}>
      {/* Branding Header */}
      <div
        className={cn(
          "border-b border-[#E5E7EB]",
          isCollapsed ? "px-2 py-3.5" : "px-4 py-4"
        )}>
        <div className={cn("w-full", isCollapsed ? "space-y-0" : "space-y-2")}>
          <Link
            to={overviewHref}
            onMouseEnter={() => prefetchRoute(overviewHref)}
            className={cn(
              "w-full transition-colors",
              isCollapsed ? "flex items-center justify-center px-1 py-1.5" : "block px-1 py-1"
            )}
          >
            <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between gap-3")}>
              <img
                src="/logoimagetwo.png"
                alt="Margin"
                className="h-3.5 w-auto object-contain"
              />
              {!isCollapsed && subscriptionTierLabel ? (
                <span className="border-l border-[#E5E7EB] pl-2 text-[10px] font-medium uppercase tracking-tight text-[#6B7280]">
                  {subscriptionTierLabel}
                </span>
              ) : null}
            </div>
          </Link>
          {!isCollapsed ? (
            <Link
              to={pricingAdjustHref}
              onMouseEnter={() => prefetchRoute(pricingAdjustHref)}
              className="inline-flex items-center border-l border-[#BFD7FF] px-2 py-0.5 text-[12px] font-sans font-medium tracking-tight text-[#0052FF] transition-colors hover:border-[#0052FF] hover:text-[#003DBF]"
            >
              Upgrade Plan
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div
          className={cn(
            "flex min-h-full flex-col justify-center",
            isCollapsed ? "px-2 py-4" : "px-3 py-4"
          )}>
          <nav className={cn("flex w-full flex-col", isCollapsed ? "items-center gap-1" : "gap-1")}>
            {navItems.map((item) => (
              <NavItemComponent key={item.title} item={item} />
            ))}
          </nav>
        </div>
      </div>

      {/* Footer Utilities */}
      <div className={cn(
        "mt-auto border-t border-[#E5E7EB] py-3",
        isCollapsed ? "px-2" : "px-3"
      )}>
        {(() => {
          const settingsActive = location.pathname.startsWith(tenantRoute(currentTenantSlug, '/settings'));
          const billingActive = location.pathname.startsWith(tenantRoute(currentTenantSlug, '/billing'));
          const helpActive = location.pathname.startsWith(tenantRoute(currentTenantSlug, '/help'));
          const notesActive = location.pathname.startsWith(tenantRoute(currentTenantSlug, '/whats-new'));
          return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "group flex w-full items-center border-l border-transparent transition-all outline-none",
                isCollapsed
                  ? "justify-center p-2.5 hover:border-[#D8E7FF] hover:bg-[#F3F7FF]"
                  : "gap-3 px-3 py-2.5 text-left text-[#6B7280] hover:border-[#D8E7FF] hover:bg-[#F3F7FF] hover:text-[#0052FF]"
              )}>
              <Menu className={cn("h-4 w-4 text-[#9CA3AF] transition-colors", isCollapsed ? "" : "shrink-0")} strokeWidth={1.5} />
              {!isCollapsed && <span className="font-sans text-[12px] font-medium tracking-tight text-[#6B7280]">More</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={isCollapsed ? "right" : "top"} align={isCollapsed ? "start" : "center"} className="mb-2 ml-2 w-64 rounded-2xl border border-[#E5E7EB] bg-white p-1.5 text-[#111827] shadow-[0_24px_70px_rgba(17,24,39,0.12)]">
            <DropdownMenuItem
              onClick={() => navigate(tenantRoute(currentTenantSlug, '/settings'))}
              className={cn(
                "group/more-item flex cursor-pointer items-center gap-3 border-l border-transparent px-3 py-2.5 font-sans transition-colors",
                "text-[13px] text-[#4B5563] hover:border-[#D8E7FF] hover:bg-[#F3F7FF] hover:text-[#0052FF]",
                "data-[highlighted]:border-[#D8E7FF] data-[highlighted]:bg-[#F3F7FF] data-[highlighted]:text-[#0052FF] data-[highlighted]:outline-none",
                settingsActive && "border-[#0052FF] bg-[#F3F7FF] text-[#0052FF]"
              )}>
              <Settings2
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  settingsActive ? "text-[#0052FF]" : "text-[#9CA3AF] group-data-[highlighted]/more-item:text-[#0052FF]"
                )}
                strokeWidth={1.5}
              />
              <span className="tracking-tight">Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(tenantRoute(currentTenantSlug, '/billing'))}
              className={cn(
                "group/more-item flex cursor-pointer items-center gap-3 border-l border-transparent px-3 py-2 font-sans transition-colors",
                "text-[13px] text-[#4B5563] hover:border-[#D8E7FF] hover:bg-[#F3F7FF] hover:text-[#0052FF]",
                "data-[highlighted]:border-[#D8E7FF] data-[highlighted]:bg-[#F3F7FF] data-[highlighted]:text-[#0052FF] data-[highlighted]:outline-none",
                billingActive && "border-[#0052FF] bg-[#F3F7FF] text-[#0052FF]"
              )}>
              <CreditCard
                className={cn(
                  "h-4 w-4 transition-colors",
                  billingActive ? "text-[#0052FF]" : "text-[#9CA3AF] group-data-[highlighted]/more-item:text-[#0052FF]"
                )}
                strokeWidth={1.5}
              />
              <span className="tracking-tight">Billing</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(tenantRoute(currentTenantSlug, '/help'))}
              className={cn(
                "group/more-item flex cursor-pointer items-center gap-3 border-l border-transparent px-3 py-2.5 font-sans transition-colors",
                "text-[13px] text-[#4B5563] hover:border-[#D8E7FF] hover:bg-[#F3F7FF] hover:text-[#0052FF]",
                "data-[highlighted]:border-[#D8E7FF] data-[highlighted]:bg-[#F3F7FF] data-[highlighted]:text-[#0052FF] data-[highlighted]:outline-none",
                helpActive && "border-[#0052FF] bg-[#F3F7FF] text-[#0052FF]"
              )}>
              <LifeBuoy
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  helpActive ? "text-[#0052FF]" : "text-[#9CA3AF] group-data-[highlighted]/more-item:text-[#0052FF]"
                )}
                strokeWidth={1.5}
              />
              <span className="tracking-tight">Report a problem</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(tenantRoute(currentTenantSlug, '/whats-new'))}
              className={cn(
                "group/more-item flex cursor-pointer items-center gap-3 border-l border-transparent px-3 py-2 text-[13px] font-sans font-light tracking-tight transition-colors",
                "text-[#4B5563] hover:border-[#D8E7FF] hover:bg-[#F3F7FF] hover:text-[#0052FF]",
                "data-[highlighted]:border-[#D8E7FF] data-[highlighted]:bg-[#F3F7FF] data-[highlighted]:text-[#0052FF] data-[highlighted]:outline-none",
                notesActive && "border-[#0052FF] bg-[#F3F7FF] text-[#0052FF]"
              )}>
              <NotebookPen
                className={cn(
                  "h-4 w-4 transition-colors",
                  notesActive ? "text-[#0052FF]" : "text-[#9CA3AF] group-data-[highlighted]/more-item:text-[#0052FF]"
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
            <DropdownMenuSeparator className="my-1 bg-[#E5E7EB]" />
            <DropdownMenuItem
              onClick={() => setSignOutOpen(true)}
              className="flex cursor-pointer items-center gap-3 border-l border-transparent px-3 py-2 text-[13px] font-sans font-light tracking-tight text-[#4B5563] hover:border-[#D8E7FF] hover:bg-[#F3F7FF] hover:text-[#0052FF] data-[highlighted]:border-[#D8E7FF] data-[highlighted]:bg-[#F3F7FF] data-[highlighted]:text-[#0052FF] data-[highlighted]:outline-none">
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              <span className="font-medium">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
          )})()}
      </div>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <DialogContent className="platform-vitality-page sm:max-w-[420px] border border-[#E5E7EB] bg-white p-0 gap-0 overflow-hidden shadow-[0_18px_45px_rgba(17,24,39,0.10)] rounded-2xl">
          <DialogHeader className="px-8 pt-8 pb-6 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl border border-[#D8E7FF] bg-[#F3F7FF] flex items-center justify-center">
                <LogOut className="h-5 w-5 text-[#0052FF]" />
              </div>
              <div>
                <DialogTitle className="text-xl font-sans font-bold text-[#111827] tracking-tight">
                  Sign out
                </DialogTitle>
                <DialogDescription className="text-[#6B7280] font-sans font-bold text-[11px] uppercase tracking-tight mt-1">
                  Secure session control
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-8 py-6">
            <p className="text-[14px] text-[#4B5563] leading-relaxed font-sans font-normal tracking-tight">
              You can safely sign out. Margin will continue monitoring your store, tracking recoveries, and preserving workflow activity in the background.
            </p>
          </div>
          <DialogFooter className="px-8 py-6 bg-[#F9FAFB] flex gap-3 sm:justify-end border-t border-[#E5E7EB]">
            <Button
              variant="outline"
              onClick={() => setSignOutOpen(false)}
              className="bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827] rounded-xl font-sans font-bold uppercase tracking-tight text-[11px] h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSignOut}
              className="bg-[#0052FF] text-[#FFFFFF] hover:bg-[#0047DD] rounded-xl font-sans font-bold uppercase tracking-tight text-[11px] h-10 px-6 shadow-[0_12px_28px_rgba(0,82,255,0.14)]"
            >
              Sign Out
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
          'absolute top-14 -right-2.5 z-50 flex h-8 w-5 items-center justify-center border border-[#E5E7EB] bg-white text-[#4B5563] shadow-[0_10px_24px_rgba(17,24,39,0.10)] backdrop-blur-md transition-all duration-300 hover:border-[#D8E7FF] hover:bg-[#F3F7FF] hover:text-[#0052FF]',
        )}>
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}

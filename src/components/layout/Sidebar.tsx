import React, { useState, useCallback } from 'react';
import { 
  Gauge, Workflow, Settings2, NotebookPen, ChevronLeft, ChevronRight,
  MoreHorizontal as MoreIcon, LogOut, FileText, LifeBuoy, User, Plug,
  Box, Menu, Search, Bell, Send, Headset, Gift, Copy, Check, X, 
  CreditCard, Mail, Upload, Inbox, RefreshCw 
} from 'lucide-react';
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
import { SignOutDialog } from '@/components/routes/SignOutDialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

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
        import('@/pages/Recoveries');
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
  hoverContent?: React.ReactNode;
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
  const [financialEvidenceConnectionCount, setFinancialEvidenceConnectionCount] = useState<number | null>(null);
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
        : tenant?.plan === 'starter'
          ? 'Core'
          : tenant?.plan === 'free'
            ? 'Audit access'
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

  React.useEffect(() => {
    if (!isReady || !isAuthReady || !authToken || !isSessionValid || !currentTenantSlug) {
      setFinancialEvidenceConnectionCount(null);
      return;
    }

    let cancelled = false;
    const fetchFinancialEvidenceConnectionCount = async () => {
      try {
        const [statusResponse, sourcesResponse] = await Promise.all([
          api.getIntegrationsStatus(currentTenantSlug),
          api.getEvidenceSources(currentTenantSlug)
        ]);

        if (!statusResponse.ok || !sourcesResponse.ok || cancelled) {
          if (!cancelled) setFinancialEvidenceConnectionCount(null);
          return;
        }

        const providerKeys = new Set(
          (sourcesResponse.data?.sources || [])
            .filter((source: any) => source?.status === 'connected' && typeof source?.provider === 'string')
            .map((source: any) => source.provider.toLowerCase())
        );
        if ((statusResponse.data as any)?.amazon_connected) providerKeys.add('amazon');
        setFinancialEvidenceConnectionCount(providerKeys.size);
      } catch {
        if (!cancelled) setFinancialEvidenceConnectionCount(null);
      }
    };

    fetchFinancialEvidenceConnectionCount();
    return () => { cancelled = true; };
  }, [authToken, currentTenantSlug, isAuthReady, isReady, isSessionValid]);

  const overviewHref = tenantRoute(currentTenantSlug, '');
  const pricingAdjustHref = tenantRoute(currentTenantSlug, '/pricing-adjust');
  const financialEvidenceHoverContent = (
    <div className="w-[300px] overflow-hidden rounded-[8px] border border-[#DCE8EE] bg-white text-[#182026] shadow-[0_16px_40px_rgba(24,32,38,0.10)]">
      <div className="px-4 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#F3F5F4] text-[#4D5B66]">
            <Box className="h-4 w-4" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold tracking-tight text-[#182026]">Financial closure</p>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium tracking-tight text-[#66737F]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0B74DE]" />
              {financialEvidenceConnectionCount == null
                ? 'Connection status available in workspace'
                : `${financialEvidenceConnectionCount} source${financialEvidenceConnectionCount === 1 ? '' : 's'} connected`}
            </div>
          </div>
        </div>
      </div>
      <div className="border-y border-[#E7EEF2] px-4 py-3">
        <p className="text-[11px] leading-[1.5] tracking-tight text-[#4D5B66]">
          Keep payouts, reversals, settlements, and books connected to the proof Margin uses to confirm financial closure.
        </p>
      </div>
      <div className="flex items-center justify-between bg-[#FAFAF7] px-4 py-3 text-[10px] font-semibold tracking-tight text-[#4D5B66]">
        <span>Open financial closure</span>
        <span aria-hidden="true" className="text-[13px] leading-none">→</span>
      </div>
    </div>
  );
  const navGroups: Array<{ label: string; items: NavItem[] }> = [
    {
      label: 'Overview',
      items: [{ title: 'Home', icon: Gauge, href: overviewHref }]
    },
    {
      label: 'Recovery',
      items: [
        { title: 'Recoveries', icon: Workflow, href: tenantRoute(currentTenantSlug, '/recoveries') },
        { title: 'Disputes', icon: Inbox, href: tenantRoute(currentTenantSlug, '/dispute-cases') },
        { title: 'Filing', icon: Send, href: tenantRoute(currentTenantSlug, '/filing-pipeline') },
        { title: 'Appeals', icon: RefreshCw, href: tenantRoute(currentTenantSlug, '/appeals') }
      ]
    },
    {
      label: 'Proof',
      items: [
        { title: 'Evidence', icon: FileText, href: tenantRoute(currentTenantSlug, '/evidence-locker') },
        {
          title: 'Integrations',
          icon: Box,
          href: tenantRoute(currentTenantSlug, '/integrations-hub'),
          hoverContent: financialEvidenceHoverContent
        }
      ]
    },
    {
      label: 'Updates',
      items: [{ title: 'Notifications', icon: Mail, href: tenantRoute(currentTenantSlug, '/notifications'), count: unreadCount }]
    }
  ];
  const utilityItems: NavItem[] = [
    { title: 'Settings', icon: Settings2, href: tenantRoute(currentTenantSlug, '/settings') },
    { title: 'Billing', icon: CreditCard, href: tenantRoute(currentTenantSlug, '/billing') },
    { title: 'Help', icon: LifeBuoy, href: tenantRoute(currentTenantSlug, '/help') },
    { title: 'Latest Changes', icon: NotebookPen, href: tenantRoute(currentTenantSlug, '/whats-new') }
  ];
  const isMoreActive = utilityItems.some((item) => location.pathname === item.href);
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
        ? "h-11 w-11"
        : variant === 'utility'
          ? "h-10 w-10"
          : "h-11 w-11";
      const collapsedLink = (
        <Link
          to={item.href}
          onMouseEnter={handlePrefetch}
          className={cn(
            "group relative flex w-full items-center justify-center transition-all duration-200",
            collapsedBaseClasses,
            isActive
              ? "border-l-2 border-transparent bg-[#E8E9E7] text-[#111827]"
              : "border-l-2 border-transparent text-[#6B7280] hover:bg-[#EEF0EE] hover:text-[#1F2933]"
          )}
          style={{ willChange: 'background-color' }}>
          {isActive && (
            <motion.span
              layoutId="active-indicator-collapsed"
              className="absolute bottom-2 left-0 top-2 w-[2px] bg-[#0B74DE]"
            />
          )}
          <item.icon
            className={cn(
              "transition-colors duration-200",
              variant === 'core' ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]",
              isActive ? "text-[#1F2933]" : "text-inherit"
            )}
            strokeWidth={1.5}
          />
        </Link>
      );

      if (item.hoverContent) {
        return (
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>{collapsedLink}</HoverCardTrigger>
            <HoverCardContent side="right" align="start" sideOffset={12} className="w-auto border-0 bg-transparent p-0 shadow-none">
              {item.hoverContent}
            </HoverCardContent>
          </HoverCard>
        );
      }

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{collapsedLink}</TooltipTrigger>
            <TooltipContent side="right" className="rounded-[4px] border border-white/10 bg-[#1A1A1A] px-3 py-2 text-white shadow-xl">
              <div className="text-[11px] font-sans font-medium tracking-tight">
                {item.title}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    const expandedLink = (
      <Link
        to={item.href}
        onMouseEnter={handlePrefetch}
        className={cn(
              "group relative flex items-center transition-all duration-200 rounded-[6px] mx-2",
          variant === 'core'
            ? "gap-3 px-3 py-2"
            : variant === 'utility'
              ? "gap-2.5 px-2.5 py-1.5"
              : "gap-3 px-3 py-2",
          isActive
            ? "border-l-2 border-transparent bg-[#E8E9E7] text-[#111827] shadow-none"
            : "border-l-2 border-transparent text-[#6B7280] hover:bg-[#EEF0EE] hover:text-[#1F2933]"
        )}
        style={{ willChange: 'background-color, transform' }}>
        {isActive && (
          <motion.span
            layoutId="active-indicator"
            className="hidden"
          />
        )}
        <item.icon
          strokeWidth={1.5}
          className={cn(
            "h-[17px] w-[17px] shrink-0 transition-all duration-200",
            isActive ? "text-[#1F2933]" : "text-inherit"
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "font-sans tracking-tight transition-colors",
              "text-[13.5px] font-medium leading-5",
              isActive ? "text-[#111827]" : "text-inherit"
            )}>
              {item.title}
            </span>
          </div>
        </div>
        {item.count != null && !isCollapsed && (
          <span className={cn(
            "ml-auto rounded-full bg-[#E5E7EB] px-2 py-0.5 text-[10px] font-sans font-bold tabular-nums tracking-tight",
            isActive ? "text-[#111827]" : "text-[#6B7280]"
          )}>
            {item.count}
          </span>
        )}
      </Link>
    );

    if (item.hoverContent) {
      return (
        <HoverCard openDelay={100} closeDelay={200}>
          <HoverCardTrigger asChild>{expandedLink}</HoverCardTrigger>
          <HoverCardContent side="right" align="start" sideOffset={12} className="w-auto border-0 bg-transparent p-0 shadow-none">
            {item.hoverContent}
          </HoverCardContent>
        </HoverCard>
      );
    }

    return expandedLink;
  });
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col font-sans transition-all duration-500 ease-in-out gpu-accelerated",
        isCollapsed ? "w-16" : "w-[282px]",
        "border-r border-[#E5E7EB] bg-[#F7F7F5] text-[#6B7280] shadow-none",
        className
      )}
      style={{
        willChange: 'width',
        fontFamily: "Inter, 'SF Pro Text', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}>
      {/* Branding Header */}
      <div className={cn("pwa-drag-region", isCollapsed ? "px-2 py-4" : "px-5 py-4")}>
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between gap-3")}>
          <Link
            to={overviewHref}
            onMouseEnter={() => prefetchRoute(overviewHref)}
            className="flex min-w-0 items-center gap-2.5 transition-colors"
          >
            <img
              src="/logoimagetwo.png"
              alt="Margin"
              className="h-4 w-auto object-contain"
            />
            {!isCollapsed && (
              <span className="font-merriweather text-[17px] font-medium tracking-tight text-[#1F2933]">Margin</span>
            )}
          </Link>
          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Search workspace"
                onClick={() => navigate(tenantRoute(currentTenantSlug, '/recoveries'))}
                className="flex h-7 w-7 items-center justify-center rounded-[5px] text-[#6B7280] transition-colors hover:bg-[#EEF0EE] hover:text-[#1F2933]"
              >
                <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => navigate(tenantRoute(currentTenantSlug, '/notifications'))}
                className="relative flex h-7 w-7 items-center justify-center rounded-[5px] text-[#6B7280] transition-colors hover:bg-[#EEF0EE] hover:text-[#1F2933]"
              >
                <Bell className="h-3.5 w-3.5" strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-[#0B74DE]" />
                )}
              </button>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <Link
              to={pricingAdjustHref}
              onMouseEnter={() => prefetchRoute(pricingAdjustHref)}
              className="group flex min-w-0 flex-1 items-center justify-between rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-2 transition-colors hover:bg-[#EEF0EE]"
            >
              <span className="truncate text-[12px] font-sans font-medium text-[#1F2933]">Recovery Workspace</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#6B7280]" />
            </Link>
            {subscriptionTierLabel && (
              <span className="shrink-0 rounded-[4px] bg-[#E5E7EB] px-2 py-1 text-[9px] font-sans font-bold uppercase tracking-tight text-[#6B7280]">
                {subscriptionTierLabel}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className={cn("flex min-h-full flex-col", isCollapsed ? "px-2 py-3" : "px-3 py-3")}>
          <nav className={cn("flex w-full flex-col", isCollapsed ? "items-center gap-1" : "gap-2.5")}>
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 pb-0.5 text-[9px] font-sans font-semibold uppercase tracking-tight text-[#9CA3AF]">
                    {group.label}
                  </div>
                )}
                <div className={cn("space-y-0.5", isCollapsed && "flex flex-col items-center")}> 
                  {group.items.map((item) => (
                    <NavItemComponent key={item.title} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Account utilities fold */}
      <div className={cn("mt-auto border-t border-[#E5E7EB] py-2.5", isCollapsed ? "px-2" : "px-3")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More account options"
              className={cn(
                "group flex w-full items-center rounded-[6px] text-[#6B7280] transition-colors hover:bg-[#EEF0EE] hover:text-[#1F2933]",
                isCollapsed ? "h-9 w-10 justify-center" : "gap-2.5 px-2.5 py-1.5",
                isMoreActive && "bg-[#E8E9E7] text-[#111827]"
              )}
            >
              <MoreIcon className={cn("h-[16px] w-[16px] shrink-0", isMoreActive && "text-[#1F2933]")} strokeWidth={1.5} />
              {!isCollapsed && <span className="text-[13px] font-medium tracking-tight">Settings &amp; access</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isCollapsed ? 'right' : 'top'}
            align="start"
            sideOffset={8}
            className="w-56 rounded-[6px] border border-[#E5E7EB] bg-white p-1.5 text-[#1F2933] shadow-xl"
          >
            {utilityItems.map((item) => {
              const itemIsActive = location.pathname === item.href;
              return (
                <DropdownMenuItem key={item.title} asChild className="p-0 focus:bg-transparent">
                  <Link
                    to={item.href}
                    onMouseEnter={() => prefetchRoute(item.href)}
                    className={cn(
                      "flex items-center gap-3 rounded-[5px] px-3 py-2 text-[13px] font-medium tracking-tight text-[#6B7280] outline-none transition-colors hover:bg-[#EEF0EE] hover:text-[#1F2933]",
                      itemIsActive && "bg-[#E8E9E7] text-[#111827]"
                    )}
                  >
                    <item.icon className={cn("h-[16px] w-[16px]", itemIsActive && "text-[#1F2933]")} strokeWidth={1.5} />
                    <span>{item.title}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator className="my-1 bg-[#E5E7EB]" />
            <DropdownMenuItem
              onSelect={() => setSignOutOpen(true)}
              className="flex cursor-pointer items-center gap-3 rounded-[5px] px-3 py-2 text-[13px] font-medium tracking-tight text-[#6B7280] outline-none focus:bg-[#EEF0EE] focus:text-[#1F2933]"
            >
              <LogOut className="h-[16px] w-[16px]" strokeWidth={1.5} />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />

      {/* Referral Popup - Institutional Style */}
      <Dialog open={showReferralPopup} onOpenChange={setShowReferralPopup}>
        <DialogContent className="max-w-md rounded-[2px] border border-[#D8E3E8] bg-white p-0 shadow-none overflow-hidden">
          <div className="px-8 py-7 border-b border-[#D8E3E8] bg-[#FAFAFB]">
            <div className="flex items-center gap-3 mb-1">
              <Gift className="h-5 w-5 text-emerald-500" />
              <h3 className="text-xl font-sans font-semibold text-[#111827] tracking-tight">
                Invite a trusted seller
              </h3>
            </div>
            <p className="text-[11px] text-[#2B7A5A] font-sans font-semibold uppercase tracking-tight">
              WORKSPACE INVITATION
            </p>
          </div>

          <div className="p-8">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-[14px] text-[#50525B] leading-relaxed font-sans tracking-tight">
                  Invite another seller to Margin and help them keep 100% of the funds recovered from their own Amazon account.
                </p>

                {/* Value Proposition */}
                <div className="p-5 bg-[#F2F7FF] border border-[#C8D8FF] rounded-[2px] relative group overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-500" />
                  <p className="text-[10px] text-[#0B74DE] font-sans font-semibold mb-2 uppercase tracking-tight">WORKSPACE BENEFIT</p>
                  <p className="text-base font-sans font-semibold text-[#111827] tracking-tight">100% of recovered funds remain yours</p>
                </div>
              </div>

              {/* Action */}
              <Button
                onClick={() => {
                  setShowReferralPopup(false);
                  setShowInviteForm(true);
                }}
                className="w-full rounded-[2px] bg-[#0B74DE] text-white hover:bg-[#005FBA] text-[11px] h-10 font-semibold font-sans uppercase tracking-tight transition-colors shadow-none">
                Send invitation
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
              className="w-full rounded-[2px] bg-[#0B74DE] text-white hover:bg-[#005FBA] text-[11px] h-10 font-semibold font-sans uppercase tracking-tight transition-colors shadow-none">
              Execute_Transmission
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Sidebar width control */}
      <button
        type="button"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={onToggle}
        className="absolute top-1/2 -right-4 z-50 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#DCE8EE] bg-[#FAFAF7] text-[#66737F] shadow-[0_2px_8px_rgba(24,32,38,0.10)] transition-[transform,background-color,color] duration-200 hover:scale-105 hover:bg-white hover:text-[#182026] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/35"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" strokeWidth={1.75} /> : <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />}
      </button>
    </aside>
  );
}

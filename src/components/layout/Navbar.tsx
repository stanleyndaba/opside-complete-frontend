import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { ArrowUpDown, ChevronDown, Search, Link2, Mail, Copy, Check, X, FileText, Package, DollarSign, Clock, NotebookPen, User, CreditCard, Box, Upload, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { NotificationBell } from './NotificationBell';
import { useCurrency, currencies } from '@/components/providers/CurrencyProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenant } from '@/contexts/TenantContext';
import { useSession } from '@/contexts/SessionContext';
import { selectApprovedReimbursementRows, type ApprovedReimbursementViewRow } from '@/lib/approvedReimbursementTruth';
interface NavbarProps {
  className?: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  forceTransparent?: boolean;
  onContactSupport?: (defaults?: { email?: string }) => void;
}

// Quick search result type
interface QuickSearchResult {
  id: string;
  type: 'document' | 'claim' | 'product' | 'invoice';
  title: string;
  subtitle: string;
  path: string;
}

const toTitleCase = (value?: string | null) => {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const NOT_AVAILABLE = 'Not Available';

const formatMoney = (value: number | null | undefined, currency = 'USD') =>
  typeof value === 'number' && !Number.isNaN(value)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
    : NOT_AVAILABLE;

const formatStamp = (value?: string | null) => {
  if (!value) return NOT_AVAILABLE;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return NOT_AVAILABLE;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function Navbar({
  className,
  sidebarCollapsed = false,
  onToggleSidebar,
  forceTransparent,
  onContactSupport
}: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { isAuthReady, authToken, isSessionValid } = useSession();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const activeTenantSlug =
    normalizeTenantSlug(tenantSlug) ||
    normalizeTenantSlug(tenant?.slug) ||
    normalizeTenantSlug(localStorage.getItem('active_tenant_slug')) ||
    undefined;
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const stored = localStorage.getItem('recentSearches');
    return stored ? JSON.parse(stored) : [];
  });

  const pathTransparent =
    location.pathname === '/' ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/careers') ||
    location.pathname.startsWith('/api-access') ||
    location.pathname.startsWith('/billing') ||
    location.pathname.startsWith('/evidence-locker') ||
    location.pathname.startsWith('/integrations-hub') ||
    location.pathname.startsWith('/integrations/reconnect') ||
    location.pathname.startsWith('/app') ||
    location.pathname.startsWith('/recoveries') ||
    location.pathname.startsWith('/reports') ||
    location.pathname.startsWith('/upcoming-payments') ||
    location.pathname.startsWith('/notifications') ||
    location.pathname.startsWith('/whats-new') ||
    location.pathname.startsWith('/help') ||
    location.pathname.startsWith('/auth') ||
    location.pathname.startsWith('/smart-inventory-sync') ||
    location.pathname.startsWith('/sync');
  const isTransparent = !!forceTransparent || pathTransparent;

  // Check if we're on the Dashboard (Command Center) page
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/app' || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/app');

  // Pages that should have soft grey navbar background to match page bg
  const isGreyBgPage =
    location.pathname.startsWith('/whats-new') ||
    location.pathname.startsWith('/help') ||
    location.pathname.startsWith('/reports') ||
    location.pathname.startsWith('/evidence-locker') ||
    location.pathname.startsWith('/recoveries') ||
    location.pathname.startsWith('/approved-reimbursements');

  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  // User profile state
  const [userProfile, setUserProfile] = useState<{
    id?: string;
    email?: string;
    name?: string;
    company_name?: string;
    amazon_seller_id?: string;
    amazon_display_name?: string;
    amazon_connected?: boolean;
    amazon_status?: 'connected' | 'not_connected' | 'unknown';
    stripe_connected?: boolean;
    created_at?: string;
    last_login?: string;
    tenant_id?: string | null;
    tenant_slug?: string | null;
    role?: string | null;
  } | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!activeTenantSlug || !isAuthReady || !authToken || !isSessionValid) {
        setIsProfileLoading(false);
        return;
      }

      try {
        const [meRes, statusRes] = await Promise.all([
          api.getMe(activeTenantSlug),
          api.getIntegrationsStatus(activeTenantSlug)
        ]);

        if (meRes?.ok && meRes.data) {
          const me = meRes.data as any;
          const status = statusRes.ok ? statusRes.data as any : null;
          setUserProfile({
            id: me.id,
            email: me.email,
            name: me.name || me.company_name || me.email || undefined,
            company_name: me.company_name,
            amazon_seller_id: status?.amazon_account?.seller_id || undefined,
            amazon_display_name: status?.amazon_account?.display_name || undefined,
            amazon_connected: status?.amazon_connected ?? false,
            amazon_status: status
              ? (status.amazon_connected ? 'connected' : 'not_connected')
              : 'unknown',
            stripe_connected: me.stripe_connected,
            created_at: me.created_at,
            last_login: me.last_login,
            tenant_id: me.tenant_id,
            tenant_slug: me.tenant_slug,
            role: me.role
          });
        } else if (statusRes.ok && statusRes.data) {
          const status = statusRes.data as any;
          setUserProfile((prev) => ({
            ...(prev || {}),
            id: prev?.id || localStorage.getItem('user_id') || undefined,
            email: prev?.email || localStorage.getItem('user_email') || undefined,
            amazon_connected: status.amazon_connected ?? false,
            amazon_status: status.amazon_connected ? 'connected' : 'not_connected',
            amazon_seller_id: status.amazon_account?.seller_id,
            amazon_display_name: status.amazon_account?.display_name
          }));
        }
      } catch (e) {
        console.error('Failed to fetch user profile:', e);
      } finally {
        setIsProfileLoading(false);
      }
    };
    fetchProfile();
  }, [activeTenantSlug, authToken, isAuthReady, isSessionValid]);

  const amazonStatusLabel =
    isProfileLoading || !userProfile?.amazon_status
      ? 'Loading...'
      : userProfile.amazon_status === 'connected'
        ? 'Connected'
        : userProfile.amazon_status === 'not_connected'
          ? 'Not connected'
          : 'Unknown';

  const amazonConnectionHeadline =
    isProfileLoading || !userProfile?.amazon_status
      ? 'Checking Amazon connection'
      : userProfile.amazon_status === 'connected'
        ? 'Amazon connected'
        : userProfile.amazon_status === 'not_connected'
          ? 'Amazon not connected'
          : 'Amazon status unavailable';

  const accountDisplayName =
    userProfile?.name || userProfile?.company_name || userProfile?.email || 'My Account';

  const accountEmail = userProfile?.email || (isProfileLoading ? 'Loading...' : 'No email available');

  const accountRoleLabel =
    userProfile?.role
      ? toTitleCase(userProfile.role)
      : isProfileLoading
        ? 'Loading...'
        : 'Member';

  const memberSinceLabel =
    userProfile?.created_at
      ? new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : (isProfileLoading ? 'Loading...' : '—');
  const handleContactSupport = useCallback(() => {
    if (onContactSupport) {
      onContactSupport({
        email: userProfile?.email || undefined
      });
      return;
    }

    navigate('/contact');
  }, [navigate, onContactSupport, userProfile?.email]);

  // Fetch count of connected platforms
  const [connectedPlatformsCount, setConnectedPlatformsCount] = useState<number>(0);
  const [approvedReimbursements, setApprovedReimbursements] = useState<ApprovedReimbursementViewRow[]>([]);
  const [approvedReimbursementsLoading, setApprovedReimbursementsLoading] = useState(false);
  const [approvedReimbursementsError, setApprovedReimbursementsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConnectionsCount = async () => {
      if (!activeTenantSlug) {
        setConnectedPlatformsCount(0);
        return;
      }

      const normalizedTenantSlug = normalizeTenantSlug(activeTenantSlug);
      if (normalizedTenantSlug === 'demo-workspace' || normalizedTenantSlug === 'acme-corp') {
        setConnectedPlatformsCount(3);
        return;
      }

      try {
        const [statusRes, sourcesRes] = await Promise.all([
          api.getIntegrationsStatus(activeTenantSlug),
          api.getEvidenceSources(activeTenantSlug)
        ]);
        
        if (statusRes.ok && sourcesRes.ok) {
          const status = statusRes.data;
          const sources = sourcesRes.data.sources || [];
          let count = 0;
          
          const platforms = ['amazon', 'stripe', 'gmail', 'outlook', 'gdrive', 'dropbox', 'slack', 'adobe_sign', 'onedrive'];
          
          platforms.forEach((p) => {
            if (p === 'amazon') {
              if ((status && (status as any)[`${p}_connected`]) || (status as any)?.amazon_connected) count++;
            } else if (p === 'stripe') {
              if (status && (status as any)[`${p}_connected`]) count++;
            } else {
              let isConnected = false;
              try {
                const statusObj = status as any;
                if (statusObj?.providerIngest?.[p]?.connected === true) isConnected = true;
                const capitalized = p.charAt(0).toUpperCase() + p.slice(1);
                if (!isConnected && statusObj?.providerIngest?.[capitalized]?.connected === true) isConnected = true;
                if (!isConnected && statusObj?.providers?.[p] === true) isConnected = true;
                if (!isConnected && statusObj?.providers?.[capitalized] === true) isConnected = true;
                if (!isConnected && p === 'gdrive' && statusObj?.providerIngest?.['google_drive']?.connected === true) isConnected = true;
                if (!isConnected && p === 'gdrive' && statusObj?.providers?.['google_drive'] === true) isConnected = true;
                if (!isConnected && statusObj && statusObj[`${p}_connected`] === true) isConnected = true;
                if (!isConnected && sources.some((s: any) => {
                  const sLower = s.provider?.toLowerCase() || '';
                  const pLower = p.toLowerCase();
                  return s.status === 'connected' && 
                         (sLower === pLower || (pLower === 'gdrive' && sLower === 'google_drive'));
                })) {
                  isConnected = true;
                }
              } catch (e) {
                console.error("Error checking connection status for", p, e);
              }
              if (isConnected) count++;
            }
          });
          
          setConnectedPlatformsCount(count);
        }
      } catch (e) {
        console.error("Failed to fetch connections count", e);
      }
    };
    
    fetchConnectionsCount();
  }, [activeTenantSlug]);

  useEffect(() => {
    const fetchApprovedReimbursements = async () => {
      if (!activeTenantSlug || !isAuthReady || !authToken || !isSessionValid) {
        setApprovedReimbursements([]);
        setApprovedReimbursementsError(null);
        setApprovedReimbursementsLoading(false);
        return;
      }

      setApprovedReimbursementsLoading(true);
      setApprovedReimbursementsError(null);

      try {
        const response = await api.getRecoveriesLedger({
          date_range: 'all',
          sort_by: 'approved_amount',
          sort_dir: 'desc',
          page: 1,
          page_size: 12,
        }, activeTenantSlug);

        if (!response.ok || !response.data?.success) {
          throw new Error(response.error || 'Failed to load approved reimbursements.');
        }

        const rows = Array.isArray(response.data?.rows) ? response.data.rows : [];
        const nextRows = selectApprovedReimbursementRows(rows).slice(0, 8);

        setApprovedReimbursements(nextRows);
      } catch (error: any) {
        console.error('Failed to load approved reimbursements:', error);
        setApprovedReimbursements([]);
        setApprovedReimbursementsError(error?.message || 'Failed to load approved reimbursements.');
      } finally {
        setApprovedReimbursementsLoading(false);
      }
    };

    fetchApprovedReimbursements();
  }, [activeTenantSlug, authToken, isAuthReady, isSessionValid]);

  // State for notes feature
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState<{ id: string; text: string; createdAt: string }[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [isNoteHovered, setIsNoteHovered] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const noteIconRef = useRef<HTMLButtonElement>(null);

  /* Fetch notes from backend on load
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await api.getNotes();
        if (response.ok && response.data?.success) {
          setNotes(response.data.data.map((n: any) => ({
            id: n.id,
            text: n.content,
            createdAt: n.created_at
          })));
        }
      } catch (error) {
        console.error('Failed to fetch notes:', error);
      }
    };
    fetchNotes();
  }, []); */


  // Handle search submission
  const handleSearch = useCallback((query: string) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    // Save to recent searches
    const updatedRecent = [normalizedQuery, ...recentSearches.filter(s => s !== normalizedQuery)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));

    // Navigate to appropriate search page based on context
    setIsSearchFocused(false);
    const encodedQuery = encodeURIComponent(normalizedQuery);
    const loweredQuery = normalizedQuery.toLowerCase();

    // Search in Evidence Locker for documents
    if (loweredQuery.includes('invoice') || loweredQuery.includes('doc') || loweredQuery.includes('receipt')) {
      navigate(tenantRoute(activeTenantSlug, `/evidence-locker?q=${encodedQuery}`));
    }
    // Search in Recoveries for claims
    else if (loweredQuery.includes('claim') || loweredQuery.includes('recovery') || loweredQuery.includes('fba')) {
      navigate(tenantRoute(activeTenantSlug, `/recoveries?q=${encodedQuery}`));
    }
    // Default: search in Recoveries (main page for searching claims)
    else {
      navigate(tenantRoute(activeTenantSlug, `/recoveries?q=${encodedQuery}`));
    }
  }, [activeTenantSlug, navigate, recentSearches]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
      searchInputRef.current?.blur();
    }
  }, [handleSearch, searchQuery]);

  // Global Search Shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleGlobalSearchShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalSearchShortcut);
    return () => window.removeEventListener('keydown', handleGlobalSearchShortcut);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search and recent
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Quick links for search dropdown
  const quickLinks = [
    { id: 'documents', icon: FileText, label: 'Search Documents', path: '/evidence-locker' },
    { id: 'claims', icon: DollarSign, label: 'Search Claims', path: '/recoveries' },
    { id: 'products', icon: Package, label: 'Search Products', path: '/recoveries?tab=products' },
  ];

  // Sandbox badge: show in non-production or when VITE_SANDBOX=true
  const env: any = (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined) || (typeof process !== 'undefined' ? (process as any).env : undefined) || {};
  const isSandbox = String(env.VITE_SANDBOX || '') === 'true' || String(env.MODE || env.NODE_ENV || '') !== 'production';
  return (
    <>
      <header className={cn(
        "sticky top-0 z-30 transition-all duration-500 ease-in-out font-sans",
        sidebarCollapsed ? "ml-16" : "ml-[282px]",
        "bg-[#FAFAF7] text-[#111827] shadow-none",
        className
      )}>
        <div className="flex min-h-16 items-center justify-between px-8">
          {/* Left/Center Group - Search, Icons, Currency, Connect */}
          <div className="flex items-center gap-x-8">
            <div className="relative flex items-center gap-4" ref={searchContainerRef}>
              <div className="group relative w-80 lg:w-[420px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A99A5] transition-colors group-focus-within:text-[#4D5B66]" />
                <Input
                  ref={searchInputRef}
                  aria-label="Search workspace"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  className="h-10 rounded-md border border-[#DCE8EE] bg-white pl-10 pr-16 text-[12px] font-medium tracking-tight text-[#182026] placeholder:font-normal placeholder:text-[#8A99A5] transition-colors hover:border-[#C7D7DF] focus:border-[#0B74DE] focus:bg-white focus:ring-2 focus:ring-[#0B74DE]/10"
                />
                {!searchQuery && (
                  <kbd className="pointer-events-none absolute right-3 top-1/2 inline-flex h-5 -translate-y-1/2 items-center rounded border border-[#DCE8EE] bg-[#FAFAF7] px-1.5 text-[9px] font-medium tracking-tight text-[#66737F]">
                    {navigator.platform.indexOf('Mac') > -1 ? '⌘ K' : 'Ctrl K'}
                  </kbd>
                )}
                {/* Clear button */}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-[#8A99A5] transition-colors hover:bg-[#F7FAFC] hover:text-[#182026]">
                    <X className="h-3 w-3" />
                  </button>
                )}

                {/* Search Dropdown */}
                {isSearchFocused && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-[2px] border border-[#D8E3E8] bg-white shadow-none">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div className="border-b border-[#D8E3E8] p-3">
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-sans font-bold uppercase tracking-tight text-[#9CA3AF]">Recent searches</span>
                          <button
                            onClick={clearRecentSearches}
                            className="text-[10px] font-sans font-bold uppercase tracking-tight text-[#6B7280] transition-colors hover:text-[#111827]">
                            Clear
                          </button>
                        </div>
                        {recentSearches.map((search, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSearchQuery(search);
                              handleSearch(search);
                            }}
                            className="group flex w-full items-center gap-3 rounded-[2px] px-3 py-2 text-[11px] font-sans font-semibold uppercase tracking-tight text-[#4B5563] transition-all hover:bg-[#F8FAFB] hover:text-[#111827]">
                            <Clock className="h-3 w-3 text-[#9CA3AF] group-hover:text-[#111827]" />
                            {search}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick Access */}
                    <div className="p-3">
                      <span className="mb-2 block px-2 text-[10px] font-sans font-bold uppercase tracking-tight text-[#9CA3AF]">Quick links</span>
                      {quickLinks.map((link) => (
                        <button
                          key={link.id}
                          onClick={() => {
                            setIsSearchFocused(false);
                            navigate(tenantRoute(activeTenantSlug, link.path));
                          }}
                          className="group flex w-full items-center gap-3 rounded-[2px] px-3 py-2 text-[11px] font-sans font-semibold uppercase tracking-tight text-[#4B5563] transition-all hover:bg-[#F8FAFB] hover:text-[#111827]">
                          {link.label}
                        </button>
                      ))}
                    </div>

                    {/* Search Tip */}
                    <div className="border-t border-[#D8E3E8] bg-[#FAFAF7] px-4 py-3">
                      <p className="text-[9px] font-sans font-bold uppercase tracking-tight text-[#9CA3AF]">
                        Search workspace records with <kbd className="rounded-[2px] border border-[#D8E3E8] bg-white px-1.5 py-0.5 text-[9px] font-sans font-bold text-[#4B5563]">ENTER</kbd>
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {/* Functional Icons Group - Compact Horizontal */}
              <div className="ml-3 flex items-center gap-x-3">

                {/* Notes Icon - Commented out for V1 noise reduction
                <div className="relative">
                  <button
                    ref={noteIconRef}
                    onClick={() => setShowNotesModal(true)}
                    onMouseEnter={() => setIsNoteHovered(true)}
                    onMouseLeave={() => setIsNoteHovered(false)}
                    className="h-10 w-10 flex items-center justify-center text-white/40 hover:bg-white/[0.03] rounded-xl border border-transparent hover:border-white/5 transition-all relative"
                    aria-label="Notes">
                    <NotebookPen className="h-5 w-5" />
                    {notes.length > 0 && (
                      <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isNoteHovered && notes.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-3 w-[280px] bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-3xl z-50 overflow-hidden backdrop-blur-3xl">
                        <div className="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                          <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Recent notes</span>
                          <span className="text-[9px] font-sans font-bold text-emerald-500/50 uppercase tracking-tight">{notes.length} total</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-white/5 scrollbar-hide">
                          {notes.slice(0, 5).map((note) => (
                            <div key={note.id} className="group relative p-5 hover:bg-white/[0.02] transition-all">
                              <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <p className="text-[11px] text-white/40 font-sans font-bold tracking-tight line-clamp-3 leading-relaxed group-hover:text-white/60">{note.text}</p>
                              <div className="text-[9px] text-white/10 mt-3 font-sans font-bold flex items-center justify-between uppercase tracking-tight">
                                <span>ID.{note.id.substring(0, 6)}</span>
                                <span>{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div> */}
                {/* Upload Icon */}
                <HoverCard openDelay={100} closeDelay={200}>
                  <HoverCardTrigger asChild>
                    <button
                      onClick={() => navigate(tenantRoute(activeTenantSlug, '/data-upload'))}
                      className="relative flex h-10 w-10 items-center justify-center rounded-[7px] text-[#6B7280] transition-all hover:bg-[#F1F2F0] hover:text-[#0B74DE]"
                      aria-label="Upload CSV">
                      <Upload className="h-5 w-5" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="bottom"
                    align="center"
                    sideOffset={10}
                    className="w-[320px] overflow-hidden rounded-[6px] border border-[#E5E7EB] bg-white p-0 text-[#111827] shadow-[0_14px_34px_rgba(17,24,39,0.10)]">
                    <div className="px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#F3F5F4] text-[#4B5563]">
                            <Upload className="h-4 w-4" strokeWidth={1.6} />
                          </div>
                          <div>
                            <p className="font-sans text-[12px] font-semibold tracking-tight text-[#111827]">Data upload</p>
                            <p className="mt-0.5 font-sans text-[10px] font-medium tracking-tight text-[#0B74DE]">Manual report ingestion</p>
                          </div>
                        </div>
                        <span className="rounded-[4px] bg-[#F3F5F4] px-2 py-1 font-sans text-[9px] font-semibold tracking-tight text-[#6B7280]">CSV / TXT</span>
                      </div>

                      <div className="my-4 h-px bg-[#F1F2F0]" />

                      <p className="font-sans text-[12px] font-normal leading-relaxed tracking-tight text-[#4B5563]">
                        Upload Amazon Seller Central CSV reports to feed the detection pipeline.
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="font-sans text-[10px] font-medium tracking-tight text-[#9CA3AF]">Orders · Shipments · Settlements</span>
                        <span className="shrink-0 font-sans text-[10px] font-semibold tracking-tight text-[#0B74DE]">Open upload →</span>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>

                {/* Notification Icon (Messaging) */}
                <NotificationBell
                  label="Alert"
                  showLabel={false}
                  className="flex h-10 w-10 items-center justify-center rounded-none text-[#6B7280] transition-all hover:bg-[#F8FAFB] hover:text-[#0B74DE]"
                  iconClassName="h-5 w-5"
                />

                {/* Approved reimbursements */}
                <HoverCard openDelay={100} closeDelay={200}>
                  <HoverCardTrigger asChild>
                    <button
                      onClick={() => navigate(tenantRoute(activeTenantSlug, '/approved-reimbursements'))}
                      className="flex h-9 w-9 items-center justify-center rounded-[7px] transition-colors hover:bg-[#F1F2F0]"
                      aria-label="Approved reimbursements"
                    >
                      <Layers className="h-5 w-5 text-[#0B74DE]" strokeWidth={1.85} />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="bottom"
                    align="center"
                    sideOffset={10}
                    className="w-[420px] overflow-hidden rounded-[8px] border border-[#DCE8EE] bg-white p-0 text-[#111827] shadow-[0_16px_40px_rgba(24,32,38,0.10)]"
                  >
                    <div className="border-b border-[#DCE8EE] px-4 py-3.5">
                      <div className="flex items-baseline justify-between gap-4">
                        <div>
                          <p className="font-lora text-[18px] font-normal tracking-tight text-[#182026]">Approved reimbursements</p>
                          <p className="mt-1 text-[11px] leading-4 text-[#66737F]">Recent verified outcome records.</p>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium tabular-nums text-[#66737F]">{approvedReimbursements.length} recent</span>
                      </div>
                    </div>
                    <div className="max-h-[352px] overflow-y-auto">
                      {approvedReimbursementsLoading ? (
                        <p className="px-4 py-7 text-center text-[12px] text-[#66737F]">Loading approved reimbursements…</p>
                      ) : approvedReimbursementsError ? (
                        <p className="px-4 py-7 text-center text-[12px] text-[#66737F]">Unable to load approved reimbursements.</p>
                      ) : approvedReimbursements.length === 0 ? (
                        <p className="px-4 py-7 text-center text-[12px] leading-5 text-[#66737F]">No production-verified approved reimbursement records yet.</p>
                      ) : (
                        <div className="divide-y divide-[#E7EEF2]">
                          {approvedReimbursements.map((row) => (
                            <button
                              key={`${row.routeId}-${row.caseReference}`}
                              type="button"
                              onClick={() => navigate(tenantRoute(activeTenantSlug, '/approved-reimbursements'))}
                              className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-4 px-4 py-3 text-left transition-colors hover:bg-[#F7FAFC]"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-[12px] font-medium tracking-tight text-[#182026]">{row.caseReference}</p>
                                <p className="mt-1 text-[11px] leading-4 text-[#66737F]">{row.payoutTruth}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[13px] font-semibold tabular-nums tracking-tight text-[#182026]">{formatMoney(row.amount, row.currency)}</p>
                                <p className="mt-1 text-[10px] text-[#66737F]">{formatStamp(row.lastUpdatedAt)}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(tenantRoute(activeTenantSlug, '/approved-reimbursements'))}
                      className="flex w-full items-center justify-between border-t border-[#DCE8EE] bg-[#FAFAF7] px-4 py-3 text-left text-[12px] font-medium tracking-tight text-[#4D5B66] transition-colors hover:bg-[#F3F7FA] hover:text-[#0B74DE]"
                    >
                      <span>Open reimbursement ledger</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </HoverCardContent>
                </HoverCard>
              </div>

            </div>
          </div>

          {/* Right Group - Connect & Account */}
          <div className="ml-6 flex items-center gap-x-4">
            {/* Integrations Icon */}
            <HoverCard openDelay={100} closeDelay={200}>
              <HoverCardTrigger asChild>
                <button
                  onClick={() => navigate(tenantRoute(activeTenantSlug, '/integrations-hub'))}
                  className="relative flex h-10 w-10 items-center justify-center rounded-[7px] text-[#6B7280] transition-all hover:bg-[#F1F2F0] hover:text-[#0B74DE]"
                  aria-label="Integrations Hub">
                  <Box className="h-5 w-5" />
                  <span className="pointer-events-none absolute right-0 top-0 z-10 flex h-4 min-w-4 translate-x-1/4 -translate-y-1/4 select-none items-center justify-center rounded-full bg-[#0B74DE] px-[3px] text-center font-sans text-[9px] font-bold leading-4 text-[#FFFFFF] tabular-nums shadow-none">
                    {connectedPlatformsCount}
                  </span>
                </button>
              </HoverCardTrigger>
              <HoverCardContent
                side="bottom"
                align="center"
                sideOffset={10}
                className="w-[304px] overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white p-0 shadow-[0_16px_40px_rgba(17,24,39,0.10)]">
                <div className="px-4 pb-3 pt-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#F3F5F4] text-[#4B5563]">
                      <Box className="h-4 w-4" strokeWidth={1.6} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-sans font-semibold tracking-tight text-[#111827]">Integrations Hub</div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] font-sans font-medium tracking-tight text-[#6B7280]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0B74DE]" />
                        {connectedPlatformsCount} platform{connectedPlatformsCount === 1 ? '' : 's'} connected
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-[#E5E7EB] px-4 py-3">
                  <p className="text-[11px] font-sans leading-[1.5] tracking-tight text-[#4B5563]">
                    Connect the sources Margin uses to reconcile your records and evidence.
                  </p>
                </div>
                <button
                  onClick={() => navigate(tenantRoute(activeTenantSlug, '/integrations-hub'))}
                  className="flex w-full items-center justify-between border-t border-[#E5E7EB] bg-[#FAFAF7] px-4 py-3 text-left text-[10px] font-sans font-semibold tracking-tight text-[#111827] transition-colors hover:bg-[#F3F5F4] hover:text-[#0B74DE]"
                >
                  <span>Open integrations</span>
                  <span aria-hidden="true" className="text-[13px] leading-none">→</span>
                </button>
              </HoverCardContent>
            </HoverCard>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group/account flex items-center gap-3 rounded-[7px] px-3 py-2 text-[11px] font-sans font-bold uppercase tracking-tight text-[#4B5563] transition-all hover:bg-[#F1F2F0] hover:text-[#0B74DE]">
                  <User className="h-5 w-5 text-[#9CA3AF] transition-colors group-hover/account:text-[#0B74DE]" />
                  <span className="hidden sm:inline">Account</span>
                  <ChevronDown className="h-3 w-3 text-[#9CA3AF] transition-colors group-hover/account:text-[#0B74DE]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={12} className="mt-0 w-[352px] overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white p-0 shadow-[0_16px_40px_rgba(17,24,39,0.10)]">
                <div className="border-b border-[#E5E7EB] bg-white px-4 py-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-[13px] font-sans font-semibold tracking-tight text-[#111827]">
                      {accountDisplayName}
                    </h3>
                    <p className="mt-1 truncate font-sans text-[11px] text-[#6B7280]">
                      {accountEmail}
                    </p>
                    <div className="mt-4 border-t border-[#E5E7EB] pt-3">
                      <p className="text-[10px] font-medium tracking-tight text-[#66737F]">Active workspace</p>
                      <p className="mt-1 truncate text-[12px] font-medium tracking-tight text-[#182026]">{tenant?.name || tenant?.slug || activeTenantSlug || 'Workspace'}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-sans font-semibold uppercase tracking-tight text-[#9CA3AF]">
                          Role
                        </div>
                        <div className="mt-1 truncate text-[12px] font-sans font-medium tracking-tight text-[#111827]">
                          {accountRoleLabel}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-sans font-semibold uppercase tracking-tight text-[#9CA3AF]">
                          Member since
                        </div>
                        <div className="mt-1 truncate text-[12px] font-sans font-medium tracking-tight text-[#111827]">
                          {memberSinceLabel}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-[#E5E7EB] pt-3 font-sans text-[11px] tracking-tight text-[#6B7280]">
                      {connectedPlatformsCount > 0
                        ? `${connectedPlatformsCount} source${connectedPlatformsCount === 1 ? '' : 's'} connected`
                        : 'No sources connected yet'}
                    </div>
                  </div>
                </div>

                <div className="px-4 pt-3">
                  <DropdownMenuItem
                    onSelect={handleContactSupport}
                    className="flex cursor-pointer items-center gap-3 rounded-[6px] bg-[#F3F5F4] px-3.5 py-3 text-[#4B5563] outline-none transition-colors hover:bg-[#EDEFEF] hover:text-[#111827] focus:bg-[#EDEFEF] focus:text-[#111827]"
                  >
                    <Mail className="h-4 w-4 text-[#9CA3AF]" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-sans font-semibold uppercase tracking-tight text-[#111827]">
                        Contact Us
                      </div>
                      <div className="mt-0.5 font-sans text-[10px] tracking-tight text-[#6B7280]">
                        Send a support query from this workspace.
                      </div>
                    </div>
                  </DropdownMenuItem>
                </div>

                <div className="px-4 py-4">
                  <div className="rounded-[6px] bg-[#F3F5F4] px-3.5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10px] font-sans font-semibold uppercase tracking-tight text-[#6B7280]">
                        Amazon
                      </div>
                      <div className="shrink-0 rounded-full bg-white px-2 py-1 text-[9px] font-sans font-semibold uppercase tracking-tight text-[#365B7D]">
                        {amazonStatusLabel}
                      </div>
                    </div>
                    <div className="mt-3 min-w-0">
                      <div className="text-[13px] font-sans font-semibold tracking-tight text-[#111827]">
                        {amazonConnectionHeadline}
                      </div>
                      <p className="mt-1.5 font-sans text-[11px] leading-[1.5] text-[#4B5563]">
                        {userProfile?.amazon_connected
                          ? (userProfile?.amazon_display_name || 'Margin can keep your Amazon records up to date.')
                          : 'Connect Amazon to keep your records up to date.'}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(tenantRoute(activeTenantSlug, '/integrations-hub'))}
                      className="mt-3 text-[10px] font-sans font-semibold uppercase tracking-tight text-[#111827] transition-colors hover:text-[#4B5563]"
                    >
                      Open integrations
                    </button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}

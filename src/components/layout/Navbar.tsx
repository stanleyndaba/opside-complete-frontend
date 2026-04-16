import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { ArrowUpDown, ChevronDown, Search, Link2, Mail, Copy, Check, X, FileText, Package, DollarSign, Clock, NotebookPen, User, CreditCard, Box, Upload, CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  onContactSupport?: () => void;
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
      onContactSupport();
      return;
    }

    navigate('/contact');
  }, [navigate, onContactSupport]);

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
        sidebarCollapsed ? "ml-20" : "ml-64",
        "bg-[#070707]/90 border-b border-white/5 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]",
        className
      )}>
        <div className="flex items-center justify-between h-14 px-6">
          {/* Left/Center Group - Search, Icons, Currency, Connect */}
          <div className="flex items-center gap-x-8">
            <div className="relative flex items-center gap-4" ref={searchContainerRef}>
              <div className="relative w-80 lg:w-[420px] group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 group-focus-within:text-white/45 transition-colors" />
                <Input
                  ref={searchInputRef}
                  aria-label="Search"
                  placeholder="Search documents or claims..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-10 h-10 text-[11px] bg-white/[0.03] border-white/5 rounded-xl focus:bg-white/[0.05] focus:border-white/15 focus:ring-0 transition-all placeholder:text-white/10 font-sans font-bold tracking-tight text-white/75"
                />
                {/* Clear button */}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                )}

                {/* Search Dropdown */}
                {isSearchFocused && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#0c0c0c] border border-white/10 rounded-xl shadow-3xl z-50 overflow-hidden backdrop-blur-2xl">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div className="p-3 border-b border-white/5">
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Recent searches</span>
                          <button
                            onClick={clearRecentSearches}
                            className="text-[10px] font-sans font-bold text-white/35 hover:text-white/65 uppercase tracking-tight transition-colors">
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
                            className="w-full flex items-center gap-3 px-3 py-2 text-[11px] text-white/40 hover:bg-white/[0.03] hover:text-white transition-all font-sans font-bold uppercase tracking-tight group">
                            <Clock className="h-3 w-3 text-white/10 group-hover:text-white/55" />
                            {search}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick Access */}
                    <div className="p-3">
                      <span className="text-[10px] font-sans font-bold text-white/20 px-2 uppercase tracking-tight block mb-2">Quick links</span>
                      {quickLinks.map((link) => (
                        <button
                          key={link.id}
                          onClick={() => {
                            setIsSearchFocused(false);
                            navigate(tenantRoute(activeTenantSlug, link.path));
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-[11px] text-white/40 hover:bg-white/[0.03] hover:text-white transition-all font-sans font-bold uppercase tracking-tight group">
                          {link.label}
                        </button>
                      ))}
                    </div>

                    {/* Search Tip */}
                    <div className="px-4 py-3 bg-white/[0.01] border-t border-white/5">
                      <p className="text-[9px] text-white/20 font-sans font-bold uppercase tracking-tight">
                        Invoke system command with <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-white/70 font-sans font-bold text-[9px]">ENTER</kbd>
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {/* Functional Icons Group - Compact Horizontal */}
              <div className="flex items-center gap-x-3 border-l border-white/5 pl-4 ml-3">

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
                      className="h-10 w-10 flex items-center justify-center text-white/40 hover:bg-white/[0.03] rounded-xl border border-transparent hover:border-white/5 transition-all relative"
                      aria-label="Upload CSV">
                      <Upload className="h-5 w-5" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="bottom"
                    align="center"
                    sideOffset={12}
                    className="w-64 p-0 bg-[#0c0c0c] border border-white/10 shadow-3xl rounded-2xl overflow-hidden backdrop-blur-3xl">
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                          <Upload className="h-4 w-4 text-violet-500" />
                        </div>
                        <span className="text-[11px] font-sans font-bold text-white uppercase tracking-tight">Data Upload</span>
                      </div>
                      <p className="text-[11px] text-white/40 leading-relaxed font-sans font-bold italic">
                        "Upload Amazon Seller Central CSV reports to feed the detection pipeline."
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>

                {/* Notification Icon (Messaging) */}
                <NotificationBell
                  label="Alert"
                  showLabel={false}
                  className="h-10 w-10 flex items-center justify-center text-white/40 hover:bg-white/[0.03] rounded-xl border border-transparent hover:border-white/5 transition-all"
                  iconClassName="h-5 w-5"
                />

                {/* Approved Reimbursements */}
                <HoverCard openDelay={100} closeDelay={200}>
                  <HoverCardTrigger asChild>
                    <button
                      onClick={() => navigate(tenantRoute(activeTenantSlug, '/approved-reimbursements'))}
                      className="h-10 w-10 flex items-center justify-center text-white/40 hover:bg-white/[0.03] rounded-xl border border-transparent hover:border-white/5 transition-all relative"
                      aria-label="Approved reimbursements">
                      <CircleCheck className="h-5 w-5" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="bottom"
                    align="center"
                    sideOffset={12}
                    className="w-[560px] p-0 bg-[#0c0c0c] border border-white/10 shadow-3xl rounded-2xl overflow-hidden backdrop-blur-3xl">
                    <div className="border-b border-white/10 px-5 py-4">
                      <h4 className="text-[13px] font-sans font-bold text-white uppercase tracking-tight">Approved Reimbursements</h4>
                    </div>
                    <div className="max-h-[360px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="h-10 px-5 text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Case</TableHead>
                            <TableHead className="h-10 text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Amount</TableHead>
                            <TableHead className="h-10 text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Verification</TableHead>
                            <TableHead className="h-10 pr-5 text-right text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {approvedReimbursementsLoading ? (
                            <TableRow className="border-white/5">
                              <TableCell colSpan={4} className="px-5 py-6 text-center text-[11px] font-sans font-bold text-white/45">
                                Loading approved reimbursements...
                              </TableCell>
                            </TableRow>
                          ) : approvedReimbursementsError ? (
                            <TableRow className="border-white/5">
                              <TableCell colSpan={4} className="px-5 py-6 text-center text-[11px] font-sans font-bold text-white/45">
                                Unable to load approved reimbursements.
                              </TableCell>
                            </TableRow>
                          ) : approvedReimbursements.length === 0 ? (
                            <TableRow className="border-white/5">
                              <TableCell colSpan={4} className="px-5 py-6 text-center text-[11px] font-sans font-bold text-white/45">
                                No production-verified approved reimbursement records yet.
                              </TableCell>
                            </TableRow>
                          ) : approvedReimbursements.map((row) => (
                            <TableRow
                              key={`${row.routeId}-${row.caseReference}`}
                              className="cursor-pointer border-white/5 text-white/70 transition-colors hover:bg-white/[0.03] hover:text-white"
                              onClick={() => navigate(tenantRoute(activeTenantSlug, '/approved-reimbursements'))}
                            >
                              <TableCell className="px-5 py-3 text-[11px] font-sans font-bold tracking-tight text-white/78">
                                {row.caseReference}
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="text-[11px] font-sans font-bold text-white/70">{formatMoney(row.amount, row.currency)}</div>
                                <div className="mt-1 text-[9px] font-sans font-bold uppercase tracking-tight text-white/28">{row.amountNote}</div>
                              </TableCell>
                              <TableCell className="py-3 text-[11px] font-sans font-bold text-white/50">
                                {row.payoutTruth}
                              </TableCell>
                              <TableCell className="py-3 pr-5 text-right text-[11px] font-sans font-bold text-white/40">
                                {formatStamp(row.lastUpdatedAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
          </div>

          {/* Right Group - Connect & Account */}
          <div className="flex items-center gap-x-4 border-l border-white/5 pl-6 ml-6">
            {/* Integrations Icon */}
            <HoverCard openDelay={100} closeDelay={200}>
              <HoverCardTrigger asChild>
                <button
                  onClick={() => navigate(tenantRoute(activeTenantSlug, '/integrations-hub'))}
                  className="h-10 w-10 flex items-center justify-center text-white/40 hover:bg-white/[0.03] rounded-xl border border-transparent hover:border-white/5 transition-all relative"
                  aria-label="Integrations Hub">
                  <Box className="h-5 w-5" />
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center bg-[#262626] text-white text-[9px] font-bold leading-none rounded-full min-w-[14px] h-[14px] px-0.5 border border-white/10 shadow-[0_0_10px_rgba(0,0,0,0.45)]">
                    {connectedPlatformsCount}
                  </span>
                </button>
              </HoverCardTrigger>
              <HoverCardContent
                side="bottom"
                align="center"
                sideOffset={12}
                className="w-72 p-0 bg-[#0c0c0c] border border-white/10 shadow-3xl rounded-2xl overflow-hidden backdrop-blur-3xl">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <Box className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-sans font-bold text-white uppercase tracking-tight">Integrations Hub</span>
                      <span className="text-[9px] font-sans font-bold text-orange-600 uppercase tracking-tight mt-0.5">{connectedPlatformsCount} Platform{connectedPlatformsCount === 1 ? '' : 's'} connected</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed font-sans font-bold italic">
                    "Configure your document and data providers — connect Amazon, Gmail, and other marketplace sources."
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 text-[11px] text-white/60 hover:text-white transition-all font-sans font-bold group/account uppercase tracking-tight px-3 py-1.5 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/5">
                  <User className="h-5 w-5 text-white/20 group-hover/account:text-white/75 transition-colors" />
                  <span className="hidden sm:inline">Account</span>
                  <ChevronDown className="h-3 w-3 text-white/20 group-hover/account:text-white/75 transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={12} className="w-[360px] bg-[#0c0c0c] border border-white/10 shadow-3xl rounded-2xl p-0 overflow-hidden mt-0 backdrop-blur-3xl">
                <div className="px-6 py-5 bg-white/[0.01] border-b border-white/5">
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-sans font-semibold text-white tracking-tight truncate">
                      {accountDisplayName}
                    </h3>
                    <p className="mt-1 text-[11px] font-sans text-white/42 truncate">
                      {accountEmail}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-sans font-semibold uppercase tracking-tight text-white/30">
                          Role
                        </div>
                        <div className="mt-1 text-[12px] font-sans font-medium tracking-tight text-white/78 truncate">
                          {accountRoleLabel}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-sans font-semibold uppercase tracking-tight text-white/30">
                          Member since
                        </div>
                        <div className="mt-1 text-[12px] font-sans font-medium tracking-tight text-white/78 truncate">
                          {memberSinceLabel}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-white/5 pt-3 text-[11px] font-sans tracking-tight text-white/46">
                      {connectedPlatformsCount > 0
                        ? `${connectedPlatformsCount} source${connectedPlatformsCount === 1 ? '' : 's'} connected`
                        : 'No sources connected yet'}
                    </div>
                  </div>
                </div>

                <div className="px-6 pt-4">
                  <DropdownMenuItem
                    onSelect={handleContactSupport}
                    className="flex cursor-pointer items-center gap-3 rounded-[5px] border border-white/6 bg-white/[0.02] px-4 py-3 text-white/70 outline-none transition-colors hover:bg-white/[0.045] hover:text-white focus:bg-white/[0.045] focus:text-white"
                  >
                    <Mail className="h-4 w-4 text-white/35" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-sans font-semibold uppercase tracking-tight text-white/80">
                        Contact Us
                      </div>
                      <div className="mt-0.5 text-[10px] font-sans tracking-tight text-white/42">
                        Send a support query from this workspace.
                      </div>
                    </div>
                  </DropdownMenuItem>
                </div>

                <div className="px-6 py-5">
                  <div className="rounded-[5px] border border-white/6 bg-white/[0.02] px-4 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10px] font-sans font-semibold uppercase tracking-tight text-white/36">
                        Amazon
                      </div>
                      <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-sans font-semibold uppercase tracking-tight text-white/62">
                        {amazonStatusLabel}
                      </div>
                    </div>
                    <div className="mt-3 min-w-0">
                      <div className="text-[13px] font-sans font-semibold tracking-tight text-white">
                        {amazonConnectionHeadline}
                      </div>
                      <p className="mt-1.5 text-[11px] font-sans leading-[1.5] text-white/56">
                        {userProfile?.amazon_connected
                          ? (userProfile?.amazon_display_name || 'Margin can keep your Amazon records up to date.')
                          : 'Connect Amazon to keep your records up to date.'}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(tenantRoute(activeTenantSlug, '/integrations-hub'))}
                      className="mt-3 text-[10px] font-sans font-semibold uppercase tracking-tight text-white/60 transition-colors hover:text-white"
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

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { ArrowUpDown, ChevronDown, Search, Gift, Link2, Mail, Copy, Check, X, FileText, Package, DollarSign, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useLocation, useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NotificationBell } from './NotificationBell';
interface NavbarProps {
  className?: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  forceTransparent?: boolean;
}

// Quick search result type
interface QuickSearchResult {
  id: string;
  type: 'document' | 'claim' | 'product' | 'invoice';
  title: string;
  subtitle: string;
  path: string;
}

export function Navbar({
  className,
  sidebarCollapsed = false,
  onToggleSidebar,
  forceTransparent
}: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
    location.pathname.startsWith('/recoveries');

  // State for referral popup
  const [showReferralPopup, setShowReferralPopup] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Generate referral link (placeholder - in production this would come from backend)
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/signup?ref=demo-user`
    : '/signup?ref=demo-user';

  // Create a shortened display version of the link
  const getShortLink = (link: string) => {
    try {
      const url = new URL(link);
      // Extract just the domain and path, remove protocol
      const domain = url.hostname.replace('www.', '');
      const path = url.pathname + url.search;
      // If domain is very long, show just the essential part
      if (domain.length > 20) {
        return `...${domain.slice(-15)}${path}`;
      }
      return `${domain}${path}`;
    } catch {
      // Fallback if URL parsing fails
      return link.length > 30 ? `...${link.slice(-25)}` : link;
    }
  };

  const shortLink = getShortLink(referralLink);

  // Handle search submission
  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    // Save to recent searches
    const updatedRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));

    // Navigate to appropriate search page based on context
    setIsSearchFocused(false);

    // Search in Evidence Locker for documents
    if (query.toLowerCase().includes('invoice') || query.toLowerCase().includes('doc') || query.toLowerCase().includes('receipt')) {
      navigate(`/evidence-locker?q=${encodeURIComponent(query)}`);
    }
    // Search in Recoveries for claims
    else if (query.toLowerCase().includes('claim') || query.toLowerCase().includes('recovery') || query.toLowerCase().includes('fba')) {
      navigate(`/recoveries?q=${encodeURIComponent(query)}`);
    }
    // Default: search in Recoveries (main page for searching claims)
    else {
      navigate(`/recoveries?q=${encodeURIComponent(query)}`);
    }
  }, [navigate, recentSearches]);

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
  return <header className={cn(
    "sticky top-0 z-30 transition-all duration-300",
    sidebarCollapsed ? "ml-16" : "ml-60",
    isGreyBgPage ? "bg-gray-50 border-b border-gray-200" :
      isTransparent ? "!bg-transparent !border-transparent backdrop-blur-none shadow-none" : "bg-background/60 backdrop-blur-sm border-b",
    className
  )}>
    <div className="container flex items-center h-16 px-4 font-body">
      {/* Center - Search */}
      <div className="flex-1 max-w-xl hidden md:block md:mx-4">
        <div className="relative flex items-center gap-2" ref={searchContainerRef}>
          <div className="relative flex-1">
            <Search className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 stroke-[2]',
              isDashboard ? 'text-gray-400' : (isTransparent ? 'text-gray-400' : 'text-gray-600')
            )} />
            <Input
              ref={searchInputRef}
              aria-label="Search"
              placeholder="search invoices, products, documents, and more"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={handleKeyDown}
              variant={isTransparent ? 'dark' : 'default'}
              className={cn(
                "pl-9 pr-8 h-9 rounded-md",
                isDashboard && "!bg-white/5 !border-gray-300 !text-gray-200 !placeholder:text-gray-400 backdrop-blur-sm",
                isTransparent && !isDashboard && "!bg-white/10 !border-gray-300 !text-gray-200 !placeholder:text-gray-400 backdrop-blur-sm",
                !isDashboard && !isTransparent && "!border-gray-300"
              )}
            />
            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Search Dropdown */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="p-2 border-b border-gray-100">
                    <div className="flex items-center justify-between px-2 mb-1">
                      <span className="text-xs font-medium text-gray-500">Recent Searches</span>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
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
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded"
                      >
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {search}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Links */}
                <div className="p-2">
                  <span className="text-xs font-medium text-gray-500 px-2">Quick Links</span>
                  {quickLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => {
                        setIsSearchFocused(false);
                        navigate(link.path);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded mt-1"
                    >
                      <link.icon className="h-4 w-4 text-gray-400" />
                      {link.label}
                    </button>
                  ))}
                </div>

                {/* Search Tip */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600 font-mono">Enter</kbd> to search
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* Message icon - visible on all pages */}
          <NotificationBell
            label="Messages"
            iconOverride={Mail}
            showLabel={false}
            className={cn(
              "group h-9 w-9 flex items-center justify-center rounded-md transition-colors",
              isDashboard
                ? "text-[#36454F] hover:text-[#36454F] hover:bg-gray-100"
                : isTransparent
                  ? "text-[#36454F] hover:text-[#36454F] hover:bg-white/10"
                  : "text-[#36454F] hover:text-[#36454F] hover:bg-muted/50"
            )}
            iconClassName={cn(
              "text-[#36454F]"
            )}
          />
          {/* Gift icon - only on dashboard */}
          {isDashboard && (
            <button
              onClick={() => setShowReferralPopup(true)}
              className="flex items-center gap-2 h-9 px-3 rounded-md text-[#36454F] hover:text-[#36454F] hover:bg-gray-100 transition-colors"
              aria-label="Referral program"
            >
              <Gift className="h-5 w-5 text-[#36454F]" />
            </button>
          )}
        </div>
      </div>
      {/* Right side - Connect Platform button and Sandbox badge */}
      <div className="flex items-center gap-4 ml-auto">
        <Button
          onClick={() => navigate('/integrations-hub')}
          variant="ghost"
          className={cn(
            "flex items-center gap-2 h-9 px-3",
            isDashboard ? 'bg-transparent text-[#36454F] hover:bg-white/10 hover:text-[#36454F]' :
              isTransparent ? 'text-[#36454F] hover:text-[#36454F] hover:bg-white/10' : 'text-[#36454F] hover:text-[#36454F]'
          )}
        >
          <Link2 className={cn("h-4 w-4 text-[#36454F]")} />
          <span className="hidden sm:inline text-[#36454F]">Connect</span>
        </Button>
        {isSandbox && (
          <span className={cn(
            'text-xs px-2 py-0.5 rounded border',
            isTransparent ? 'border-amber-300/30 text-amber-200 bg-amber-500/10' : 'border-amber-600/30 text-amber-700 bg-amber-50'
          )}>
            Sandbox
          </span>
        )}
        {/* Language selector removed */}
      </div>
    </div>

    {/* Referral Popup */}
    <Dialog open={showReferralPopup} onOpenChange={setShowReferralPopup}>
      <DialogContent className="max-w-sm bg-emerald-50/95 border border-emerald-200/80 shadow-lg rounded-lg p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100">
            <Gift className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-emerald-900">
              No commission on referrals
            </h3>
            <p className="text-sm text-emerald-700">
              Bring new sellers to Clario and keep 100% of their recovered funds.
            </p>
          </div>
          <Button
            onClick={() => {
              setShowReferralPopup(false);
              setShowInviteForm(true);
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-md transition-colors shadow-md hover:shadow-lg"
          >
            Invite seller friend
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Invite Form Popup */}
    <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
      <DialogContent className="max-w-md bg-white border border-gray-200 shadow-lg rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Invite seller friend</h3>
            <p className="text-sm text-gray-600">Send an invitation to join Clario</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email address</label>
            <Input
              type="email"
              placeholder="seller@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full border-gray-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Referral link</label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <span className="flex-1 text-sm text-gray-700 break-all">{shortLink}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                {linkCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <Button
            onClick={() => {
              // TODO: Implement send invite functionality
              setShowInviteForm(false);
              setInviteEmail('');
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          >
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </header>;
}
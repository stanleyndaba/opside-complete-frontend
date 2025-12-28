import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { ArrowUpDown, ChevronDown, Search, Gift, Link2, Mail, Copy, Check, X, FileText, Package, DollarSign, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useLocation, useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NotificationBell } from './NotificationBell';
import { useCurrency, currencies } from '@/components/providers/CurrencyProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

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
  return (
    <>
      <header className={cn(
        "sticky top-0 z-30 transition-all duration-200",
        sidebarCollapsed ? "ml-16" : "ml-60",
        isGreyBgPage ? "bg-white border-b border-gray-200" :
          isTransparent ? "bg-transparent border-transparent" : "bg-white border-b border-gray-200",
        className
      )}>
        <div className="flex items-center h-14 px-6">
          {/* Center - Search */}
          <div className="flex-1 max-w-xl hidden md:block md:mx-4">
            <div className="relative flex items-center gap-3" ref={searchContainerRef}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  aria-label="Search"
                  placeholder="Search invoices, products, documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 pr-8 h-8 text-xs bg-gray-50 border-gray-200 rounded-sm focus:bg-white focus:border-gray-300 placeholder:text-gray-400"
                />
                {/* Clear button */}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}

                {/* Search Dropdown */}
                {isSearchFocused && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-sm shadow-sm z-50 overflow-hidden">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div className="p-2 border-b border-gray-100">
                        <div className="flex items-center justify-between px-2 mb-1">
                          <span className="text-[9px] font-medium text-gray-500 uppercase tracking-[0.15em]">Recent</span>
                          <button
                            onClick={clearRecentSearches}
                            className="text-[9px] text-gray-400 hover:text-gray-600"
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
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            <Clock className="h-3 w-3 text-gray-400" />
                            {search}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick Links */}
                    <div className="p-2">
                      <span className="text-[9px] font-medium text-gray-500 uppercase tracking-[0.15em] px-2">Quick Links</span>
                      {quickLinks.map((link) => (
                        <button
                          key={link.id}
                          onClick={() => {
                            setIsSearchFocused(false);
                            navigate(link.path);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 mt-0.5"
                        >
                          <link.icon className="h-3 w-3 text-gray-400" />
                          {link.label}
                        </button>
                      ))}
                    </div>

                    {/* Search Tip */}
                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                      <p className="text-[9px] text-gray-500">
                        Press <kbd className="px-1 py-0.5 bg-gray-200 rounded-sm text-gray-600 font-mono text-[8px]">Enter</kbd> to search
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {/* Message icon */}
              <NotificationBell
                label="Messages"
                iconOverride={Mail}
                showLabel={false}
                className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
                iconClassName="h-4 w-4"
              />
              {/* Gift icon */}
              <button
                onClick={() => setShowReferralPopup(true)}
                className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-sm transition-colors relative"
                aria-label="Referral program"
              >
                <Gift className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-gray-900 rounded-full" />
              </button>
            </div>
          </div>
          {/* Right side - Currency and Connect */}
          <div className="flex items-center gap-1">
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="h-8 w-16 bg-transparent border-0 text-gray-600 focus:ring-0 shadow-none px-2 text-[10px] font-medium uppercase tracking-wide">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-sm">
                {currencies.map(curr => (
                  <SelectItem key={curr.code} value={curr.code} className="text-xs">
                    {curr.symbol} {curr.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="h-4 w-px bg-gray-200" />
            <button
              onClick={() => navigate('/integrations-hub')}
              className="flex items-center gap-1.5 h-8 px-3 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-sm transition-colors"
            >
              <Link2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Connect</span>
            </button>
          </div>
        </div>
      </header>

      {/* Referral Popup - Institutional Banking Design */}
      <Dialog open={showReferralPopup} onOpenChange={setShowReferralPopup}>
        <DialogContent className="max-w-sm bg-white border border-gray-200 shadow-2xl rounded-xl p-0 overflow-hidden">
          {/* Header with subtle gradient */}
          <div className="px-6 py-5 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200/50">
                <Gift className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">
                  No commission on referrals
                </h3>
                <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                  Bring new sellers to Opside and keep 100% of their recovered funds.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <div className="space-y-4">
              {/* Value Proposition */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-700">Your referrals earn</p>
                  <p className="text-[13px] font-semibold text-gray-900">100% of recovered funds</p>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => {
                  setShowReferralPopup(false);
                  setShowInviteForm(true);
                }}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white text-[13px] h-11 font-medium rounded-lg shadow-sm transition-all hover:shadow-md"
              >
                Invite a seller
              </Button>

              {/* Learn more link */}
              <p className="text-center text-[11px] text-gray-400">
                Questions? <button className="text-blue-600 hover:text-blue-700 font-medium">Learn more about referrals</button>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Form Popup */}
      <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
        <DialogContent className="max-w-sm bg-white border border-gray-200 shadow-md rounded-lg p-4">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Invite seller friend</h3>
              <p className="text-[10px] text-gray-500">Send an invitation to join Opside</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Email address</label>
              <Input
                type="email"
                placeholder="seller@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full border-gray-200 h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Referral link</label>
              <div className="flex items-center gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded-md">
                <span className="flex-1 text-[10px] text-gray-700 break-all">{shortLink}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralLink);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <Button
              onClick={async () => {
                if (!inviteEmail || !inviteEmail.includes('@')) {
                  alert('Please enter a valid email address');
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
                      message: `You've been invited to join Opside! Use this link to get started: ${referralLink}`
                    })
                  });

                  const result = await response.json();

                  if (result.success) {
                    alert(`Invitation sent to ${inviteEmail}!`);
                    setShowInviteForm(false);
                    setInviteEmail('');
                  } else {
                    alert(`Failed to send invite: ${result.error || 'Unknown error'}`);
                  }
                } catch (error: any) {
                  console.error('Error sending invite:', error);
                  alert('Failed to send invite. Please try again.');
                }
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
            >
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { ArrowUpDown, ChevronDown, Search, Gift, Link2, Mail, Copy, Check, X, FileText, Package, DollarSign, Clock, NotebookPen, LogOut, User, CreditCard, Plug, Bell, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useLocation, useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { NotificationBell } from './NotificationBell';
import { useCurrency, currencies } from '@/components/providers/CurrencyProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
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
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  // State for notes feature
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState<{ id: string; text: string; createdAt: string }[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [isNoteHovered, setIsNoteHovered] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const noteIconRef = useRef<HTMLButtonElement>(null);

  // Fetch notes from backend on load
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
  }, []);

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
        <div className="flex items-center justify-between h-14 px-6">
          {/* Left/Center Group - Search, Icons, Currency, Connect */}
          <div className="flex items-center gap-x-8">
            <div className="relative flex items-center gap-4" ref={searchContainerRef}>
              <div className="relative w-80 lg:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                <Input
                  ref={searchInputRef}
                  aria-label="Search"
                  placeholder="Search invoices, products, documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-10 h-9 text-xs bg-gray-100/50 border-transparent rounded-full focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100/30 transition-all placeholder:text-gray-400"
                />
                {/* Clear button */}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
                          <span className="text-xs font-medium text-gray-500">Recent</span>
                          <button
                            onClick={clearRecentSearches}
                            className="text-xs text-gray-400 hover:text-gray-600">
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
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                            <Clock className="h-3 w-3 text-gray-400" />
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
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 mt-0.5">
                          <link.icon className="h-3 w-3 text-gray-400" />
                          {link.label}
                        </button>
                      ))}
                    </div>

                    {/* Search Tip */}
                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Press <kbd className="px-1 py-0.5 bg-gray-200 rounded-sm text-gray-600 font-mono text-xs">Enter</kbd> to search
                      </p>
                    </div>
                  </div>
                )}
              </div>


              {/* Functional Icons Group - Compact Horizontal */}
              <div className="flex items-center gap-x-1 border-l border-gray-200/60 pl-4 ml-3">
                {/* Notifications */}
                <NotificationBell
                  label="Notifications"
                  showLabel={false}
                  className="h-8 w-8 flex items-center justify-center text-gray-900 hover:bg-gray-100 rounded-md transition-all"
                  iconClassName="h-4 w-4"
                />

                {/* Notes */}
                <div className="relative">
                  <button
                    ref={noteIconRef}
                    onClick={() => setShowNotesModal(true)}
                    onMouseEnter={() => setIsNoteHovered(true)}
                    onMouseLeave={() => setIsNoteHovered(false)}
                    className="h-8 w-8 flex items-center justify-center text-gray-900 hover:bg-gray-100 rounded-md transition-all relative"
                    aria-label="Notes">
                    <NotebookPen className="h-4 w-4" />
                    {notes.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-gray-300 rounded-full" />
                    )}
                  </button>

                  {/* Hover tooltip showing recent notes */}
                  {isNoteHovered && notes.length > 0 && (
                    <div className="absolute top-full right-1/2 translate-x-1/2 mt-2 w-72 bg-white border border-gray-200 rounded-none shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-900">External REC</span>
                        <span className="text-xs text-gray-400 font-mono">{notes.length} REC</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                        {notes.slice(0, 5).map((note, index) => (
                          <div key={note.id} className="group relative p-4 hover:bg-gray-50/50 transition-colors">
                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-xs text-gray-700 font-mono tracking-tight line-clamp-3 leading-relaxed">{note.text}</p>
                            <p className="text-xs text-gray-400 mt-2 font-mono flex items-center justify-between">
                              <span>TS.{new Date(note.createdAt).getTime().toString().slice(-8)}</span>
                              <span>{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Referral */}
                <HoverCard openDelay={100} closeDelay={200}>
                  <HoverCardTrigger asChild>
                    <button
                      onClick={() => setShowReferralPopup(true)}
                      className="h-8 w-8 flex items-center justify-center text-gray-900 hover:bg-gray-100 rounded-md transition-all relative"
                      aria-label="Referral program">
                      <Gift className="h-4 w-4" />
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="bottom"
                    align="center"
                    className="w-72 p-0 bg-white border border-gray-200 shadow-2xl rounded-sm overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                          <Gift className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-emerald-600">Limited Offer</span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Referral</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Sellers that invite sellers to Margin secure <span className="font-bold text-emerald-600">100% of their recovered funds</span> without commission deductions.
                      </p>
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">Click to learn more</span>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>

              {/* Connect Button */}
              <div className="flex items-center border-l border-gray-200/60 pl-4 ml-1">
                <button
                  onClick={() => navigate('/integrations-hub')}
                  className="flex items-center gap-1.5 h-8 px-3 text-xs text-gray-900 hover:bg-gray-100 rounded-md transition-all font-medium border border-gray-200/60">
                  <Link2 className="h-3.5 w-3.5 text-gray-900" />
                  <span className="hidden sm:inline">Connect</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Group - Account Dropdown */}
          <div className="flex items-center border-l border-gray-100 pl-6 ml-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 h-8 px-3 text-xs text-gray-900 bg-gray-100/60 hover:bg-gray-100 rounded-md transition-colors group/account">
                  <User className="h-3.5 w-3.5 text-gray-900" />
                  <span className="hidden sm:inline font-medium">Account</span>
                  <ChevronDown className="h-3 w-3 text-gray-900" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg rounded-sm p-1">
                <DropdownMenuItem
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer rounded-sm">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  <span>Seller Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/settings?tab=billing')}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer rounded-sm">
                  <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/integrations-hub')}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer rounded-sm">
                  <Plug className="h-3.5 w-3.5 text-gray-400" />
                  <span>Integrations</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/settings?tab=notifications')}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer rounded-sm">
                  <Bell className="h-3.5 w-3.5 text-gray-400" />
                  <span>Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/settings?tab=security')}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer rounded-sm">
                  <Shield className="h-3.5 w-3.5 text-gray-400" />
                  <span>Security</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Referral Popup - Institutional Style */}
      <Dialog open={showReferralPopup} onOpenChange={setShowReferralPopup}>
        <DialogContent className="max-w-sm bg-white border border-gray-200 shadow-2xl rounded-none p-0 overflow-hidden">
          {/* Header - Institutional Dark */}
          <div className="px-6 py-5 border-b border-gray-900 bg-gray-900">
            <h3 className="text-xs font-bold text-white">
              Referral
            </h3>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              COMMISSION-FREE NETWORK EXPANSION
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  PROVISION: Bring new sellers to Margin and secure 100% of their recovered funds without commission deductions.
                </p>

                {/* Value Proposition */}
                <div className="p-4 bg-gray-50/50 border border-gray-100 relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-900" />
                  <p className="text-xs text-gray-400 font-mono mb-1">NETWORK BENEFIT</p>
                  <p className="text-[13px] font-bold text-gray-900 tracking-tight">100% OF RECOVERED FUNDS</p>
                </div>
              </div>

              {/* Action */}
              <Button
                onClick={() => {
                  setShowReferralPopup(false);
                  setShowInviteForm(true);
                }}
                className="w-full bg-gray-900 hover:bg-black text-white text-xs h-10 font-bold rounded-none transition-all">
                Initiate Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Form Popup - Institutional style */}
      <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
        <DialogContent className="max-w-md bg-white border border-gray-200 shadow-2xl rounded-none p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-xs font-bold text-gray-900">Transmit Invitation</h3>
            <p className="text-xs text-gray-400 mt-1 font-mono">Target: External Seller Alliance</p>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 mb-1 block">Recipient Email</label>
              <Input
                type="email"
                placeholder="SELLER@ENTITY.COM"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full border-gray-100 h-10 text-sm font-mono rounded-none bg-gray-50/50 focus:bg-white focus:border-gray-900 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 mb-1 block">Authentication Link</label>
              <div className="flex items-center gap-0 p-3 bg-gray-50/50 border border-gray-100 rounded-none group hover:border-gray-200 transition-all">
                <span className="flex-1 text-xs text-gray-500 font-mono break-all truncate overflow-hidden">{shortLink}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralLink);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors shrink-0">
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
                  alert('Verification Failure: Invalid Email Address');
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
                      message: `You've been invited to join Margin! Use this link to get started: ${referralLink}`
                    })
                  });

                  const result = await response.json();

                  if (result.success) {
                    alert(`Transmission Successful: Invite dispatched to ${inviteEmail}`);
                    setShowInviteForm(false);
                    setInviteEmail('');
                  } else {
                    alert(`Transmission Failure: ${result.error || 'Unknown Error State'}`);
                  }
                } catch (error: any) {
                  console.error('Transmission processing error:', error);
                  alert('Internal Connection Failure');
                }
              }}
              className="w-full bg-gray-900 hover:bg-black text-white text-xs h-10 font-bold rounded-none transition-all">
              Execute Transmission
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes Modal - Institutional Style */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent className="max-w-md bg-white border border-gray-200 shadow-2xl rounded-none p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-6 py-5 border-b border-gray-900 bg-gray-900">
            <h3 className="text-xs font-bold text-white">
              Note Ingestion
            </h3>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              Internal Logs
            </p>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-hide">
            {/* Add new note */}
            <div className="space-y-3">
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="INPUT TECHNICAL DATA OR REMINDERS HERE..."
                className="w-full h-32 p-4 text-sm border border-gray-100 rounded-none resize-none focus:outline-none focus:border-gray-900 bg-gray-50/50 focus:bg-white font-mono leading-relaxed transition-all"
              />
              <Button
                onClick={async () => {
                  if (!currentNote.trim() || isSavingNote) return;
                  setIsSavingNote(true);
                  try {
                    const response = await api.createNote(currentNote.trim());
                    if (response.ok && response.data?.success) {
                      const newNote = {
                        id: response.data.data.id,
                        text: response.data.data.content,
                        createdAt: response.data.data.created_at
                      };
                      setNotes([newNote, ...notes]);
                      setCurrentNote('');
                    } else {
                      console.error('Failed to save note:', response.error);
                    }
                  } catch (error) {
                    console.error('Failed to save note:', error);
                  } finally {
                    setIsSavingNote(false);
                  }
                }}
                className="w-full bg-gray-900 hover:bg-black text-white text-xs h-10 font-bold rounded-none transition-all"
                disabled={!currentNote.trim() || isSavingNote}>
                {isSavingNote ? 'Processing...' : 'Ingest Note Record'}
              </Button>
            </div>

            {/* Notes list */}
            {notes.length > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-400">Stored REC</span>
                  <span className="text-xs font-mono text-gray-400">VOL.{notes.length}</span>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                  {notes.map((note) => (
                    <div key={note.id} className="group relative p-4 bg-gray-50/50 border border-gray-100 rounded-none transition-all hover:bg-white hover:border-gray-200">
                      <div className="absolute left-[-1px] top-[-1px] bottom-[-1px] w-[3px] bg-gray-900 opacity-0 group-hover:opacity-100 transition-opacity" />

                      {editingNoteId === note.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editingNoteContent}
                            onChange={(e) => setEditingNoteContent(e.target.value)}
                            className="w-full h-24 p-3 text-sm border border-gray-200 rounded-none resize-none focus:outline-none focus:border-gray-900 bg-white font-mono"
                            autoFocus
                          />
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="text-xs text-gray-400 hover:text-gray-900 font-bold transition-colors">
                              Discard
                            </button>
                            <button
                              onClick={async () => {
                                if (!editingNoteContent.trim() || editingNoteContent === note.text || isSavingNote) {
                                  if (!isSavingNote) setEditingNoteId(null);
                                  return;
                                }
                                setIsSavingNote(true);
                                try {
                                  const response = await api.updateNote(note.id, editingNoteContent.trim());
                                  if (response.ok && response.data?.success) {
                                    setNotes(notes.map(n => n.id === note.id ? {
                                      ...n,
                                      text: response.data.data.content,
                                      createdAt: response.data.data.updated_at
                                    } : n));
                                    setEditingNoteId(null);
                                  }
                                } catch (error) {
                                  console.error('Failed to update note:', error);
                                } finally {
                                  setIsSavingNote(false);
                                }
                              }}
                              className="text-xs text-gray-900 hover:text-black font-bold disabled:opacity-50"
                              disabled={isSavingNote}>
                              {isSavingNote ? 'Syncing...' : 'Confirm Change'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 group-hover:bg-gray-900" />
                              <span className="text-xs text-gray-400 font-mono">RECORD.{note.id.substring(0, 8).toUpperCase()}</span>
                            </div>
                            <span className="text-xs text-gray-400 font-mono">{new Date(note.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}</span>
                          </div>
                          <p className="text-sm text-gray-700 font-mono leading-relaxed mb-3">{note.text}</p>
                          <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <button
                              onClick={() => {
                                setEditingNoteId(note.id);
                                setEditingNoteContent(note.text);
                              }}
                              className="text-xs font-bold text-gray-400 hover:text-gray-900">
                              Modify
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const response = await api.deleteNote(note.id);
                                  if (response.ok) {
                                    setNotes(notes.filter(n => n.id !== note.id));
                                  }
                                } catch (error) {
                                  console.error('Failed to delete note:', error);
                                }
                              }}
                              className="text-xs font-bold text-gray-400 hover:text-red-600">
                              Purge
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {notes.length === 0 && (
              <div className="text-center py-6">
                <NotebookPen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No notes yet. Start by adding one above.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Out Confirmation Modal */}
      <Dialog open={showSignOutModal} onOpenChange={setShowSignOutModal}>
        <DialogContent className="max-w-sm bg-white border border-gray-200 shadow-2xl rounded-none p-0 overflow-hidden">
          <div className="p-8 text-center">
            {/* Icon */}
            <div className="w-12 h-12 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <LogOut className="h-5 w-5 text-gray-500" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Leaving already?
            </h3>

            {/* Body */}
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              Your account is still being monitored for new recovery opportunities.
              You can sign back in anytime to see updates.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={async () => {
                  setShowSignOutModal(false);
                  try { await api.logout(); } catch (_) { }
                  window.location.href = '/';
                }}
                className="w-full bg-gray-900 hover:bg-black text-white text-xs h-10 font-medium rounded-sm transition-all">
                Sign Out
              </Button>
              <button
                onClick={() => setShowSignOutModal(false)}
                className="w-full text-xs text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors">
                Stay signed in
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

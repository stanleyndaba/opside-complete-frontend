import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { ArrowUpDown, ChevronDown, Search, Link2, Mail, Copy, Check, X, FileText, Package, DollarSign, Clock, NotebookPen, LogOut, User, CreditCard, Plug, Bell, Shield, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { tenantRoute } from '@/lib/routes';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { NotificationBell } from './NotificationBell';
import { useCurrency, currencies } from '@/components/providers/CurrencyProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { StoreSelector } from './StoreSelector';
import { motion, AnimatePresence } from 'framer-motion';
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

  const { tenantSlug } = useParams<{ tenantSlug: string }>();
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
      navigate(tenantRoute(tenantSlug || 'default', `/evidence-locker?q=${encodeURIComponent(query)}`));
    }
    // Search in Recoveries for claims
    else if (query.toLowerCase().includes('claim') || query.toLowerCase().includes('recovery') || query.toLowerCase().includes('fba')) {
      navigate(tenantRoute(tenantSlug || 'default', `/recoveries?q=${encodeURIComponent(query)}`));
    }
    // Default: search in Recoveries (main page for searching claims)
    else {
      navigate(tenantRoute(tenantSlug || 'default', `/recoveries?q=${encodeURIComponent(query)}`));
    }
  }, [navigate, recentSearches, tenantSlug]);

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
        "sticky top-0 z-30 transition-all duration-500 ease-in-out font-serif",
        sidebarCollapsed ? "ml-20" : "ml-64",
        "bg-[#070707]/90 border-b border-white/5 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]",
        className
      )}>
        <div className="flex items-center justify-between h-14 px-6">
          {/* Left/Center Group - Search, Icons, Currency, Connect */}
          <div className="flex items-center gap-x-8">
            <div className="relative flex items-center gap-4" ref={searchContainerRef}>
              <div className="relative w-80 lg:w-[420px] group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  ref={searchInputRef}
                  aria-label="Search"
                  placeholder="Search documents or claims..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-10 h-10 text-[11px] bg-white/[0.03] border-white/5 rounded-xl focus:bg-white/[0.05] focus:border-emerald-500/30 focus:ring-0 transition-all placeholder:text-white/10 font-mono tracking-tight text-emerald-500"
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
                          <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">Recent searches</span>
                          <button
                            onClick={clearRecentSearches}
                            className="text-[10px] font-mono text-emerald-500/50 hover:text-emerald-500 uppercase tracking-wider transition-colors">
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
                            className="w-full flex items-center gap-3 px-3 py-2 text-[11px] text-white/40 hover:bg-white/[0.03] hover:text-white transition-all font-mono uppercase tracking-tight group">
                            <Clock className="h-3 w-3 text-white/10 group-hover:text-emerald-500" />
                            {search}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick Access */}
                    <div className="p-3">
                      <span className="text-[10px] font-mono font-bold text-white/20 px-2 uppercase tracking-widest block mb-2">Quick links</span>
                      {quickLinks.map((link) => (
                        <button
                          key={link.id}
                          onClick={() => {
                            setIsSearchFocused(false);
                            navigate(tenantRoute(tenantSlug || 'default', link.path));
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-[11px] text-white/40 hover:bg-white/[0.03] hover:text-white transition-all font-mono uppercase tracking-tight group">
                          <link.icon className="h-3 w-3 text-white/10 group-hover:text-emerald-500" />
                          {link.label}
                        </button>
                      ))}
                    </div>

                    {/* Search Tip */}
                    <div className="px-4 py-3 bg-white/[0.01] border-t border-white/5">
                      <p className="text-[9px] text-white/20 font-mono uppercase tracking-widest">
                        Invoke system command with <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-emerald-500 font-mono text-[9px]">ENTER</kbd>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <StoreSelector />

              {/* Functional Icons Group - Compact Horizontal */}
              <div className="flex items-center gap-x-3 border-l border-white/5 pl-4 ml-3">
                {/* Notifications */}
                <NotificationBell
                  label="Alert"
                  showLabel={false}
                  className="h-10 w-10 flex items-center justify-center text-white/40 hover:bg-white/[0.03] rounded-xl border border-transparent hover:border-white/5 transition-all"
                  iconClassName="h-4.5 w-4.5"
                />

                {/* Notes */}
                <div className="relative">
                  <button
                    ref={noteIconRef}
                    onClick={() => setShowNotesModal(true)}
                    onMouseEnter={() => setIsNoteHovered(true)}
                    onMouseLeave={() => setIsNoteHovered(false)}
                    className="h-10 w-10 flex items-center justify-center text-white/40 hover:bg-white/[0.03] rounded-xl border border-transparent hover:border-white/5 transition-all relative"
                    aria-label="Notes">
                    <NotebookPen className="h-4.5 w-4.5" />
                    {notes.length > 0 && (
                      <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    )}
                  </button>

                  {/* Hover tooltip showing recent notes */}
                  <AnimatePresence>
                    {isNoteHovered && notes.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-3 w-[280px] bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-3xl z-50 overflow-hidden backdrop-blur-3xl">
                        <div className="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                          <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">Recent notes</span>
                          <span className="text-[9px] font-mono text-emerald-500/50 uppercase tracking-widest">{notes.length} total</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-white/5 scrollbar-hide">
                          {notes.slice(0, 5).map((note) => (
                            <div key={note.id} className="group relative p-5 hover:bg-white/[0.02] transition-all">
                              <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <p className="text-[11px] text-white/40 font-serif tracking-tight line-clamp-3 leading-relaxed group-hover:text-white/60">{note.text}</p>
                              <div className="text-[9px] text-white/10 mt-3 font-mono flex items-center justify-between uppercase tracking-widest">
                                <span>ID.{note.id.substring(0, 6)}</span>
                                <span>{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Store Connection */}
                <HoverCard openDelay={100} closeDelay={200}>
                  <HoverCardTrigger asChild>
                    <button
                      onClick={() => navigate(tenantRoute(tenantSlug || 'default', '/integrations-hub'))}
                      className="h-10 w-10 flex items-center justify-center text-white/40 hover:bg-white/[0.03] rounded-xl border border-transparent hover:border-white/5 transition-all relative"
                      aria-label="Store connections">
                      <Store className="h-4.5 w-4.5" />
                      <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-emerald-500/30 rounded-full" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="bottom"
                    align="center"
                    sideOffset={12}
                    className="w-72 p-0 bg-[#0c0c0c] border border-white/10 shadow-3xl rounded-2xl overflow-hidden backdrop-blur-3xl">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <Store className="h-4 w-4 text-emerald-500" />
                        </div>
                        <span className="text-[11px] font-serif font-bold text-white uppercase tracking-widest">Store Setup</span>
                      </div>
                      <h4 className="text-[13px] font-serif font-medium text-white mb-2 uppercase tracking-tight">Connections</h4>
                      <p className="text-[11px] text-white/40 leading-relaxed font-serif italic">
                        "Consolidate institutional data flows from Amazon, Shopify, or Walmart to maximize multi-vector recoveries."
                      </p>
                      <div className="mt-6">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            navigate(tenantRoute(tenantSlug || 'default', '/integrations-hub'));
                          }}
                          className="w-full h-10 border border-emerald-500/20 bg-emerald-500/[0.02] hover:bg-emerald-500/10 hover:border-emerald-500/50 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-widest transition-all rounded-xl">
                          Manage connections
                        </Button>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
          </div>

          {/* Right Group - Connect & Account */}
          <div className="flex items-center gap-x-6 border-l border-white/5 pl-6 ml-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 text-[11px] text-white/60 hover:text-white transition-all font-serif group/account uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/5">
                  <User className="h-4 w-4 text-white/20 group-hover/account:text-emerald-500 transition-colors" />
                  <span className="hidden sm:inline font-medium">Account</span>
                  <ChevronDown className="h-3 w-3 text-white/20 group-hover/account:text-emerald-500 transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={12} className="w-80 bg-[#0c0c0c] border border-white/10 shadow-3xl rounded-2xl p-0 overflow-hidden mt-0 backdrop-blur-3xl">
                {/* Connection Status Header - Institutional */}
                <div className="px-6 py-5 bg-white/[0.01] border-b border-white/5">
                  <h3 className="text-[12px] font-serif font-bold text-white uppercase tracking-[0.2em]">Amazon Profile</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    </div>
                    <p className="text-[10px] text-emerald-500/50 font-mono uppercase tracking-[0.2em]">Connected</p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Compact Data Grid */}
                  <div className="grid grid-cols-1 gap-y-4">
                    {[
                      { label: 'Account ID', value: 'Not available' },
                      { label: 'Primary System', value: 'Main Seller Account' },
                      { label: 'Verified Status', value: 'ID_NOT_MAPPED' },
                      { label: 'Monitoring', value: 'Active Monitoring' },
                      { label: 'Support Channel', value: 'Opside Secure Support' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 group/item">
                        <span className="text-[10px] font-mono font-bold text-white/20 group-hover/item:text-white/40 transition-colors uppercase tracking-widest shrink-0">
                          {item.label}
                        </span>
                        <span className={cn(
                          "text-[10px] font-mono transition-colors text-right truncate uppercase tracking-tighter",
                          item.value.includes('_') || item.value === 'Not available' ? "text-emerald-500/30" : "text-white/60 group-hover/item:text-white"
                        )}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Sign Out Action - Compact */}
                  <div className="pt-5 border-t border-white/5 mt-2">
                    <button
                      onClick={() => setShowSignOutModal(true)}
                      className="w-full flex items-center justify-between text-[10px] font-serif font-bold text-white/20 hover:text-rose-500 transition-all group/logout uppercase tracking-[0.3em]">
                      <span>Sign out</span>
                      <LogOut className="h-4 w-4 group-hover/logout:translate-x-1 transition-transform opacity-20 group-hover/logout:opacity-100" />
                    </button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>


      {/* Notes Modal - Institutional Style */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent className="max-w-[520px] bg-[#0c0c0c] border border-white/10 p-0 gap-0 overflow-hidden shadow-3xl rounded-2xl backdrop-blur-3xl flex flex-col max-h-[85vh]">
          {/* Header - Institutional Dark */}
          <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01]">
            <h3 className="text-[14px] font-serif font-bold text-white uppercase tracking-[0.2em]">
              Notes
            </h3>
            <p className="text-[10px] text-white/20 mt-2 font-mono uppercase tracking-[0.1em]">
              Private records and manual entries
            </p>
          </div>

          <div className="p-8 space-y-8 overflow-y-auto flex-1 scrollbar-hide">
            {/* Add new note - Technical Command Input */}
            <div className="space-y-4">
              <label className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.3em]">Command_Payload</label>
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="PROMPT: Input manual audit data, transaction anomalies, or case notes..."
                className="w-full h-32 bg-white/[0.03] border-white/10 rounded-xl p-5 text-[12px] text-white/60 placeholder:text-white/10 focus:ring-0 focus:border-emerald-500/30 transition-all font-serif resize-none leading-relaxed"
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
                    }
                  } catch (error) {
                    console.error('Failed to save note:', error);
                  } finally {
                    setIsSavingNote(false);
                  }
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-serif font-bold h-11 transition-all uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                disabled={!currentNote.trim() || isSavingNote}>
                {isSavingNote ? 'Saving...' : 'Save Note'}
              </Button>
            </div>

            {/* Notes list - High Density Records */}
            {notes.length > 0 && (
              <div className="border-t border-white/5 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.3em]">Saved notes</span>
                  <span className="text-[9px] font-mono text-emerald-500/50 uppercase tracking-widest">Items: {notes.length}</span>
                </div>
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="group relative p-6 bg-white/[0.01] border border-white/5 rounded-xl transition-all hover:bg-white/[0.03] hover:border-white/10">
                      <div className="absolute left-0 top-4 bottom-4 w-[2px] bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                      {editingNoteId === note.id ? (
                        <div className="space-y-4">
                          <textarea
                            value={editingNoteContent}
                            onChange={(e) => setEditingNoteContent(e.target.value)}
                            className="w-full h-28 p-4 bg-white/[0.04] border border-white/10 rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/30 font-serif leading-relaxed"
                            autoFocus
                          />
                          <div className="flex justify-end gap-4">
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="text-[10px] font-mono text-white/20 hover:text-white uppercase tracking-widest transition-colors">
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
                              className="text-[10px] font-serif font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors disabled:opacity-50"
                              disabled={isSavingNote}>
                              {isSavingNote ? 'Syncing...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-emerald-500/50 group-hover:bg-emerald-500" />
                              <span className="text-[10px] text-white/20 font-mono uppercase tracking-tighter">REC_ID.{note.id.substring(0, 8).toUpperCase()}</span>
                            </div>
                            <span className="text-[9px] text-white/20 font-mono uppercase">{new Date(note.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}</span>
                          </div>
                          <p className="text-[11px] text-white/60 font-serif italic leading-relaxed group-hover:text-white/80 transition-colors">{note.text}</p>
                          <div className="flex items-center justify-end gap-6 mt-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                            <button
                              onClick={() => {
                                setEditingNoteId(note.id);
                                setEditingNoteContent(note.text);
                              }}
                              className="text-[10px] font-mono text-white/20 hover:text-white uppercase tracking-widest">
                              Edit
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
                              className="text-[10px] font-mono text-white/10 hover:text-rose-500 uppercase tracking-widest">
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {notes.length === 0 && !isSavingNote && (
              <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl">
                <NotebookPen className="h-10 w-10 text-white/10 mx-auto mb-4" />
                <p className="text-[11px] text-white/20 font-serif italic">"No manual artefacts detected in local memory."</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Out Confirmation Modal */}
      <Dialog open={showSignOutModal} onOpenChange={setShowSignOutModal}>
        <DialogContent className="sm:max-w-[420px] bg-[#0c0c0c] border border-white/10 p-0 gap-0 overflow-hidden shadow-3xl rounded-2xl backdrop-blur-3xl">
          <DialogHeader className="px-8 pt-10 pb-6 text-center">
            <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
              <LogOut className="h-8 w-8 text-rose-500" />
            </div>
            <DialogTitle className="text-[16px] font-serif font-bold text-white uppercase tracking-[0.2em]">Sign out?</DialogTitle>
            <DialogDescription className="text-[12px] text-white/40 mt-4 font-serif italic leading-relaxed max-w-[280px] mx-auto">
              "Margin core continues to monitor your assets and recover funds 24/7. Re-authorize anytime to audit recent anomalies."
            </DialogDescription>
          </DialogHeader>

          <div className="px-8 pb-10 pt-2 flex flex-col gap-3">
            <Button
              onClick={async () => {
                setShowSignOutModal(false);
                try { await api.logout(); } catch (_) { }
                window.location.href = '/';
              }}
              className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-serif font-bold transition-all uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.1)]">
              SIGN OUT
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowSignOutModal(false)}
              className="w-full h-12 text-[10px] font-mono text-white/20 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

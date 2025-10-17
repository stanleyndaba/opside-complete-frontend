import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Link, useLocation } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
interface NavbarProps {
  className?: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  forceTransparent?: boolean;
}
export function Navbar({
  className,
  sidebarCollapsed = false,
  onToggleSidebar,
  forceTransparent
}: NavbarProps) {
  const location = useLocation();
  const pathTransparent =
    location.pathname === '/' ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/careers') ||
    location.pathname.startsWith('/api-access') ||
    location.pathname.startsWith('/billing') ||
    location.pathname.startsWith('/evidence-locker') ||
    location.pathname.startsWith('/integrations-hub') ||
    location.pathname.startsWith('/app') ||
    location.pathname.startsWith('/recoveries') ||
    location.pathname.startsWith('/reports') ||
    location.pathname.startsWith('/whats-new') ||
    location.pathname.startsWith('/help') ||
    location.pathname.startsWith('/auth');
  const isTransparent = !!forceTransparent || pathTransparent;

  type LanguageOption = {
    code: string;
    country: string;
    language: string;
    flag: string;
  };

  const LANGUAGE_OPTIONS: LanguageOption[] = [
    { code: 'us-en', country: 'USA', language: 'English', flag: '🇺🇸' },
    { code: 'ca-en', country: 'Canada', language: 'English', flag: '🇨🇦' },
    { code: 'ca-fr', country: 'Canada', language: 'Français', flag: '🇨🇦' },
    { code: 'gb-en', country: 'United Kingdom', language: 'English', flag: '🇬🇧' },
    { code: 'au-en', country: 'Australia', language: 'English', flag: '🇦🇺' },
    { code: 'de-de', country: 'Germany', language: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr-fr', country: 'France', language: 'Français', flag: '🇫🇷' },
    { code: 'es-es', country: 'Spain', language: 'Español', flag: '🇪🇸' },
    { code: 'it-it', country: 'Italy', language: 'Italiano', flag: '🇮🇹' },
    { code: 'nl-nl', country: 'Netherlands', language: 'Nederlands', flag: '🇳🇱' },
  ];

  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('clario.langPreference') || 'us-en' : 'us-en'
  );

  useEffect(() => {
    try {
      localStorage.setItem('clario.langPreference', selectedLanguageCode);
    } catch {}
  }, [selectedLanguageCode]);

  const selectedLanguage = useMemo<LanguageOption>(() => {
    return LANGUAGE_OPTIONS.find((o) => o.code === selectedLanguageCode) || LANGUAGE_OPTIONS[0];
  }, [selectedLanguageCode]);

  // Sandbox badge: show in non-production or when VITE_SANDBOX=true
  const env: any = (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined) || (typeof process !== 'undefined' ? (process as any).env : undefined) || {};
  const isSandbox = String(env.VITE_SANDBOX || '') === 'true' || String(env.MODE || env.NODE_ENV || '') !== 'production';
  return <header className={cn(
    "sticky top-0 z-30 transition-all duration-300",
    sidebarCollapsed ? "ml-16" : "ml-64",
    isTransparent ? "bg-transparent border-transparent" : "bg-background/90 backdrop-blur-sm border-b",
    className
  )}>
      <div className="container flex items-center h-16 px-4 font-body">
        {/* Left spacer */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 ml-2" />
        </div>
        {/* Center - Search */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <div className="relative">
            <Search className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4',
              isTransparent ? 'text-gray-300' : 'text-muted-foreground'
            )} />
            <Input
              aria-label="Search"
              placeholder="search invoices, products, documents, and more"
              variant={isTransparent ? 'dark' : 'default'}
              className="pl-9 h-9 rounded-md"
            />
          </div>
        </div>
        {/* Right side - Sandbox badge, Language, Sync, Notifications */}
        <div className="flex items-center gap-4 ml-auto">
          {isSandbox && (
            <span className={cn(
              'text-xs px-2 py-0.5 rounded border',
              isTransparent ? 'border-amber-300/30 text-amber-200 bg-amber-500/10' : 'border-amber-600/30 text-amber-700 bg-amber-50'
            )}>
              Sandbox
            </span>
          )}
          {/* Language selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'inline-flex items-center gap-2 h-9 px-3 rounded-md text-sm transition-colors',
                  isTransparent ? 'hover:bg-white/10 text-gray-200' : 'hover:bg-accent hover:text-accent-foreground'
                )}
                aria-label="Language preference"
              >
                <span>{selectedLanguage.language}</span>
                <ChevronDown className="h-4 w-4 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px]">
              {LANGUAGE_OPTIONS.map((opt) => (
                <DropdownMenuItem key={opt.code} onClick={() => setSelectedLanguageCode(opt.code)} className="gap-2">
                  <span className="font-medium">{opt.language}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Labeled sync button */}
          <button title="Start sync now" className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-emerald-500 text-white hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 active:bg-emerald-600 transition-colors" onClick={() => {
            // Always route to the Sync page which starts/monitors the run
            window.location.href = '/sync';
          }}>
            <ArrowUpDown className="h-4 w-4" />
            <span className="text-sm">Sync</span>
          </button>
          <NotificationBell />
        </div>
      </div>
    </header>;
}
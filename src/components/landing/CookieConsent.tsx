import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CookiePreferences {
    analytics: boolean;
    marketing: boolean;
}

const STORAGE_KEY = 'Margin.cookieConsent';

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [view, setView] = useState<'banner' | 'settings'>('banner');
    const [preferences, setPreferences] = useState<CookiePreferences>({
        analytics: false,
        marketing: false,
    });

    // Check localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            // Small delay for animation
            setTimeout(() => setIsVisible(true), 1000);
        }
    }, []);

    const handleAgreeAll = () => {
        const allEnabled = { analytics: true, marketing: true };
        setPreferences(allEnabled);
        savePreferences(allEnabled);
    };

    const handleSaveSettings = () => {
        savePreferences(preferences);
    };

    const handleTurnOnOptional = () => {
        const allEnabled = { analytics: true, marketing: true };
        setPreferences(allEnabled);
        savePreferences(allEnabled);
    };

    const savePreferences = (prefs: CookiePreferences) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        setIsVisible(false);
    };

    if (!isVisible && typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) {
        return null;
    }

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-in-out transform",
                isVisible ? "translate-y-0" : "translate-y-full"
            )}>
            <div className="bg-[#050505]/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">

                {/* Banner View */}
                {view === 'banner' && (
                    <div className="container mx-auto px-4 py-4 md:px-6 md:py-8">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
                            <div className="flex-1 space-y-2 md:space-y-3">
                                <h3 className="font-sans text-xl font-light tracking-tight text-white md:text-3xl">Cookie Preferences</h3>
                                <p className="max-w-2xl font-sans text-[12px] font-light leading-6 tracking-tight !text-[#A3AAB5] md:text-sm md:leading-relaxed">
                                    This website uses cookies that provide necessary site functionality and improve your online experience. By continuing to use this website, you agree to the use of cookies. Our Privacy Policy provides more information about what cookies we use and how you can change them.
                                </p>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 md:flex md:min-w-[300px] md:gap-3">
                                <Button
                                    onClick={() => setView('settings')}
                                    variant="outline"
                                    className="h-11 rounded-[6px] border-white/10 bg-transparent px-6 text-[10px] font-bold uppercase tracking-tight !text-[#A3AAB5] hover:bg-white/5 hover:!text-white md:h-10">
                                    Manage Settings
                                </Button>
                                <Button
                                    onClick={handleAgreeAll}
                                    className="h-11 rounded-[6px] bg-white px-8 text-[10px] font-bold uppercase tracking-tight text-black hover:bg-white/90 md:h-10">
                                    Agree
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings View */}
                {view === 'settings' && (
                    <div className="container mx-auto max-h-[82vh] overflow-y-auto px-4 py-5 animate-in slide-in-from-bottom duration-300 md:px-6 md:py-8">
                        <div className="mb-5 flex items-center justify-between md:mb-8">
                            <h3 className="font-sans text-xl font-light tracking-tight text-white md:text-2xl">Cookie Settings</h3>
                            <button
                                onClick={() => setView('banner')}
                                className="text-white/40 hover:text-white transition-colors"
                                aria-label="Back">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="max-w-3xl space-y-4 md:space-y-6">
                            {/* Box 1: Necessary */}
                            <div className="flex items-start justify-between gap-4 rounded-[8px] border border-white/5 bg-white/[0.02] p-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-[11px] uppercase tracking-tight font-sans">Necessary cookies</span>
                                        <Badge variant="secondary" className="bg-white/10 text-white/60 hover:bg-white/10 text-[9px] uppercase font-bold tracking-tight px-2 py-0">Always on</Badge>
                                    </div>
                                    <p className="text-[11px] !text-[#8F98A3] font-light font-sans leading-relaxed max-w-lg tracking-tight">
                                        These keep things running smoothly (like helping you stay logged in). You can't turn these off.
                                    </p>
                                </div>
                            </div>

                            {/* Box 2: Analytics */}
                            <div className="flex items-center justify-between gap-4 rounded-[8px] border border-white/5 p-4 transition-colors hover:border-white/10">
                                <div className="space-y-1">
                                    <span className="font-bold text-white text-[11px] uppercase tracking-tight font-sans">Analytics cookies</span>
                                    <p className="text-[11px] !text-[#8F98A3] font-light font-sans leading-relaxed max-w-lg tracking-tight">
                                        These help us understand how people use the site so we can make improvements. You can turn these off if you'd rather not share that info.
                                    </p>
                                </div>
                                <Switch
                                    checked={preferences.analytics}
                                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked }))}
                                />
                            </div>

                            {/* Box 3: Marketing */}
                            <div className="flex items-center justify-between gap-4 rounded-[8px] border border-white/5 p-4 transition-colors hover:border-white/10">
                                <div className="space-y-1">
                                    <span className="font-bold text-white text-[11px] uppercase tracking-tight font-sans">Marketing cookies</span>
                                    <p className="text-[11px] !text-[#8F98A3] font-light font-sans leading-relaxed max-w-lg tracking-tight">
                                        These help us (and our trusted partners) show you more relevant content and ads based on how you use the site.
                                    </p>
                                </div>
                                <Switch
                                    checked={preferences.marketing}
                                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketing: checked }))}
                                />
                            </div>

                            {/* Footer Actions */}
                            <div className="flex flex-col items-center gap-3 border-t border-white/5 pt-4 sm:flex-row md:gap-4">
                                <Button
                                    onClick={handleTurnOnOptional}
                                    variant="outline"
                                    className="h-11 w-full rounded-[6px] border-white/10 bg-transparent px-6 text-[10px] font-bold uppercase tracking-tight !text-[#A3AAB5] hover:bg-white/5 hover:!text-white sm:w-auto md:h-10">
                                    Turn on optional cookies
                                </Button>
                                <div className="flex-1" />
                                <Button
                                    onClick={handleSaveSettings}
                                    className="h-11 min-w-[160px] rounded-[6px] bg-white px-8 text-[10px] font-bold uppercase tracking-tight text-black hover:bg-white/90 md:h-10">
                                    Save and Accept
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

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
            )}
        >
            <div className="bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">

                {/* Banner View */}
                {view === 'banner' && (
                    <div className="container mx-auto px-6 py-8">
                        <div className="flex flex-col md:flex-row gap-8 md:items-center">
                            <div className="flex-1 space-y-3">
                                <h3 className="font-semibold text-lg text-gray-900">Cookie Preferences</h3>
                                <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                                    This website uses cookies that provide necessary site functionality and improve your online experience. By continuing to use this website, you agree to the use of cookies. Our Privacy Policy provides more information about what cookies we use and how you can change them.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 min-w-[300px]">
                                <Button
                                    onClick={() => setView('settings')}
                                    variant="outline"
                                    className="bg-white text-black border-gray-200 hover:bg-gray-50 font-medium h-11"
                                >
                                    Manage Settings
                                </Button>
                                <Button
                                    onClick={handleAgreeAll}
                                    className="bg-black text-white hover:bg-gray-900 font-medium h-11"
                                >
                                    Agree
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings View */}
                {view === 'settings' && (
                    <div className="container mx-auto px-6 py-8 animate-in slide-in-from-bottom duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-semibold text-xl text-gray-900">Cookie Settings</h3>
                            <button
                                onClick={() => setView('banner')}
                                className="text-gray-500 hover:text-gray-900 transition-colors"
                                aria-label="Back"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-6 max-w-3xl">
                            {/* Box 1: Necessary */}
                            <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 text-sm">Necessary cookies</span>
                                        <Badge variant="secondary" className="bg-gray-200 text-gray-700 hover:bg-gray-200 text-[10px] uppercase font-bold tracking-wider">Always on</Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                                        These keep things running smoothly (like helping you stay logged in). You can't turn these off.
                                    </p>
                                </div>
                            </div>

                            {/* Box 2: Analytics */}
                            <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                                <div className="space-y-1">
                                    <span className="font-medium text-gray-900 text-sm">Analytics cookies</span>
                                    <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                                        These help us understand how people use the site so we can make improvements. You can turn these off if you'd rather not share that info.
                                    </p>
                                </div>
                                <Switch
                                    checked={preferences.analytics}
                                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked }))}
                                />
                            </div>

                            {/* Box 3: Marketing */}
                            <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                                <div className="space-y-1">
                                    <span className="font-medium text-gray-900 text-sm">Marketing cookies</span>
                                    <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                                        These help us (and our trusted partners) show you more relevant content and ads based on how you use the site.
                                    </p>
                                </div>
                                <Switch
                                    checked={preferences.marketing}
                                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketing: checked }))}
                                />
                            </div>

                            {/* Footer Actions */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-gray-100">
                                <Button
                                    onClick={handleTurnOnOptional}
                                    variant="outline"
                                    className="w-full sm:w-auto text-black border-gray-200 hover:bg-gray-50 font-medium h-11"
                                >
                                    Turn on optional cookies
                                </Button>
                                <div className="flex-1" />
                                <Button
                                    onClick={handleSaveSettings}
                                    className="w-full sm:w-auto bg-black text-white hover:bg-gray-900 font-medium h-11 min-w-[160px]"
                                >
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

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    COOKIE_CONSENT_STORAGE_KEY,
    DEFAULT_COOKIE_PREFERENCES,
    readCookiePreferences,
    saveCookiePreferences,
    type CookiePreferences,
} from '@/lib/cookieConsent';

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [view, setView] = useState<'banner' | 'settings'>('banner');
    const [isOverDarkSurface, setIsOverDarkSurface] = useState(false);
    const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_COOKIE_PREFERENCES);

    useEffect(() => {
        const stored = readCookiePreferences();
        if (stored) {
            setPreferences(stored);
            return;
        }

        const timeoutId = window.setTimeout(() => setIsVisible(true), 1000);
        return () => window.clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        const updateSurfaceTone = () => {
            if (typeof window === 'undefined' || typeof document === 'undefined') return;

            const probeY = Math.max(window.innerHeight - 120, 24);
            const darkSections = Array.from(document.querySelectorAll<HTMLElement>('[data-navbar-theme="dark"]'));

            setIsOverDarkSurface(
                darkSections.some((section) => {
                    const rect = section.getBoundingClientRect();
                    return rect.top <= probeY && rect.bottom >= probeY;
                })
            );
        };

        updateSurfaceTone();
        window.addEventListener('scroll', updateSurfaceTone, { passive: true });
        window.addEventListener('resize', updateSurfaceTone);

        return () => {
            window.removeEventListener('scroll', updateSurfaceTone);
            window.removeEventListener('resize', updateSurfaceTone);
        };
    }, []);

    const save = (nextPreferences: CookiePreferences) => {
        setPreferences(nextPreferences);
        saveCookiePreferences(nextPreferences);
        setIsVisible(false);
    };

    const handleAcceptAll = () => save({ analytics: true, marketing: true });

    const handleSaveSettings = () => save(preferences);

    const handleNecessaryOnly = () => save({ analytics: false, marketing: false });

    if (!isVisible) return null;

    const isDarkSurface = isOverDarkSurface && view === 'banner';

    return (
        <div
            className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-5 sm:pb-5"
            role="dialog"
            aria-modal="false"
            aria-labelledby="cookie-consent-title"
            aria-describedby="cookie-consent-description"
        >
            <div
                className={cn(
                    'pointer-events-auto mx-auto w-full max-w-[1180px] overflow-hidden rounded-[24px] border shadow-[0_28px_90px_rgba(37,49,58,0.18)] backdrop-blur-2xl transition-colors duration-300',
                    isDarkSurface
                        ? 'border-white/15 bg-[#182026]/96 text-white'
                        : 'border-[#CFE0EA] bg-[#FAFAF7]/[0.98] text-[#182026]'
                )}
            >
                {view === 'banner' ? (
                    <div className="relative px-5 py-5 sm:px-7 sm:py-6 md:px-8 md:py-7">
                        <div className={cn(
                            'pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_12%_0%,rgba(11,116,222,0.12),transparent_58%)]',
                            isDarkSurface && 'opacity-60'
                        )} />
                        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
                            <div className="max-w-[700px]">
                                <p className={cn(
                                    'text-[10px] font-semibold uppercase tracking-tight',
                                    isDarkSurface ? 'text-blue-300' : 'text-[#0B74DE]'
                                )}>
                                    Site preferences
                                </p>
                                <h2 id="cookie-consent-title" className={cn(
                                    'mt-2 font-lora text-2xl font-normal leading-tight tracking-[-0.02em] sm:text-3xl',
                                    isDarkSurface ? 'text-white' : 'text-[#182026]'
                                )}>
                                    Help improve your experience
                                </h2>
                                <p id="cookie-consent-description" className={cn(
                                    'mt-3 max-w-[660px] text-[13px] leading-6',
                                    isDarkSurface ? 'text-white/70' : 'text-[#66737F]'
                                )}>
                                    We use necessary cookies to keep Margin working. With your permission, optional analytics cookies help us understand what is useful and improve the site. You can change your choices at any time in <Link to="/privacy" className={cn('font-medium underline underline-offset-2 transition-colors', isDarkSurface ? 'text-white hover:text-blue-200' : 'text-[#182026] hover:text-[#0B74DE]')}>Privacy Policy</Link>.
                                </p>
                            </div>
                            <div className="grid shrink-0 gap-2 sm:grid-cols-2 lg:min-w-[300px] lg:grid-cols-1 xl:grid-cols-2">
                                <Button
                                    type="button"
                                    onClick={() => setView('settings')}
                                    variant="outline"
                                    className={cn(
                                        'h-11 rounded-[6px] px-5 text-[10px] font-semibold uppercase tracking-tight transition-colors',
                                        isDarkSurface
                                            ? 'border-white/20 bg-transparent text-white/75 hover:bg-white/10 hover:text-white'
                                            : 'border-[#D8E3EA] bg-white text-[#66737F] hover:bg-[#F3F6F8] hover:text-[#182026]'
                                    )}
                                >
                                    Manage settings
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleAcceptAll}
                                    className="h-11 rounded-[6px] bg-[#182026] px-5 text-[10px] font-semibold uppercase tracking-tight text-white hover:bg-[#33363D]"
                                >
                                    Accept all
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-h-[82vh] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6 md:px-8 md:py-7">
                        <div className="flex items-start justify-between gap-5 border-b border-[#E4EDF1] pb-5 md:pb-6">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-tight text-[#0B74DE]">Privacy choices</p>
                                <h2 id="cookie-consent-title" className="mt-2 font-lora text-2xl font-normal leading-tight tracking-[-0.02em] text-[#182026] sm:text-3xl">
                                    Choose what helps us improve
                                </h2>
                                <p id="cookie-consent-description" className="mt-2 max-w-[680px] text-[13px] leading-6 text-[#66737F]">
                                    Necessary cookies stay on so the site can function. Optional cookies are off unless you choose to enable them.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setView('banner')}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D8E3EA] bg-white text-[#66737F] transition-colors hover:bg-[#F3F6F8] hover:text-[#182026] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/30"
                                aria-label="Close privacy choices"
                            >
                                <X className="h-4 w-4" strokeWidth={1.8} />
                            </button>
                        </div>

                        <div className="mt-5 grid gap-3 md:mt-6 md:gap-4">
                            <CookieChoiceCard
                                title="Necessary cookies"
                                description="These keep Margin working, including essential navigation and session behavior. They cannot be turned off."
                                alwaysOn
                            />
                            <CookieChoiceCard
                                title="Analytics cookies"
                                description="These help us understand how visitors use Margin so we can improve the experience."
                                checked={preferences.analytics}
                                onCheckedChange={(checked) => setPreferences((current) => ({ ...current, analytics: checked }))}
                            />
                            <CookieChoiceCard
                                title="Marketing cookies"
                                description="These would support more relevant communications if marketing tools are enabled in the future."
                                checked={preferences.marketing}
                                onCheckedChange={(checked) => setPreferences((current) => ({ ...current, marketing: checked }))}
                            />
                        </div>

                        <div className="mt-5 flex flex-col gap-3 border-t border-[#E4EDF1] pt-5 sm:flex-row sm:items-center sm:justify-between md:mt-6 md:pt-6">
                            <Button
                                type="button"
                                onClick={handleNecessaryOnly}
                                variant="outline"
                                className="h-11 rounded-[6px] border-[#D8E3EA] bg-transparent px-5 text-[10px] font-semibold uppercase tracking-tight text-[#66737F] hover:bg-[#F3F6F8] hover:text-[#182026]"
                            >
                                Necessary only
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSaveSettings}
                                className="h-11 rounded-[6px] bg-[#182026] px-6 text-[10px] font-semibold uppercase tracking-tight text-white hover:bg-[#33363D]"
                            >
                                Save choices
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

type CookieChoiceCardProps = {
    title: string;
    description: string;
    alwaysOn?: boolean;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
};

function CookieChoiceCard({ title, description, alwaysOn, checked = false, onCheckedChange }: CookieChoiceCardProps) {
    return (
        <div className={cn(
            'flex items-start justify-between gap-5 rounded-[22px] border p-4 sm:p-5',
            alwaysOn ? 'border-[#D8E3EA] bg-[#F8FAFC]' : 'border-[#E4EDF1] bg-white'
        )}>
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-lora text-lg font-normal leading-tight text-[#182026]">{title}</h3>
                    {alwaysOn ? (
                        <span className="rounded-[6px] border border-[#D8E3EA] bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-tight text-[#66737F]">
                            Always on
                        </span>
                    ) : null}
                </div>
                <p className="mt-1.5 max-w-[680px] text-[12px] leading-5 text-[#66737F]">{description}</p>
            </div>
            {alwaysOn ? (
                <span className="shrink-0 pt-1 text-[10px] font-semibold uppercase tracking-tight text-[#2E7D5B]">Required</span>
            ) : (
                <Switch
                    checked={checked}
                    onCheckedChange={onCheckedChange}
                    aria-label={`Enable ${title.toLowerCase()}`}
                    className="mt-1 shrink-0"
                />
            )}
        </div>
    );
}

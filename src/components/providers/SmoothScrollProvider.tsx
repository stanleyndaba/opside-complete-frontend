import { ComponentType, ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface SmoothScrollProviderProps {
    children: ReactNode;
}

/**
 * SmoothScrollProvider enables premium momentum-based scrolling.
 * Configured to mimic the high-end feel of premium brand sites (Apple, Samsung).
 * Automatically disables itself for the main platform (/app/*) to maintain standard utility.
 */
export const SmoothScrollProvider = ({ children }: SmoothScrollProviderProps) => {
    const location = useLocation();
    const [LenisRoot, setLenisRoot] = useState<ComponentType<any> | null>(null);
    const isPlatformPage = location.pathname.startsWith('/app');
    const prefersReducedMotion = typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    useEffect(() => {
        if (isPlatformPage || prefersReducedMotion) {
            setLenisRoot(null);
            return;
        }

        let cancelled = false;
        const loadLenis = () => {
            void import('@studio-freight/react-lenis')
                .then((module) => {
                    if (!cancelled) {
                        setLenisRoot(() => module.ReactLenis);
                    }
                })
                .catch(() => undefined);
        };

        if ('requestIdleCallback' in window) {
            const idleId = window.requestIdleCallback(loadLenis, { timeout: 2500 });
            return () => {
                cancelled = true;
                window.cancelIdleCallback(idleId);
            };
        }

        const timeoutId = window.setTimeout(loadLenis, 1200);
        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [isPlatformPage, prefersReducedMotion]);

    // Return standard scroll for platform pages to ensure maximum utility and compatibility
    if (isPlatformPage || prefersReducedMotion || !LenisRoot) {
        return <>{children}</>;
    }

    return (
        <LenisRoot
            root
            options={{
                duration: 2.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom Apple-style easing
                smoothWheel: true,
                wheelMultiplier: 1.1,
                touchMultiplier: 1.5,
                infinite: false,
                lerp: 0.1, // Smoothness level (lower = smoother)
            }}
        >
            {children}
        </LenisRoot>
    );
};

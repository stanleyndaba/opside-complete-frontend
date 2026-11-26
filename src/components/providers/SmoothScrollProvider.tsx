import { ReactLenis } from '@studio-freight/react-lenis';
import { ReactNode, useEffect, useState } from 'react';
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
    const isPlatformPage = location.pathname.startsWith('/app') || location.pathname === '/audit';
    const [supportsSmoothScroll, setSupportsSmoothScroll] = useState(false);

    useEffect(() => {
        const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updateScrollMode = () => {
            const saveData = 'connection' in navigator && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
            setSupportsSmoothScroll(pointerQuery.matches && !reducedMotionQuery.matches && !saveData);
        };

        updateScrollMode();
        pointerQuery.addEventListener?.('change', updateScrollMode);
        reducedMotionQuery.addEventListener?.('change', updateScrollMode);
        return () => {
            pointerQuery.removeEventListener?.('change', updateScrollMode);
            reducedMotionQuery.removeEventListener?.('change', updateScrollMode);
        };
    }, []);

    // Return standard scroll for platform pages to ensure maximum utility and compatibility
    if (isPlatformPage || !supportsSmoothScroll) {
        return <>{children}</>;
    }

    return (
        <ReactLenis
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
        </ReactLenis>
    );
};

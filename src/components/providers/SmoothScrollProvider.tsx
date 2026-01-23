import { ReactLenis } from '@studio-freight/react-lenis';
import { ReactNode } from 'react';

interface SmoothScrollProviderProps {
    children: ReactNode;
}

/**
 * SmoothScrollProvider enables premium momentum-based scrolling.
 * Configured to mimic the high-end feel of premium brand sites (Apple, Samsung).
 */
export const SmoothScrollProvider = ({ children }: SmoothScrollProviderProps) => {
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

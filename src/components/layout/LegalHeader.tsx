import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Minimal institutional header for legal/compliance pages.
 * No icons, no gradients, no decorative elements.
 * Designed for institutional review (JP Morgan, Amazon, Stripe).
 */
const LegalHeader: React.FC = () => {
    return (
        <header className="border-b border-gray-200 bg-white">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto invert brightness-0" />
                        <span className="brand-wordmark font-merriweather text-base tracking-tight text-gray-900">
                            Margin
                        </span>
                    </Link>
                    <nav className="flex items-center gap-6 text-sm text-gray-600">
                        <Link to="/terms" className="hover:text-gray-900 transition-colors">
                            Terms
                        </Link>
                        <Link to="/privacy" className="hover:text-gray-900 transition-colors">
                            Privacy
                        </Link>
                        <Link to="/docs" className="hover:text-gray-900 transition-colors">
                            Acceptable Use
                        </Link>
                        <Link to="/refund-policy" className="hover:text-gray-900 transition-colors">
                            Refund Policy
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default LegalHeader;

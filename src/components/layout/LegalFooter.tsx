import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Minimal institutional footer for legal/compliance pages.
 * No icons, no gradients, no decorative elements.
 * Designed for institutional review (JP Morgan, Amazon, Stripe).
 */
const LegalFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-gray-200 bg-white">
            <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-600">
                    <p>© {currentYear} Margin AI. All rights reserved.</p>
                    <nav className="flex flex-wrap items-center gap-6">
                        <Link to="/terms" className="hover:text-gray-900 transition-colors">
                            Terms of Service
                        </Link>
                        <Link to="/privacy" className="hover:text-gray-900 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link to="/docs" className="hover:text-gray-900 transition-colors">
                            Acceptable Use Policy
                        </Link>
                        <Link to="/refund-policy" className="hover:text-gray-900 transition-colors">
                            Refund Policy
                        </Link>
                    </nav>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-500">
                    <p>Built for operators.</p>
                </div>
            </div>
        </footer>
    );
};

export default LegalFooter;

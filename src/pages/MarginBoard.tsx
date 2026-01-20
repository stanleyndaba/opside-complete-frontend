import React, { useEffect } from 'react';
import LegalHeader from '@/components/layout/LegalHeader';
import { ArrowRight, ShieldCheck, Building2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandFooter } from '@/components/layout/BrandFooter';

const MarginBoard = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900 selection:bg-gray-900 selection:text-white">
            <LegalHeader />

            <main className="flex-grow flex flex-col items-center justify-center py-20 px-6">
                <div className="max-w-4xl w-full space-y-12">

                    {/* Header Section */}
                    <div className="space-y-6 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-sm">
                            <span className="h-1.5 w-1.5 bg-gray-900 rounded-full" />
                            <span className="text-xs font-bold text-gray-900">
                                Compliance Infrastructure
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                            Identity verification for the <br className="hidden md:block" />
                            <span className="text-gray-500">institutional era.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed font-light">
                            Margin Board allows high-volume enterprises to automate Know Your Customer (KYC) flows, unify entity verification, and eliminate onboarding friction—without compromising security standards.
                        </p>
                    </div>

                    {/* Feature Grid - Minimal, Text-First */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-100 pt-12">
                        <div className="space-y-3">
                            <ShieldCheck className="h-5 w-5 text-gray-900" strokeWidth={1.5} />
                            <h3 className="text-sm font-bold text-gray-900">
                                Automated KYC
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Reduce manual review time by 94% with our agentic verification engine that cross-references global databases in real-time.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Building2 className="h-5 w-5 text-gray-900" strokeWidth={1.5} />
                            <h3 className="text-sm font-bold text-gray-900">
                                Entity Management
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Unify beneficial owner data across multiple jurisdictions and corporate structures with a single API integration.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Lock className="h-5 w-5 text-gray-900" strokeWidth={1.5} />
                            <h3 className="text-sm font-bold text-gray-900">
                                Bank-Grade Security
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                SOC 2 Type II certified infrastructure ensuring your sensitive compliance data remains encrypted and isolated.
                            </p>
                        </div>
                    </div>

                    {/* Action Section */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-8">
                        <Button
                            className="h-12 px-8 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-sm transition-all"
                            onClick={() => window.open('https://forms.gle/882hpRYWinNzBt2r9', '_blank')}>
                            Request Immediate Access
                        </Button>

                        <Button
                            variant="outline"
                            className="h-12 px-8 border-gray-200 text-gray-900 hover:bg-gray-50 text-sm font-medium rounded-sm"
                            onClick={() => window.location.href = 'mailto:support@margin.app'}>
                            Contact Sales
                        </Button>
                    </div>

                </div>
            </main>

            <BrandFooter />
        </div>
    );
};

export default MarginBoard;

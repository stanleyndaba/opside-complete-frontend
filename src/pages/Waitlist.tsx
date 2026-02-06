import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { api } from '@/lib/api';
import { CheckCircle2, Sparkles, Send, ArrowRight, ShieldCheck, Mail } from 'lucide-react';

const Waitlist = () => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        company_name: '',
        monthly_volume: '',
        referral_source: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, monthly_volume: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email) {
            toast({
                title: "Email Required",
                description: "Please enter your email to join the waitlist.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.joinWaitlist(formData);
            if (response.ok) {
                setIsSuccess(true);
                toast({
                    title: response.data?.already_registered ? "Already Registered" : "Welcome!",
                    description: response.data?.message || "Successfully joined the waitlist.",
                });
            } else {
                toast({
                    title: "Submission Failed",
                    description: response.error || "Something went wrong. Please try again.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col text-white bg-[#050505] selection:bg-emerald-500/30">
            <PublicNavbar />

            <main className="flex-1 relative flex flex-col items-center justify-center pt-32 pb-20 px-6 overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute top-[20%] right-[0%] w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full" />
                    <div className="absolute -bottom-[10%] left-[20%] w-[700px] h-[700px] bg-emerald-600/5 blur-[130px] rounded-full" />

                    {/* Noise Grain */}
                    <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-2xl relative z-10"
                >
                    {/* Header */}
                    <div className="text-center mb-12 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase">
                            <Sparkles className="w-3 h-3" />
                            Priority Infiltration Access
                        </div>
                        <h1 className="text-4xl md:text-6xl font-merriweather font-bold leading-tight tracking-tight">
                            Join the <span className="text-emerald-500 italic">Waitlist</span>
                        </h1>
                        <p className="text-white/50 font-montserrat text-lg max-w-lg mx-auto leading-relaxed">
                            We&apos;re currently onboarding a limited group of high-volume sellers each month to ensure absolute forensic precision.
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {!isSuccess ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
                            >
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="full_name" className="text-xs uppercase font-mono tracking-widest text-white/40 ml-1">Full Identity</Label>
                                            <Input
                                                id="full_name"
                                                name="full_name"
                                                placeholder="Satoshi Nakamoto"
                                                className="h-12 bg-white/5 border-white/10 focus:border-emerald-500/50 rounded-xl"
                                                value={formData.full_name}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-xs uppercase font-mono tracking-widest text-white/40 ml-1">Electronic Mail *</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                placeholder="satoshi@bitcoin.org"
                                                className="h-12 bg-white/5 border-white/10 focus:border-emerald-500/50 rounded-xl"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="company_name" className="text-xs uppercase font-mono tracking-widest text-white/40 ml-1">Venture Name</Label>
                                            <Input
                                                id="company_name"
                                                name="company_name"
                                                placeholder="Margin Labs"
                                                className="h-12 bg-white/5 border-white/10 focus:border-emerald-500/50 rounded-xl"
                                                value={formData.company_name}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase font-mono tracking-widest text-white/40 ml-1">Monthly Logistics Volume</Label>
                                            <Select onValueChange={handleSelectChange} value={formData.monthly_volume}>
                                                <SelectTrigger className="h-12 bg-white/5 border-white/10 focus:border-emerald-500/50 rounded-xl">
                                                    <SelectValue placeholder="Select Range" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                                                    <SelectItem value="under_10k">&lt; $10k / month</SelectItem>
                                                    <SelectItem value="10k_50k">$10k - $50k / month</SelectItem>
                                                    <SelectItem value="50k_250k">$50k - $250k / month</SelectItem>
                                                    <SelectItem value="over_250k">$250k+ / month</SelectItem>
                                                    <SelectItem value="enterprise">8-9 Figure Institution</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-center pt-4">
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full md:w-auto min-w-[240px] h-14 bg-white text-black hover:bg-emerald-500 hover:text-white transition-all duration-300 rounded-full font-bold text-base flex items-center justify-center gap-2 group shadow-[0_15px_30px_rgba(0,0,0,0.3)]"
                                        >
                                            {isSubmitting ? (
                                                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    Reserve Spot <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                </>
                                            )}
                                        </Button>
                                        <p className="text-[10px] text-white/20 font-mono pt-4 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                            <ShieldCheck className="w-3 h-3 text-emerald-500/50" />
                                            Zero-Knowledge Encryption as Standard.
                                        </p>
                                    </div>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[32px] p-12 md:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.5)] text-center space-y-8"
                            >
                                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", damping: 10, stiffness: 100 }}
                                        className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"
                                    />
                                    <div className="relative z-10 w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-black">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-3xl font-merriweather font-bold">Protocol Secured</h3>
                                    <p className="text-white/50 font-montserrat text-lg max-w-md mx-auto leading-relaxed">
                                        Identity verified. You have been added to the priority queue. A specialized agent will reach out when a node becomes available.
                                    </p>
                                </div>

                                <div className="pt-6">
                                    <Button
                                        variant="ghost"
                                        asChild
                                        className="text-white/40 hover:text-white hover:bg-white/5 rounded-full font-mono text-xs uppercase tracking-widest gap-2"
                                    >
                                        <a href="/">
                                            Return to Command Center <ArrowRight className="w-3 h-3" />
                                        </a>
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>

            <BrandFooter />
        </div>
    );
};

export default Waitlist;

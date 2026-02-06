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
import {
    CheckCircle2,
    Sparkles,
    Send,
    ArrowRight,
    ShieldCheck,
    Mail,
    Briefcase,
    Building2,
    BarChart3,
    Target,
    Zap,
    MessageSquare,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';

const Waitlist = () => {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        user_type: '',
        brand_count: '',
        annual_revenue: '',
        email: '',
        contact_handle: '',
        primary_goal: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelection = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Auto-advance for some fields if it makes sense, but better to let user click Next
    };

    const nextStep = () => {
        // Simple validation
        if (step === 1 && (!formData.user_type || !formData.annual_revenue)) {
            toast({ title: "Identification Required", description: "Please select your profile and revenue band.", variant: "destructive" });
            return;
        }
        if (step === 2 && !formData.email) {
            toast({ title: "Contact Required", description: "A work email is required for priority access.", variant: "destructive" });
            return;
        }
        setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.primary_goal) {
            toast({ title: "Selection Required", description: "Please select your primary goal.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.joinWaitlist(formData);
            if (response.ok) {
                setIsSuccess(true);
                toast({
                    title: response.data?.already_registered ? "Already Registered" : "Access Requested",
                    description: response.data?.message || "You have been added to the priority queue.",
                });
            } else {
                toast({
                    title: "Request Failed",
                    description: response.error || "Something went wrong. Please try again.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected network error occurred.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const sectionVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
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
                    <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-2xl relative z-10"
                >
                    {/* Header */}
                    <div className="text-center mb-10 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
                            <Zap className="w-3 h-3" />
                            Velvet Rope Access
                        </div>
                        <h1 className="text-4xl md:text-5xl font-merriweather font-bold leading-tight tracking-tight">
                            Request <span className="text-emerald-500 italic">Early Access</span>
                        </h1>
                        <p className="text-white/40 font-montserrat text-base max-w-md mx-auto leading-relaxed">
                            Currently at capacity. Join the priority waitlist for the next release.
                        </p>
                    </div>

                    {/* Progress Indicator */}
                    {!isSuccess && (
                        <div className="flex items-center justify-center gap-2 mb-8">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={`h-1 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-emerald-500' : 'w-4 bg-white/10'}`}
                                />
                            ))}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {!isSuccess ? (
                            <motion.div
                                key={step}
                                variants={sectionVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
                            >
                                {step === 1 && (
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <Label className="text-xs uppercase font-mono tracking-widest text-white/40 ml-1">Identity Profile</Label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {[
                                                    { id: 'brand', label: 'Brand Owner', icon: Building2 },
                                                    { id: 'agency', label: 'Agency / Aggregator', icon: Briefcase },
                                                    { id: 'other', label: 'Investor / Other', icon: Target }
                                                ].map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleSelection('user_type', item.id)}
                                                        className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${formData.user_type === item.id
                                                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'
                                                            }`}
                                                    >
                                                        <item.icon className="w-5 h-5" />
                                                        <span className="text-xs font-semibold">{item.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {formData.user_type === 'agency' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="space-y-2 overflow-hidden"
                                                >
                                                    <Label htmlFor="brand_count" className="text-xs uppercase font-mono tracking-widest text-white/40 ml-1">Brands Managed</Label>
                                                    <Input
                                                        id="brand_count"
                                                        name="brand_count"
                                                        placeholder="How many brands?"
                                                        className="h-12 bg-white/5 border-white/10 focus:border-emerald-500/50 rounded-xl"
                                                        value={formData.brand_count}
                                                        onChange={handleInputChange}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase font-mono tracking-widest text-white/40 ml-1">Annual FBA Revenue</Label>
                                            <Select
                                                onValueChange={(v) => handleSelection('annual_revenue', v)}
                                                value={formData.annual_revenue}
                                            >
                                                <SelectTrigger className="h-14 bg-white/5 border-white/10 focus:border-emerald-500/50 rounded-xl text-left">
                                                    <SelectValue placeholder="Select Revenue Band" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                                                    <SelectItem value="starter">Just Starting (&lt;$200k)</SelectItem>
                                                    <SelectItem value="growing">Growing ($200k - $1M)</SelectItem>
                                                    <SelectItem value="scaling">Scaling ($1M - $10M)</SelectItem>
                                                    <SelectItem value="enterprise">Enterprise ($10M+)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="pt-4">
                                            <Button
                                                onClick={nextStep}
                                                className="w-full h-14 bg-white text-black hover:bg-emerald-500 hover:text-white transition-all duration-300 rounded-full font-bold flex items-center justify-center gap-2 group"
                                            >
                                                Next Step <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-8">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-xs uppercase font-mono tracking-widest text-white/40 ml-1">Work Identity (Email)</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        placeholder="satoshi@margin.labs"
                                                        className="h-14 pl-12 bg-white/5 border-white/10 focus:border-emerald-500/50 rounded-xl"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="contact_handle" className="text-xs uppercase font-mono tracking-widest text-white/40 ml-1">WhatsApp / Telegram (Optional)</Label>
                                                <div className="relative">
                                                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                    <Input
                                                        id="contact_handle"
                                                        name="contact_handle"
                                                        placeholder="@username or +1..."
                                                        className="h-14 pl-12 bg-white/5 border-white/10 focus:border-emerald-500/50 rounded-xl"
                                                        value={formData.contact_handle}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-white/20 font-mono ml-1 italic">For faster onboarding updates.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <Button
                                                variant="ghost"
                                                onClick={prevStep}
                                                className="h-14 px-6 border border-white/10 rounded-full hover:bg-white/5"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </Button>
                                            <Button
                                                onClick={nextStep}
                                                className="flex-1 h-14 bg-white text-black hover:bg-emerald-500 hover:text-white transition-all duration-300 rounded-full font-bold flex items-center justify-center gap-2 group"
                                            >
                                                Continue <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <Label className="text-xs uppercase font-mono tracking-widest text-white/40 ml-1">Primary Objective</Label>
                                            <div className="grid grid-cols-1 gap-3">
                                                {[
                                                    { id: 'recover', label: 'Recover lost profit (Cash Flow)', desc: 'Focus on maximum recovery accuracy.' },
                                                    { id: 'audit', label: 'Audit the last 18 months (Compliance)', desc: 'Comprehensive historical deep-dive.' },
                                                    { id: 'automate', label: "Automate my team's workload (Time)", desc: 'Autopilot dispute management.' }
                                                ].map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleSelection('primary_goal', item.id)}
                                                        className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-300 ${formData.primary_goal === item.id
                                                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'
                                                            }`}
                                                    >
                                                        <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.primary_goal === item.id ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'}`}>
                                                            {formData.primary_goal === item.id && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-sm font-bold">{item.label}</div>
                                                            <div className="text-[10px] opacity-60 font-mono uppercase tracking-wider">{item.desc}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <Button
                                                variant="ghost"
                                                onClick={prevStep}
                                                disabled={isSubmitting}
                                                className="h-14 px-6 border border-white/10 rounded-full hover:bg-white/5"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </Button>
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting}
                                                className="flex-1 h-14 bg-emerald-500 text-white hover:bg-emerald-400 transition-all duration-300 rounded-full font-bold flex items-center justify-center gap-2 group shadow-[0_15px_30px_rgba(16,185,129,0.2)]"
                                            >
                                                {isSubmitting ? (
                                                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        Join Priority List <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-white/20 font-mono text-center uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                            <ShieldCheck className="w-3 h-3 text-emerald-500/50" />
                                            JP Morgan Class Security Standard.
                                        </p>
                                    </div>
                                )}
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

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
    };

    const nextStep = () => {
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
                    title: response.data?.already_registered ? "ALREADY REGISTERED" : "PROTOCOL SECURED",
                    description: response.data?.message || "Identity verified. Transmission complete.",
                });
            } else {
                toast({
                    title: "SIGNAL FAILURE",
                    description: response.error || "Unable to establish secure connection.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "SYSTEM ERROR",
                description: "An unexpected network disruption occurred.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const sectionVariants = {
        initial: { opacity: 0, x: 10 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -10 }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 selection:text-white relative overflow-hidden">
            {/* Technical Background Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-full h-[800px] bg-[radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.05),transparent_70%)]" />
                <div className="absolute bottom-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_20%_100%,rgba(59,130,246,0.03),transparent_70%)]" />
            </div>

            <PublicNavbar />

            <main className="relative z-10 pt-32 pb-24 px-6 min-h-[90vh] flex flex-col justify-center">
                <div className="container mx-auto max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-12"
                    >
                        {/* Header Section */}
                        <div className="space-y-8 text-center md:text-left">
                            <div className="inline-flex items-center gap-4 px-3 py-1 bg-white/5 border border-white/10 rounded-none">
                                <span className="text-[10px] font-bold text-emerald-500 font-mono tracking-widest uppercase">Node Authorization</span>
                                <div className="h-3 w-[1px] bg-white/10" />
                                <span className="text-[10px] font-bold text-white/40 font-mono tracking-widest uppercase">Waitlist Protocol</span>
                            </div>

                            <h1 className="text-4xl md:text-7xl font-merriweather font-bold leading-tight tracking-tight">
                                Request <br />
                                Early Access
                            </h1>

                            <p className="max-w-md text-lg text-white/50 font-montserrat leading-relaxed border-l-2 border-emerald-500/20 pl-6 mx-auto md:mx-0">
                                Currently operating at maximum institutional bandwidth. Join the priority node release queue.
                            </p>
                        </div>

                        {/* Progress Strip */}
                        {!isSuccess && (
                            <div className="flex items-center gap-1 h-1 w-full bg-white/5 mb-12">
                                {[1, 2, 3].map((s) => (
                                    <div
                                        key={s}
                                        className={`h-full flex-1 transition-all duration-700 ${step >= s ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-transparent'}`}
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
                                    transition={{ duration: 0.4 }}
                                    className="bg-white/[0.02] border border-white/10 p-8 md:p-12 shadow-2xl relative"
                                >
                                    <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-l border-t border-emerald-500/30" />
                                    <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-r border-b border-emerald-500/30" />

                                    {step === 1 && (
                                        <div className="space-y-12">
                                            <div className="space-y-6">
                                                <Label className="text-[10px] font-bold text-white/30 tracking-[0.3em] uppercase font-mono">Profile Identifier</Label>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {[
                                                        { id: 'brand', label: 'Brand Owner', icon: Building2 },
                                                        { id: 'agency', label: 'Agency / Aggregator', icon: Briefcase },
                                                        { id: 'other', label: 'Strategic Partner', icon: Target }
                                                    ].map((item) => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => handleSelection('user_type', item.id)}
                                                            className={`flex items-center gap-6 p-6 transition-all duration-300 rounded-none border group relative ${formData.user_type === item.id
                                                                ? 'bg-emerald-500/5 border-emerald-500/40 text-white'
                                                                : 'bg-white/[0.01] border-white/10 text-white/40 hover:bg-white/[0.03] hover:border-white/20'
                                                                }`}
                                                        >
                                                            <item.icon className="w-4 h-4 opacity-50" />
                                                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] font-mono">{item.label}</span>
                                                            {formData.user_type === item.id && (
                                                                <div className="absolute right-6 h-1 w-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <Label className="text-[10px] font-bold text-white/30 tracking-[0.3em] uppercase font-mono">Volume Band (Annual)</Label>
                                                <Select
                                                    onValueChange={(v) => handleSelection('annual_revenue', v)}
                                                    value={formData.annual_revenue}
                                                >
                                                    <SelectTrigger className="h-16 bg-white/[0.02] border-white/10 text-white rounded-none font-mono text-[10px] tracking-[0.2em] uppercase focus:border-emerald-500/50">
                                                        <SelectValue placeholder="SELECT MAGNITUDE" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#0a0a0a] border-white/10 text-white rounded-none font-mono text-[10px] tracking-widest uppercase">
                                                        <SelectItem value="starter">Starter (&lt;$200k)</SelectItem>
                                                        <SelectItem value="growing">Growing ($200k - $1M)</SelectItem>
                                                        <SelectItem value="scaling">Scaling ($1M - $10M)</SelectItem>
                                                        <SelectItem value="enterprise">Enterprise ($10M+)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="pt-8">
                                                <Button
                                                    onClick={nextStep}
                                                    className="w-full h-16 bg-white text-black hover:bg-emerald-500 hover:text-white transition-all duration-500 rounded-none font-bold text-xs uppercase tracking-[0.3em] font-mono"
                                                >
                                                    Transmit Signal
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="space-y-12">
                                            <div className="space-y-8">
                                                <div className="space-y-6">
                                                    <Label htmlFor="email" className="text-[10px] font-bold text-white/30 tracking-[0.3em] uppercase font-mono">Communication Gateway</Label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                        <Input
                                                            id="email"
                                                            name="email"
                                                            type="email"
                                                            placeholder="AUTHORITY@DOMAIN.COM"
                                                            className="h-16 pl-16 bg-white/[0.02] border-white/10 focus:border-emerald-500/50 rounded-none font-mono text-xs tracking-widest placeholder:text-white/10"
                                                            value={formData.email}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <Label htmlFor="contact_handle" className="text-[10px] font-bold text-white/30 tracking-[0.3em] uppercase font-mono">Priority Node Channel</Label>
                                                    <div className="relative">
                                                        <MessageSquare className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                        <Input
                                                            id="contact_handle"
                                                            name="contact_handle"
                                                            placeholder="WHATSAPP / TELEGRAM ID"
                                                            className="h-16 pl-16 bg-white/[0.02] border-white/10 focus:border-emerald-500/50 rounded-none font-mono text-xs tracking-widest placeholder:text-white/10"
                                                            value={formData.contact_handle}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 pt-8">
                                                <Button
                                                    variant="outline"
                                                    onClick={prevStep}
                                                    className="h-16 px-10 border border-white/10 rounded-none hover:bg-white/5 bg-transparent"
                                                >
                                                    <ChevronLeft className="w-5 h-5 text-white/40" />
                                                </Button>
                                                <Button
                                                    onClick={nextStep}
                                                    className="flex-1 h-16 bg-white text-black hover:bg-emerald-500 hover:text-white transition-all duration-500 rounded-none font-bold text-xs uppercase tracking-[0.3em] font-mono"
                                                >
                                                    Verify Node
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {step === 3 && (
                                        <div className="space-y-12">
                                            <div className="space-y-6">
                                                <Label className="text-[10px] font-bold text-white/30 tracking-[0.3em] uppercase font-mono">Strategic Directive</Label>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {[
                                                        { id: 'recover', label: 'Profit Flow Recovery', desc: 'SKU-level forensic drift analysis.' },
                                                        { id: 'audit', label: 'Institutional Audit', desc: '18-Month historical reconciliation.' },
                                                        { id: 'automate', label: "Autonomous Engine", desc: 'Full agentic dispute management.' }
                                                    ].map((item) => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => handleSelection('primary_goal', item.id)}
                                                            className={`flex items-start gap-6 p-6 border transition-all duration-300 rounded-none ${formData.primary_goal === item.id
                                                                ? 'bg-emerald-500/5 border-emerald-500/40'
                                                                : 'bg-white/[0.01] border-white/10 hover:bg-white/[0.03] hover:border-white/20'
                                                                }`}
                                                        >
                                                            <div className={`mt-1.5 w-3 h-3 rounded-none border transition-all ${formData.primary_goal === item.id ? 'border-emerald-500 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'border-white/20'}`} />
                                                            <div className="space-y-2 text-left">
                                                                <div className={`text-xs font-bold uppercase tracking-tight font-mono ${formData.primary_goal === item.id ? 'text-white' : 'text-white/40'}`}>{item.label}</div>
                                                                <div className="text-[10px] uppercase tracking-widest text-white/20 font-mono font-medium">{item.desc}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-4 pt-8">
                                                <Button
                                                    variant="outline"
                                                    onClick={prevStep}
                                                    disabled={isSubmitting}
                                                    className="h-16 px-10 border border-white/10 rounded-none hover:bg-white/5 bg-transparent"
                                                >
                                                    <ChevronLeft className="w-5 h-5 text-white/40" />
                                                </Button>
                                                <Button
                                                    onClick={handleSubmit}
                                                    disabled={isSubmitting}
                                                    className={`flex-1 h-16 transition-all duration-500 rounded-none font-bold text-xs uppercase tracking-[0.3em] font-mono ${isSubmitting ? 'bg-white/5 text-white/20' : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98]'
                                                        }`}
                                                >
                                                    {isSubmitting ? (
                                                        <div className="flex items-center gap-4">
                                                            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                            INDEXING...
                                                        </div>
                                                    ) : (
                                                        "Initialize Protocol"
                                                    )}
                                                </Button>
                                            </div>

                                            <div className="text-center pt-4">
                                                <p className="text-[9px] text-white/20 uppercase tracking-[0.3em] flex items-center justify-center gap-4 font-mono font-bold">
                                                    <ShieldCheck className="w-3.5 h-3.5 opacity-20" />
                                                    Military Grade Encryption Standard
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white/[0.02] border border-white/10 p-16 md:p-24 shadow-3xl text-center space-y-12 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-emerald-500/50" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-emerald-500/50" />

                                    <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-[40px] animate-pulse" />
                                        <div className="w-24 h-24 border border-emerald-500/30 rounded-none flex items-center justify-center text-emerald-500">
                                            <CheckCircle2 className="w-12 h-12" />
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <h3 className="text-3xl md:text-4xl font-merriweather font-bold tracking-tight">Protocol Live</h3>
                                        <p className="text-white/40 font-mono text-[10px] max-w-sm mx-auto leading-loose uppercase tracking-[0.3em] font-bold">
                                            Your node identifier has been <br />
                                            encrypted and added to the <br />
                                            priority institutional queue.
                                        </p>
                                    </div>

                                    <div className="pt-8">
                                        <Button
                                            variant="outline"
                                            asChild
                                            className="h-16 px-12 border border-white/10 bg-transparent text-white/50 hover:text-white rounded-none font-bold font-mono text-[10px] uppercase tracking-[0.3em] transition-all"
                                        >
                                            <Link to="/">
                                                Back to Portal Interface
                                            </Link>
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </main>

            <BrandFooter />
        </div>
    );
};

export default Waitlist;

export default Waitlist;

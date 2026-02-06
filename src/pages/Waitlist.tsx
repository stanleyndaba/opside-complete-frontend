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
        <div className="min-h-screen flex flex-col text-white bg-[#050505] selection:bg-emerald-500/30 font-montserrat relative overflow-hidden">

            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] right-[0%] w-[500px] h-[500px] bg-blue-500/3 blur-[100px] rounded-full" />
                <div className="absolute -bottom-[10%] left-[20%] w-[700px] h-[700px] bg-emerald-600/5 blur-[130px] rounded-full" />
            </div>

            <PublicNavbar />

            <main className="flex-1 relative flex flex-col items-center justify-center pt-32 pb-20 px-6 z-10">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-xl"
                >
                    {/* Header */}
                    <div className="text-center mb-12 space-y-6">
                        <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                            <span className="text-[10px] font-bold text-emerald-500 tracking-[0.2em] uppercase font-montserrat">Waitlist Protocol</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-merriweather font-bold leading-tight tracking-tight">
                            Request <br />
                            <span className="text-emerald-500 italic">Early Access</span>
                        </h1>
                        <p className="text-white/40 font-montserrat text-sm max-w-sm mx-auto leading-relaxed border-t border-white/5 pt-6 uppercase tracking-widest font-bold">
                            Currently at capacity. <br />
                            Join the priority node release.
                        </p>
                    </div>

                    {/* Progress Indicator */}
                    {!isSuccess && (
                        <div className="flex items-center justify-between gap-1 mb-8 max-w-[200px] mx-auto overflow-hidden rounded-full border border-white/10 p-1">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={`h-1.5 flex-1 transition-all duration-500 rounded-full ${step >= s ? 'bg-emerald-500' : 'bg-white/5'}`}
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
                                className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-8 md:p-12 shadow-[0_50px_100px_rgba(0,0,0,0.6)] relative group rounded-3xl"
                            >

                                {step === 1 && (
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase ml-1 font-montserrat">Identity Profile</Label>
                                            <div className="grid grid-cols-1 gap-3">
                                                {[
                                                    { id: 'brand', label: 'Brand Owner', icon: Building2 },
                                                    { id: 'agency', label: 'Agency / Aggregator', icon: Briefcase },
                                                    { id: 'other', label: 'Investor / Other', icon: Target }
                                                ].map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleSelection('user_type', item.id)}
                                                        className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 group ${formData.user_type === item.id
                                                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                                            : 'bg-white/[0.01] border-white/10 text-white/40 hover:bg-white/5 hover:border-white/20'
                                                            }`}
                                                    >
                                                        <item.icon className={`w-4 h-4 transition-colors ${formData.user_type === item.id ? 'text-emerald-500' : 'text-white/20 group-hover:text-white/40'}`} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest font-montserrat">{item.label}</span>
                                                        {formData.user_type === item.id && <Sparkles className="w-3 h-3 ml-auto animate-pulse" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {formData.user_type === 'agency' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="space-y-4"
                                                >
                                                    <Label htmlFor="brand_count" className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase ml-1 font-montserrat">Brands Managed</Label>
                                                    <Input
                                                        id="brand_count"
                                                        name="brand_count"
                                                        placeholder="ENTER INTEGER"
                                                        className="h-12 bg-white/[0.02] border-white/10 focus:border-emerald-500/50 rounded-xl font-montserrat text-xs tracking-widest placeholder:text-white/10"
                                                        value={formData.brand_count}
                                                        onChange={handleInputChange}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase ml-1 font-montserrat">Volume Band (Annual)</Label>
                                            <Select
                                                onValueChange={(v) => handleSelection('annual_revenue', v)}
                                                value={formData.annual_revenue}
                                            >
                                                <SelectTrigger className="h-14 bg-white/[0.02] border-white/10 focus:border-emerald-500/50 rounded-xl text-left font-montserrat text-[10px] tracking-[0.2em] uppercase transition-all">
                                                    <SelectValue placeholder="SELECT RANGE" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#0a0a0a] border-white/10 text-white rounded-xl font-montserrat text-[10px] tracking-widest uppercase">
                                                    <SelectItem value="starter">Starter (&lt;$200k)</SelectItem>
                                                    <SelectItem value="growing">Growing ($200k - $1M)</SelectItem>
                                                    <SelectItem value="scaling">Scaling ($1M - $10M)</SelectItem>
                                                    <SelectItem value="enterprise">Enterprise ($10M+)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="pt-6">
                                            <Button
                                                onClick={nextStep}
                                                className="w-full h-16 bg-white text-black hover:bg-emerald-500 hover:text-white transition-all duration-500 rounded-xl font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 group shadow-2xl font-montserrat"
                                            >
                                                Advance Signal <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-10">
                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <Label htmlFor="email" className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase ml-1 font-montserrat">Email Address</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        placeholder="PARTNER@DOMAIN.COM"
                                                        className="h-14 pl-12 bg-white/[0.02] border-white/10 focus:border-emerald-500/50 rounded-xl font-montserrat text-[11px] tracking-widest placeholder:text-white/10"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <Label htmlFor="contact_handle" className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase ml-1 font-montserrat">Priority Channel (Optional)</Label>
                                                <div className="relative">
                                                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                                                    <Input
                                                        id="contact_handle"
                                                        name="contact_handle"
                                                        placeholder="WHATSAPP / TELEGRAM GATEWAY"
                                                        className="h-14 pl-12 bg-white/[0.02] border-white/10 focus:border-emerald-500/50 rounded-xl font-montserrat text-[10px] tracking-widest placeholder:text-white/10"
                                                        value={formData.contact_handle}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] ml-1 font-montserrat font-bold">For Priority Node Status Updates.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-6">
                                            <Button
                                                variant="outline"
                                                onClick={prevStep}
                                                className="h-16 px-8 border border-white/10 rounded-xl hover:bg-white/5 bg-transparent"
                                            >
                                                <ChevronLeft className="w-4 h-4 text-white/40" />
                                            </Button>
                                            <Button
                                                onClick={nextStep}
                                                className="flex-1 h-16 bg-white text-black hover:bg-emerald-500 hover:text-white transition-all duration-500 rounded-xl font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 group shadow-2xl font-montserrat"
                                            >
                                                Confirm Node <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-10">
                                        <div className="space-y-6">
                                            <Label className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase ml-1 font-montserrat">Strategic Objective</Label>
                                            <div className="grid grid-cols-1 gap-3">
                                                {[
                                                    { id: 'recover', label: 'Recover Profit Flow', desc: 'Forensic accuracy optimization.' },
                                                    { id: 'audit', label: '18M Historical Audit', desc: 'Compliance & Asset Reconciliation.' },
                                                    { id: 'automate', label: "Autonomous Workflow", desc: 'Autopilot dispute management layer.' }
                                                ].map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleSelection('primary_goal', item.id)}
                                                        className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-300 ${formData.primary_goal === item.id
                                                            ? 'bg-emerald-500/10 border-emerald-500/50'
                                                            : 'bg-white/[0.01] border-white/10 hover:bg-white/5 hover:border-white/20'
                                                            }`}
                                                    >
                                                        <div className={`mt-1.5 w-3 h-3 rounded-full border flex items-center justify-center ${formData.primary_goal === item.id ? 'border-emerald-500 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'border-white/20'}`}>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className={`text-[11px] font-bold uppercase tracking-tight transition-colors font-montserrat ${formData.primary_goal === item.id ? 'text-emerald-400' : 'text-white/40'}`}>{item.label}</div>
                                                            <div className="text-[9px] uppercase tracking-widest text-white/20 font-montserrat font-bold">{item.desc}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-6">
                                            <Button
                                                variant="outline"
                                                onClick={prevStep}
                                                disabled={isSubmitting}
                                                className="h-16 px-8 border border-white/10 rounded-xl hover:bg-white/5 bg-transparent"
                                            >
                                                <ChevronLeft className="w-4 h-4 text-white/40" />
                                            </Button>
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting}
                                                className={`flex-1 h-16 transition-all duration-500 rounded-xl font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 group shadow-2xl font-montserrat ${isSubmitting ? 'bg-white/5 text-white/20' : 'bg-emerald-500 text-white hover:bg-emerald-400'
                                                    }`}
                                            >
                                                {isSubmitting ? (
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-3.5 h-3.5 border border-white/20 border-t-white rounded-full animate-spin" />
                                                        PROCESSING...
                                                    </div>
                                                ) : (
                                                    <>
                                                        Initialize Audit <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        <div className="text-center space-y-4 pt-4">
                                            <p className="text-[9px] text-white/20 text-center uppercase tracking-[0.3em] flex items-center justify-center gap-3 font-montserrat font-bold">
                                                <ShieldCheck className="w-3 h-3 text-emerald-500/30" />
                                                JP Morgan Class Security Standard
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
                                className="bg-white/[0.02] border border-white/10 p-12 md:p-20 shadow-[0_50px_100px_rgba(0,0,0,0.6)] text-center space-y-10 relative"
                            >
                                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-emerald-500/40" />
                                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-emerald-500/40" />
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-emerald-500/40" />
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-emerald-500/40" />

                                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" />
                                    <div className="w-20 h-20 border border-emerald-500/50 rounded-full flex items-center justify-center text-emerald-500">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-3xl font-merriweather font-bold uppercase tracking-tight">Protocol Operational</h3>
                                    <p className="text-white/40 font-montserrat text-sm max-w-sm mx-auto leading-relaxed uppercase tracking-widest font-medium">
                                        Priority queue assigned. <br />
                                        Your node identifier is currently being encrypted and indexed.
                                    </p>
                                </div>

                                <div className="pt-10">
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="text-white/40 hover:text-white bg-transparent border-white/10 rounded-xl h-14 px-10 font-bold text-[10px] uppercase tracking-[0.3em] transition-all font-montserrat"
                                    >
                                        <a href="/">
                                            Return to Portal <ArrowRight className="w-3 h-3 ml-2" />
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

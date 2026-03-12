import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Shield, Info, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Message {
    id: string;
    role: 'agent' | 'user';
    text: string;
    timestamp: string;
}

const AUDIT_PATHWAYS = [
    { label: 'Estimate My Recovery', response: "We analyze your last 18 months of Amazon FBA data. Most sellers recover between 1-3% of their annual revenue. Would you like us to calculate your potential recovery?" },
    { label: 'How It Works', response: "Our process is fully automated. We connect to your Amazon account, find discrepancies across 64+ categories, and file claims on your behalf. No manual work required from you." },
    { label: 'Is It Safe?', response: "Yes! We're fully compliant with Amazon's Terms of Service. Every claim is verified with strong evidence before submission. Your account safety is our top priority." }
];

export function ChatNode() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init',
            role: 'agent',
            text: "Hi there! I'm here to help you recover money from Amazon FBA. How can I assist you today?",
            timestamp: new Date().toISOString()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: text,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        // Simulate Agent Response
        setTimeout(() => {
            const agentMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'agent',
                text: "Thanks for your question! Based on what I'm seeing, there may be recovery opportunities here. Would you like me to look into this further?",
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, agentMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const handlePathwayClick = (path: typeof AUDIT_PATHWAYS[0]) => {
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: path.label,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        setTimeout(() => {
            const agentMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'agent',
                text: path.response,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, agentMsg]);
            setIsTyping(false);
        }, 1200);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-80 sm:w-96 h-[500px] mb-4 flex flex-col overflow-hidden bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-2xl ring-1 ring-white/5"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-white/5 bg-[#050505]/95 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-tight font-mono uppercase flex items-center gap-2">
                                    Welcome 👋
                                    <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-[5px] normal-case font-sans font-medium leading-none">beta</span>
                                </h3>
                                <p className="text-[10px] text-white/40 font-mono tracking-tight mt-0.5">Ask anything based off the Margin platform and your data</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/40 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide"
                        >
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex flex-col max-w-[85%]",
                                        msg.role === 'user' ? "ml-auto items-end" : "items-start"
                                    )}
                                >
                                    <div className={cn(
                                        "px-4 py-3 text-xs leading-relaxed font-mono",
                                        msg.role === 'user'
                                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                            : "bg-white/5 text-gray-300 border border-white/5"
                                    )}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[9px] text-white/30 mt-1.5 font-mono uppercase tracking-tight flex items-center gap-1">
                                        {msg.role === 'agent' && <span className="w-1 h-1 rounded-full bg-emerald-500/50" />}
                                        {msg.role === 'agent' ? 'AI_AGENT_01' : 'USER_ID_Auth'} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex items-start">
                                    <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-none flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 text-white/40 animate-spin" />
                                        <span className="text-[10px] text-white/40 font-mono">Typing...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Audit Pathways (Chips) */}
                        <div className="px-5 py-3 border-t border-white/5 bg-[#050505]/50 overflow-x-auto scrollbar-hide flex gap-2">
                            {AUDIT_PATHWAYS.map((path, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handlePathwayClick(path)}
                                    className="whitespace-nowrap px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-500 transition-all rounded-none uppercase tracking-wider"
                                >
                                    {path.label}
                                </button>
                            ))}
                        </div>

                        {/* Input Area */}
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }}
                            className="p-4 bg-black/40 border-t border-white/5 flex items-center gap-2"
                        >
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Execute command or ask query..."
                                className="flex-1 bg-transparent border-none text-xs font-mono text-emerald-500 placeholder:text-white/20 focus:ring-0 focus:outline-none"
                            />
                            <button
                                type="submit"
                                className="p-1.5 text-white/40 hover:text-white transition-colors"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-12 w-12 flex items-center justify-center rounded-none transition-all shadow-2xl border",
                    isOpen
                        ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        : "bg-[#050505] text-emerald-500 border-white/10 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                )}
            >
                <MessageSquare className="h-5 w-5" />
            </motion.button>
        </div>
    );
}

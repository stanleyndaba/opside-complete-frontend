import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    role: 'agent' | 'user';
    text: string;
    timestamp: string;
}

const AUDIT_PATHWAYS = [
    {
        label: 'How Margin works',
        response: 'Margin starts read-only, detects recovery signals, matches supporting evidence, holds weak cases back, and keeps seller approval in the loop before filing decisions move forward.'
    },
    {
        label: 'Is it safe?',
        response: 'Margin is designed around visibility and control. Early setup starts with read-only access, and supportable cases are reviewed before any filing workflow is considered.'
    },
    {
        label: 'Early access',
        response: 'Access is managed in controlled onboarding waves. Approved sellers get guided setup and a first recovery workflow, without an instant self-serve dashboard promise.'
    }
];

export function ChatNode() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init',
            role: 'agent',
            text: "Hi, I’m here to help you understand Margin. Ask about read-only setup, recovery workflows, managed access, or how cases are reviewed before filing.",
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
                text: 'Thanks for asking. Margin is built to surface recovery signals, organize evidence, and make the workflow easier to review. For account-specific answers, the safest next step is the waitlist so setup can happen read-only and with seller approval.',
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
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end sm:bottom-6 sm:right-6">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="mb-4 flex h-[520px] w-[calc(100vw-2.5rem)] max-w-[390px] flex-col overflow-hidden rounded-[30px] border border-[#CFE0EA] bg-white shadow-[0_34px_100px_rgba(37,49,58,0.16)] ring-1 ring-white/70 sm:w-96"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-[#E4EDF1] bg-[#F8FAFC] px-5 py-4">
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-semibold tracking-[-0.02em] text-[#182026]">
                                    Margin guide
                                    <span className="rounded-full border border-[#BFD8EA] bg-[#EAF4FF] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#0B74DE]">beta</span>
                                </h3>
                                <p className="mt-0.5 text-[11px] leading-5 text-[#66737F]">Ask about setup, safety, evidence, and managed access.</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCE8EE] bg-white text-[#66737F] transition-colors hover:bg-[#F3F6F8] hover:text-[#182026]"
                                aria-label="Close chat"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 space-y-4 overflow-y-auto bg-[#FAFAF7] p-5"
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
                                        "rounded-[20px] px-4 py-3 text-[13px] leading-relaxed",
                                        msg.role === 'user'
                                            ? "rounded-br-[8px] border border-[#BFD8EA] bg-[#EAF4FF] text-[#123A5C]"
                                            : "rounded-bl-[8px] border border-[#E4EDF1] bg-white text-[#4D5B66]"
                                    )}>
                                        {msg.text}
                                    </div>
                                    <span className="mt-1.5 flex items-center gap-1 text-[10px] font-medium tracking-tight text-[#9AA8B2]">
                                        {msg.role === 'agent' && <span className="h-1 w-1 rounded-full bg-[#0B74DE]/70" />}
                                        {msg.role === 'agent' ? 'Margin' : 'You'} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex items-start">
                                    <div className="flex items-center gap-2 rounded-[18px] rounded-bl-[8px] border border-[#E4EDF1] bg-white px-4 py-3">
                                        <Loader2 className="h-3 w-3 animate-spin text-[#0B74DE]" />
                                        <span className="text-[11px] font-medium text-[#66737F]">Typing...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Audit Pathways (Chips) */}
                        <div className="flex gap-2 overflow-x-auto border-t border-[#E4EDF1] bg-white px-5 py-3 scrollbar-hide">
                            {AUDIT_PATHWAYS.map((path, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handlePathwayClick(path)}
                                    className="whitespace-nowrap rounded-full border border-[#CFE0EA] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#66737F] transition-all hover:border-[#BFD8EA] hover:bg-[#F8FAFC] hover:text-[#0B74DE]"
                                >
                                    {path.label}
                                </button>
                            ))}
                        </div>

                        {/* Input Area */}
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }}
                            className="flex items-center gap-2 border-t border-[#E4EDF1] bg-[#F8FAFC] p-4"
                        >
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Ask a Margin question..."
                                className="flex-1 rounded-full border border-[#CFE0EA] bg-white px-4 py-2.5 text-[13px] text-[#182026] placeholder:text-[#9AA8B2] focus:outline-none focus:ring-2 focus:ring-[#0B74DE]/20"
                            />
                            <button
                                type="submit"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B74DE] text-white shadow-[0_14px_30px_rgba(11,116,222,0.22)] transition-colors hover:bg-[#0869C9]"
                                aria-label="Send message"
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
                    "flex h-[52px] w-[52px] items-center justify-center rounded-full border transition-all shadow-[0_22px_70px_rgba(37,49,58,0.18)]",
                    isOpen
                        ? "border-[#BFD8EA] bg-white text-[#0B74DE]"
                        : "border-[#CFE0EA] bg-white text-[#25313A] hover:border-[#BFD8EA] hover:text-[#0B74DE]"
                )}
                aria-label={isOpen ? 'Close Margin guide' : 'Open Margin guide'}
            >
                <MessageSquare className="h-5 w-5" />
            </motion.button>
        </div>
    );
}

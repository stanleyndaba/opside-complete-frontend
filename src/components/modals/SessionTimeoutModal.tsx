import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface SessionTimeoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userEmail?: string;
}

export function SessionTimeoutModal({ isOpen, onClose, onSuccess, userEmail }: SessionTimeoutModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const loginPath = `/login?next=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`;

    const handleRefreshSession = async () => {
        setLoading(true);
        setError('');

        try {
            const { data, error: authError } = await supabase.auth.refreshSession();
            if (authError || !data.session?.access_token) {
                setError('We could not restore your session automatically. Sign in again to continue.');
                setLoading(false);
                return;
            }

            localStorage.setItem('session_token', data.session.access_token);
            if (data.session.user?.id) {
                localStorage.setItem('user_id', data.session.user.id);
            }
            if (data.session.user?.email) {
                localStorage.setItem('user_email', data.session.user.email);
            }

            toast({
                title: 'Welcome back!',
                description: 'Your session has been restored.',
            });

            onSuccess();
        } catch {
            setError('We could not restore your session automatically. Sign in again to continue.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignInAgain = () => {
        navigate(loginPath);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-xl border border-white/10 bg-[#0b0b0b] p-0 text-white shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl [&>button]:hidden"
                onEscapeKeyDown={(event) => event.preventDefault()}
                onPointerDownOutside={(event) => event.preventDefault()}
            >
                <div className="relative overflow-hidden rounded-lg">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
                    <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
                    <div className="absolute inset-y-0 left-0 w-px bg-white/10" />
                    <div className="absolute inset-y-0 right-0 w-px bg-white/10" />
                    <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />

                    <div className="relative p-8 sm:p-10">
                <DialogHeader>
                    <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                            <Lock className="h-3.5 w-3.5 text-white/80" />
                        </div>
                        <span className="text-[11px] font-medium uppercase tracking-tight text-white/56">Session expired</span>
                    </div>
                    <DialogTitle className="text-2xl font-medium tracking-tight text-white sm:text-[30px]">
                        Sign in again to continue
                    </DialogTitle>
                    <DialogDescription className="mt-3 max-w-lg text-sm leading-6 text-white/56 sm:text-[15px] sm:leading-7">
                        For security, your session ended after inactivity. Sign in again to reopen this workspace and continue where you left off.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-8 space-y-4">
                    {userEmail && (
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/50">
                            Signed in as <span className="font-medium text-white/78">{userEmail}</span>
                        </div>
                    )}

                    <div className="grid gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4 sm:p-5">
                        <div className="text-[11px] font-medium uppercase tracking-tight text-white/42">Why this matters</div>
                        <p className="text-sm leading-6 text-white/62">
                            Your workspace data is still here. We just need to restore your account session before the platform can load protected pages again.
                        </p>
                    </div>

                    {error && (
                        <p className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-sm text-red-200">{error}</p>
                    )}

                    <DialogFooter className="mt-2 flex-col gap-3 sm:flex-row sm:items-center sm:justify-start sm:space-x-0">
                        <Button
                            type="button"
                            onClick={handleSignInAgain}
                            className="h-12 rounded-full bg-white px-5 text-sm font-medium text-black hover:bg-white/92"
                        >
                            Sign in again
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleRefreshSession}
                            disabled={loading}
                            className="h-12 rounded-full border-white/12 bg-white/[0.03] px-5 text-sm text-white/72 hover:bg-white/[0.06] hover:text-white"
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Refreshing session' : 'Refresh session'}
                        </Button>
                        <button
                            type="button"
                            onClick={handleSignInAgain}
                            className="text-sm text-white/38 transition-colors hover:text-white/70"
                        >
                            Use a different account
                        </button>
                    </DialogFooter>
                </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default SessionTimeoutModal;

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
                className="sm:max-w-lg border border-white/10 bg-[#0c0c0c] p-0 text-white shadow-2xl backdrop-blur-xl [&>button]:hidden"
                onEscapeKeyDown={(event) => event.preventDefault()}
                onPointerDownOutside={(event) => event.preventDefault()}
            >
                <div className="p-7 sm:p-8">
                <DialogHeader className="space-y-0 text-left">
                    <div className="mb-4 flex items-center gap-3 text-white/60">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                            <Lock className="h-4 w-4 text-white/72" />
                        </div>
                        <span className="text-sm font-medium tracking-tight">Session expired</span>
                    </div>
                    <DialogTitle className="text-[28px] font-medium tracking-tight text-white">
                        Sign in again to continue
                    </DialogTitle>
                    <DialogDescription className="mt-3 max-w-md text-[15px] leading-7 text-white/56">
                        For security, your session ended after inactivity. Sign in again to reopen this workspace and continue where you left off.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-6 space-y-4">
                    {userEmail && (
                        <div className="text-sm text-white/48">
                            Signed in as <span className="font-medium text-white/78">{userEmail}</span>
                        </div>
                    )}

                    <p className="text-sm leading-6 text-white/62">
                        Your workspace data is still here. We just need to restore your session before protected pages can load again.
                    </p>

                    {error && (
                        <p className="rounded-lg border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-sm text-red-200">{error}</p>
                    )}

                    <DialogFooter className="mt-2 flex-col gap-3 sm:flex-row sm:items-center sm:justify-start sm:space-x-0">
                        <Button
                            type="button"
                            onClick={handleSignInAgain}
                            className="h-11 rounded-lg bg-white px-5 text-sm font-medium text-black hover:bg-white/92"
                        >
                            Sign in again
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleRefreshSession}
                            disabled={loading}
                            className="h-11 rounded-lg border-white/12 bg-white/[0.03] px-5 text-sm text-white/72 hover:bg-white/[0.06] hover:text-white"
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Refreshing session' : 'Refresh session'}
                        </Button>
                        <button
                            type="button"
                            onClick={handleSignInAgain}
                            className="text-sm text-white/42 transition-colors hover:text-white/70"
                        >
                            Use a different account
                        </button>
                    </DialogFooter>
                </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default SessionTimeoutModal;

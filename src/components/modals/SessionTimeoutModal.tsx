/**
 * Session Timeout Modal
 * Shows a soft lock instead of redirecting to login when session expires.
 * User can re-authenticate without losing their current page state.
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface SessionTimeoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userEmail?: string;
}

export function SessionTimeoutModal({ isOpen, onClose, onSuccess, userEmail }: SessionTimeoutModalProps) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const loginPath = `/login?next=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`;

    const handleReAuthenticate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Re-authenticate with Supabase
            const email = userEmail || localStorage.getItem('user_email') || '';

            if (!email) {
                // If we don't have the email, we need a full login
                navigate(loginPath);
                return;
            }

            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                setError('Incorrect password. Please try again.');
                setLoading(false);
                return;
            }

            toast({
                title: 'Welcome back!',
                description: 'Your session has been restored.',
            });

            setPassword('');
            onSuccess();
        } catch (err: any) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        navigate(loginPath);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 rounded-full">
                            <Lock className="h-5 w-5 text-amber-600" />
                        </div>
                        <DialogTitle className="text-xl">Session Paused</DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-600">
                        For your security, we paused the session. Enter your password to resume exactly where you left off.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleReAuthenticate} className="space-y-4">
                    {userEmail && (
                        <div className="text-sm text-gray-500">
                            Logged in as: <span className="font-medium text-gray-700">{userEmail}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                placeholder="Enter your password"
                                autoFocus
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}

                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={handleLogout} className="text-gray-500">
                            Use different account
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500">
                            {loading ? 'Resuming...' : 'Resume Session'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default SessionTimeoutModal;

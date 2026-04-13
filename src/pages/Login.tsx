import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { normalizeTenantSlug } from '@/lib/routes';
import { api } from '@/lib/api';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';

const sanitizeNextPath = (value: string | null, intent: string | null) => {
  if (typeof window === 'undefined') {
    return '/app';
  }

  if (value && value.startsWith('/') && !value.startsWith('/login')) {
    return value;
  }

  const storedTenantSlug = normalizeTenantSlug(localStorage.getItem('active_tenant_slug'));
  if (intent === 'upload-csv' && storedTenantSlug) {
    return `/app/${storedTenantSlug}/data-upload`;
  }

  return '/app';
};

type AuthMode = 'login' | 'signup' | 'recovery';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  usePageMeta({
    title: 'Log In | Margin',
    description: 'Access your Margin workspace with your account credentials.',
    url: `${SITE_META.url}/login`,
    image: SITE_META.image,
  });

  const intent = searchParams.get('intent');
  const next = searchParams.get('next');
  const nextPath = useMemo(() => sanitizeNextPath(next, intent), [intent, next]);

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('user_email') : '';
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const redirectIfAuthenticated = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted && session?.access_token) {
        try {
          const resolvedTenantSlug = await resolveTenantSlugForAuthenticatedUser(
            session.user?.email || localStorage.getItem('user_email') || ''
          );
          const targetPath = nextPath !== '/app'
            ? bindPathToTenant(nextPath, resolvedTenantSlug)
            : `/app/${resolvedTenantSlug}/connect-amazon`;
          navigate(targetPath, { replace: true });
        } catch {
          navigate(nextPath, { replace: true });
        }
      }
    };

    redirectIfAuthenticated();

    return () => {
      isMounted = false;
    };
  }, [navigate, nextPath]);

  useEffect(() => {
    const urlType = searchParams.get('type');
    const explicitMode = searchParams.get('mode');
    if (urlType === 'recovery' || explicitMode === 'recovery') {
      setMode('recovery');
    } else if (explicitMode === 'signup') {
      setMode('signup');
    }
  }, [searchParams]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('recovery');
        setError('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const subtitle = 'User access and marketplace OAuth are separate flows. Your account login gets you into the workspace. Amazon, Gmail, and the other providers are connected after that from Integrations Hub.';
  const supportingNote = 'That separation is important now that the platform is running in real authenticated mode instead of the old demo fallback.';

  const heading = mode === 'signup'
    ? 'Create your workspace account'
    : mode === 'recovery'
      ? 'Reset your password'
      : 'Log in to your workspace';

  const resetLocalAuthError = () => {
    setError('');
  };

  const persistSession = (accessToken?: string | null, userId?: string | null, userEmail?: string | null) => {
    if (accessToken) {
      localStorage.setItem('session_token', accessToken);
    }
    if (userId) {
      localStorage.setItem('user_id', userId);
    }
    if (userEmail) {
      localStorage.setItem('user_email', userEmail);
    }
  };

  const clearStoredTenantContext = () => {
    localStorage.removeItem('active_tenant_id');
    localStorage.removeItem('active_tenant_slug');
  };

  const bindPathToTenant = (path: string, tenantSlug: string) => {
    if (!path.startsWith('/app/')) {
      return path;
    }

    return path.replace(/^\/app\/[^/]+/, `/app/${tenantSlug}`);
  };

  const deriveWorkspaceNameFromEmail = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    const domain = trimmed.split('@')[1] || '';
    const label = domain.split('.')[0] || trimmed.split('@')[0] || 'workspace';
    return label
      .split(/[^a-z0-9]+/i)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Workspace';
  };

  const resolveTenantSlugForAuthenticatedUser = async (emailAddress: string, preferredTenantSlug?: string | null) => {
    clearStoredTenantContext();

    const workspaceName = deriveWorkspaceNameFromEmail(emailAddress);
    const bootstrapResponse = await api.post<{
      success: boolean;
      tenant?: { id: string; slug: string };
    }>('/api/auth/bootstrap', {
      workspaceName,
      preferredTenantSlug: normalizeTenantSlug(preferredTenantSlug || localStorage.getItem('active_tenant_slug')),
    });

    const resolvedTenantSlug = normalizeTenantSlug(bootstrapResponse.data?.tenant?.slug);
    if (bootstrapResponse.ok && resolvedTenantSlug && bootstrapResponse.data?.tenant?.id) {
      localStorage.setItem('active_tenant_id', bootstrapResponse.data.tenant.id);
      localStorage.setItem('active_tenant_slug', resolvedTenantSlug);
      return resolvedTenantSlug;
    }

    throw new Error('Unable to resolve a workspace for this account.');
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (mode === 'recovery') {
      if (!password.trim() || !confirmPassword.trim()) {
        setError('Enter and confirm your new password.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else if (!email.trim() || !password.trim()) {
      setError(mode === 'signup' ? 'Enter your email and create a password.' : 'Enter both your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });

        if (authError) {
          setError(authError.message || 'Unable to create your account.');
          setLoading(false);
          return;
        }

        persistSession(data.session?.access_token, data.user?.id, data.user?.email);

        toast({
          title: data.session ? 'Account created' : 'Check your inbox',
          description: data.session
            ? 'Your account is ready. Redirecting you into the workspace now.'
            : 'We sent a confirmation link to your email address.',
        });

        if (data.session) {
          const resolvedTenantSlug = await resolveTenantSlugForAuthenticatedUser(email.trim());
          navigate(`/app/${resolvedTenantSlug}/connect-amazon`, { replace: true });
        } else {
          setMode('login');
        }
        setLoading(false);
        return;
      }

      if (mode === 'recovery') {
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });

        if (updateError) {
          setError(updateError.message || 'Unable to update your password.');
          setLoading(false);
          return;
        }

        toast({
          title: 'Password updated',
          description: 'You can continue into your workspace now.',
        });

        setConfirmPassword('');
        const resolvedTenantSlug = await resolveTenantSlugForAuthenticatedUser(email.trim() || localStorage.getItem('user_email') || '');
        navigate(`/app/${resolvedTenantSlug}/connect-amazon`, { replace: true });
        setLoading(false);
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message || 'Unable to log in with those credentials.');
        setLoading(false);
        return;
      }

      persistSession(data.session?.access_token, data.user?.id, data.user?.email);

      toast({
        title: 'Logged in',
        description: 'Redirecting you into your workspace now.',
      });

      const resolvedTenantSlug = await resolveTenantSlugForAuthenticatedUser(email.trim());
      const targetPath = nextPath !== '/app'
        ? bindPathToTenant(nextPath, resolvedTenantSlug)
        : `/app/${resolvedTenantSlug}/connect-amazon`;
      navigate(targetPath, { replace: true });
    } catch (loginError: any) {
      setError(loginError?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email first so we know where to send the reset link.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login?mode=recovery`,
      });

      if (resetError) {
        setError(resetError.message || 'Unable to send a password reset email.');
        setLoading(false);
        return;
      }

      toast({
        title: 'Reset email sent',
        description: 'Check your inbox for the secure password reset link.',
      });
    } catch (resetError: any) {
      setError(resetError?.message || 'Unable to send a password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_18%_8%,rgba(133,170,255,0.1),transparent_40%),radial-gradient(circle_at_84%_0%,rgba(255,255,255,0.05),transparent_42%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_18%_100%,rgba(125,149,181,0.08),transparent_44%),radial-gradient(circle_at_76%_88%,rgba(255,255,255,0.04),transparent_48%)]" />
      </div>

      <PublicNavbar />

      <main className="relative z-10 px-4 pb-24 pt-28 md:px-6 md:pb-28 md:pt-32">
        <div className="mx-auto max-w-[860px] space-y-8">
          <section className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium tracking-tight text-white/72">
              <span>Workspace access</span>
              <span className="h-1 w-1 rounded-full bg-[#8fb7ff]/80" />
              <span className="text-white/46">
                {mode === 'signup' ? 'Create account' : mode === 'recovery' ? 'Reset password' : 'Sign in'}
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-[620px] text-[38px] font-light leading-[0.95] tracking-tight text-white md:text-[60px]">
                {heading}
              </h1>
              <p className="max-w-[560px] text-[16px] leading-7 text-white/58 md:text-lg md:leading-8">
                {intent === 'upload-csv' && mode === 'login'
                  ? 'Sign in to upload files into your workspace. Data import starts after account access, not before.'
                  : 'Your Margin account gets you into the workspace first. Amazon, Gmail, and other providers are connected after that from inside the product.'}
              </p>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.018)_16%,rgba(8,8,9,0.98)_100%)] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.36)] md:p-7">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#8fb7ff]/40 to-transparent" />
            <div className="pointer-events-none absolute -right-16 top-10 h-32 w-32 rounded-full bg-[#7aa6ff]/10 blur-3xl" />

            <div className="relative">
              <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-medium tracking-tight text-white/40">
                    {mode === 'signup' ? 'New account' : mode === 'recovery' ? 'Password recovery' : 'Existing account'}
                  </div>
                  <h2 className="text-[28px] font-light leading-[1.02] tracking-tight text-white md:text-[34px]">
                    {mode === 'signup'
                      ? 'Create your workspace access'
                      : mode === 'recovery'
                        ? 'Set your new password'
                        : 'Enter your details'}
                  </h2>
                </div>

                <div className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium tracking-tight text-white/72">
                  Account step
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-medium tracking-tight text-white/42">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    disabled={mode === 'recovery'}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      resetLocalAuthError();
                    }}
                    placeholder="you@company.com"
                    className="h-14 rounded-[20px] border-white/10 bg-white/[0.02] pl-11 text-[14px] tracking-tight text-white placeholder:text-white/18 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[11px] font-medium tracking-tight text-white/42">
                  {mode === 'recovery' ? 'New Password' : 'Password'}
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      resetLocalAuthError();
                    }}
                    placeholder={mode === 'recovery' ? 'Enter your new password' : 'Enter your password'}
                    className="h-14 rounded-[20px] border-white/10 bg-white/[0.02] pl-11 pr-11 text-[14px] tracking-tight text-white placeholder:text-white/18"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white/70"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === 'recovery' ? (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[11px] font-medium tracking-tight text-white/42">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        resetLocalAuthError();
                      }}
                      placeholder="Confirm your new password"
                      className="h-14 rounded-[20px] border-white/10 bg-white/[0.02] pl-11 pr-11 text-[14px] tracking-tight text-white placeholder:text-white/18"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white/70"
                      aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-[18px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 flex-1 justify-between rounded-[18px] border border-white/10 bg-white px-5 text-[13px] font-medium tracking-tight text-black hover:bg-white/92 hover:text-black"
                >
                  {loading ? (
                    mode === 'signup'
                      ? 'Creating account...'
                      : mode === 'recovery'
                        ? 'Updating password...'
                        : 'Signing in...'
                  ) : (
                    mode === 'signup'
                      ? 'Create Account'
                      : mode === 'recovery'
                        ? 'Save New Password'
                        : 'Log In'
                  )}
                  {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-[18px] border-white/10 bg-transparent px-5 text-[13px] font-medium tracking-tight text-white/74 hover:bg-white/[0.04] hover:text-white">
                  <Link to="/">
                    Back Home
                  </Link>
                </Button>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 pt-4 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setMode((currentMode) => {
                      const nextMode = currentMode === 'signup' ? 'login' : 'signup';
                      setPassword('');
                      setConfirmPassword('');
                      setError('');
                      return nextMode;
                    });
                  }}
                  className="text-left transition-colors hover:text-white"
                >
                  {mode === 'signup' ? 'Already have an account? Log in' : 'No account yet? Create one'}
                </button>
                {mode !== 'recovery' ? (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-left transition-colors hover:text-white disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setPassword('');
                      setConfirmPassword('');
                      setError('');
                    }}
                    className="text-left transition-colors hover:text-white"
                  >
                    Back to login
                  </button>
                )}
              </div>

              <div className="mt-6 border-t border-white/10 pt-5 text-[14px] leading-6 text-white/45">
                <p>{subtitle}</p>
                <p className="mt-3">{supportingNote}</p>
              </div>
              </form>
            </div>
          </section>
        </div>
      </main>
      <BrandFooter />
    </div>
  );
};

export default Login;

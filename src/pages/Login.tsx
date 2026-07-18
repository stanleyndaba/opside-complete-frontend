import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { clearDemoSession, DEMO_TENANT_SLUG, isDemoBypassAvailable, seedDemoSession } from '@/lib/demoSession';
import { applyFoundingActivationState, hasFoundingReservationContext, markFoundingReservationConfirmed } from '@/lib/foundingActivation';

const sanitizeNextPath = (value: string | null, intent: string | null) => {
  if (typeof window === 'undefined') {
    return '/app';
  }

  const storedTenantSlug = normalizeTenantSlug(localStorage.getItem('active_tenant_slug'));
  if (intent === 'onboarding') {
    return '/founding-500/status';
  }

  if (value && value.startsWith('/') && !value.startsWith('/login')) {
    return value;
  }

  if (intent === 'upload-csv' && storedTenantSlug) {
    return `/app/${storedTenantSlug}/data-upload`;
  }

  return '/app';
};

type AuthMode = 'login' | 'signup' | 'recovery';
type LoginStep = 'account' | 'workspace';

type DemoReviewerLoginResponse = {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    role: string;
  };
  redirectPath: string;
};

const PAYSTACK_REVIEW_EMAIL = String(
  import.meta.env.VITE_PAYSTACK_REVIEW_EMAIL || 'paystack-review@margin-finance.com'
).trim().toLowerCase();

const isPaystackReviewerEmail = (value: string) => {
  return value.trim().toLowerCase() === PAYSTACK_REVIEW_EMAIL;
};

const extractLoginErrorMessage = (value: unknown): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (value instanceof Error) {
    return value.message.trim();
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const nestedError = typeof record.error === 'object' && record.error !== null
      ? record.error as Record<string, unknown>
      : null;
    const candidates = [
      record.message,
      record.error_description,
      record.error,
      record.details,
      record.statusText,
      record.name,
      nestedError?.message,
      nestedError?.code,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    try {
      const serialized = JSON.stringify(value);
      return serialized === '{}' ? '' : serialized;
    } catch {
      return '';
    }
  }

  return String(value || '').trim();
};

const isOpaqueLoginError = (message: string) => {
  const normalized = message.trim().toLowerCase();
  return !normalized ||
    normalized === '{}' ||
    normalized === '[object object]' ||
    normalized === 'authretryablefetcherror: {}' ||
    normalized.endsWith(': {}');
};

const formatLoginError = (error: unknown, step: LoginStep) => {
  const rawMessage = extractLoginErrorMessage(error);
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes('exceed_egress_quota') ||
    normalized.includes('restricted') ||
    normalized.includes('violations') ||
    normalized.includes('spend cap') ||
    normalized.includes('upgrade their plan')
  ) {
    return '__SERVICE_PREPARING__';
  }

  if (normalized.includes('invalid login credentials') || normalized.includes('invalid credentials')) {
    return 'The email or password is incorrect. Please check the account details and try again.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Confirm your email address before logging in.';
  }

  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return 'Too many login attempts happened too quickly. Please wait a moment, then try again.';
  }

  if (step === 'workspace' && normalized.includes('unable to resolve a workspace')) {
    return 'Your account sign-in succeeded, but this account is not assigned to active Margin access yet. Use the reviewer credentials Margin supplied, or request Early Access.';
  }

  const retryableAuthIssue =
    isOpaqueLoginError(rawMessage) ||
    normalized.includes('authretryablefetcherror') ||
    normalized.includes('timeout') ||
    normalized.includes('timed out') ||
    normalized.includes('504') ||
    normalized.includes('gateway') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('network');

  if (retryableAuthIssue) {
    return step === 'account'
      ? 'Supabase Auth did not return a readable response while checking the account. Please try again in a moment.'
      : 'Your account sign-in looks okay, but Margin could not finish access setup. Please retry in a moment.';
  }

  return rawMessage || (step === 'account'
    ? 'Unable to log in with those credentials.'
    : 'Unable to finish access setup after sign-in.');
};

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
  const demoBypassAvailable = isDemoBypassAvailable();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginStep, setLoginStep] = useState<LoginStep | null>(null);
  const [workspaceRetryAvailable, setWorkspaceRetryAvailable] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [activeSessionEmail, setActiveSessionEmail] = useState<string | null>(null);

  const enterDemoWorkspace = useCallback(() => {
    seedDemoSession();
    navigate(`/app/${DEMO_TENANT_SLUG}/dashboard`, { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!demoBypassAvailable || mode !== 'login') return;
    if (nextPath === `/app/${DEMO_TENANT_SLUG}/dashboard` || nextPath.startsWith(`/app/${DEMO_TENANT_SLUG}/`)) {
      enterDemoWorkspace();
    }
  }, [demoBypassAvailable, enterDemoWorkspace, mode, nextPath]);

  useEffect(() => {
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('user_email') : '';
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  useEffect(() => {
    if (intent === 'onboarding') {
      markFoundingReservationConfirmed('signup_intent');
    }
  }, [intent]);

  useEffect(() => {
    let isMounted = true;

    const loadActiveSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      const recoveryMode = searchParams.get('type') === 'recovery' || searchParams.get('mode') === 'recovery';
      if (!recoveryMode && session?.access_token) {
        const nextEmail = session.user?.email || localStorage.getItem('user_email') || null;
        setActiveSessionEmail(nextEmail);
      } else {
        setActiveSessionEmail(null);
      }

      setSessionChecked(true);
    };

    loadActiveSession();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

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

  const heading = mode === 'signup'
    ? 'Create your reservation account'
    : mode === 'recovery'
      ? 'Reset your password'
    : 'Log in to your account';

  const resetLocalAuthError = () => {
    setError('');
    setLoginStep(null);
    setWorkspaceRetryAvailable(false);
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

  const clearStoredAuthContext = () => {
    localStorage.removeItem('session_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    clearDemoSession();
    clearStoredTenantContext();
  };

  const shouldGateOnboarding = (path: string) => path.includes('/connect-amazon');

  const routeWithCapacityGate = async (targetPath: string) => {
    if (!shouldGateOnboarding(targetPath)) {
      navigate(targetPath, { replace: true });
      return;
    }

    try {
      const capacity = await api.getOnboardingCapacity();
      if (capacity.ok && capacity.data && !capacity.data.allowed) {
        navigate('/waitlist?reason=capacity', { replace: true });
        return;
      }
    } catch {
      // If capacity check fails, continue with normal onboarding navigation.
    }

    navigate(targetPath, { replace: true });
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
      tenant?: { id: string; slug: string; foundingReservation?: boolean; foundingActivationReady?: boolean };
    }>('/api/auth/bootstrap', {
      workspaceName,
      preferredTenantSlug: normalizeTenantSlug(preferredTenantSlug || localStorage.getItem('active_tenant_slug')),
      foundingReservation: intent === 'onboarding' || hasFoundingReservationContext(),
    });

    applyFoundingActivationState({
      reserved: bootstrapResponse.data?.tenant?.foundingReservation,
      activationReady: bootstrapResponse.data?.tenant?.foundingActivationReady,
    });

    const resolvedTenantSlug = normalizeTenantSlug(bootstrapResponse.data?.tenant?.slug);
    if (bootstrapResponse.ok && resolvedTenantSlug && bootstrapResponse.data?.tenant?.id) {
      localStorage.setItem('active_tenant_id', bootstrapResponse.data.tenant.id);
      localStorage.setItem('active_tenant_slug', resolvedTenantSlug);
      return resolvedTenantSlug;
    }

    throw new Error('Unable to resolve a workspace for this account.');
  };

  const routeExistingSession = async () => {
    const sessionEmail = activeSessionEmail || localStorage.getItem('user_email') || '';
    const resolvedTenantSlug = await resolveTenantSlugForAuthenticatedUser(sessionEmail);
    const targetPath = nextPath !== '/app'
      ? bindPathToTenant(nextPath, resolvedTenantSlug)
      : `/app/${resolvedTenantSlug}/connect-amazon`;
    await routeWithCapacityGate(targetPath);
  };

  const handleContinueExistingSession = async () => {
    setLoading(true);
    setError('');
    setLoginStep('workspace');
    setWorkspaceRetryAvailable(false);

    try {
      await routeExistingSession();
    } catch (sessionRouteError) {
      setWorkspaceRetryAvailable(true);
      setError(formatLoginError(sessionRouteError, 'workspace'));
    } finally {
      setLoading(false);
    }
  };

  const handleRetryWorkspaceRouting = async () => {
    setLoading(true);
    setError('');
    setLoginStep('workspace');
    setWorkspaceRetryAvailable(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No active session is available for workspace routing.');
      }

      const sessionEmail = session.user?.email || email.trim() || localStorage.getItem('user_email') || '';
      persistSession(session.access_token, session.user?.id, sessionEmail);
      setActiveSessionEmail(sessionEmail || null);

      const resolvedTenantSlug = await resolveTenantSlugForAuthenticatedUser(sessionEmail);
      const targetPath = nextPath !== '/app'
        ? bindPathToTenant(nextPath, resolvedTenantSlug)
        : `/app/${resolvedTenantSlug}/connect-amazon`;
      await routeWithCapacityGate(targetPath);
    } catch (retryError) {
      setWorkspaceRetryAvailable(true);
      setError(formatLoginError(retryError, 'workspace'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoWorkspaceSignIn = () => {
    setLoading(true);
    setError('');
    setLoginStep(null);
    setWorkspaceRetryAvailable(false);

    toast({
      title: 'Demo workspace ready',
      description: 'Opening the local demo workspace without Supabase Auth.',
    });

    enterDemoWorkspace();
  };

  const handleUseDifferentAccount = async () => {
    setLoading(true);
    setError('');
    setLoginStep(null);
    setWorkspaceRetryAvailable(false);

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Even if sign-out reports an issue, clear local auth state so the form is usable.
    } finally {
      clearStoredAuthContext();
      setActiveSessionEmail(null);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setLoading(false);
    }
  };

  const resetBrowserAuthForFreshLogin = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Local cleanup below is still enough to prevent stale app context from poisoning login.
    } finally {
      clearStoredAuthContext();
      setActiveSessionEmail(null);
    }
  };

  const handleClearBrowserSession = async () => {
    const currentEmail = email;
    setLoading(true);
    setError('');
    setLoginStep('account');
    setWorkspaceRetryAvailable(false);

    try {
      await resetBrowserAuthForFreshLogin();
      setEmail(currentEmail);
      setPassword('');
      setConfirmPassword('');
      setError('Browser session cleared. Enter your password and log in again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    let failureStep: LoginStep = 'account';

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
    setLoginStep('account');
    setWorkspaceRetryAvailable(false);

    try {
      if (mode === 'signup') {
        failureStep = 'account';
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });

        if (authError) {
          setLoginStep('account');
          setError(formatLoginError(authError, 'account'));
          setLoading(false);
          return;
        }

        persistSession(data.session?.access_token, data.user?.id, data.user?.email);
        setActiveSessionEmail(data.user?.email || email.trim() || null);

        toast({
          title: data.session ? 'Account created' : 'Check your inbox',
          description: data.session
            ? 'Your account is ready. Redirecting you into the workspace now.'
            : 'We sent a confirmation link to your email address.',
        });

        if (data.session) {
          failureStep = 'workspace';
          setLoginStep('workspace');
          const resolvedTenantSlug = await resolveTenantSlugForAuthenticatedUser(email.trim());
          const targetPath = intent === 'onboarding' || hasFoundingReservationContext()
            ? '/founding-500/status'
            : `/app/${resolvedTenantSlug}/connect-amazon`;
          await routeWithCapacityGate(targetPath);
        } else {
          setMode('login');
        }
        setLoading(false);
        return;
      }

      if (mode === 'recovery') {
        failureStep = 'account';
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });

        if (updateError) {
          setLoginStep('account');
          setError(formatLoginError(updateError, 'account'));
          setLoading(false);
          return;
        }

        toast({
          title: 'Password updated',
          description: 'You can continue into your workspace now.',
        });

        setConfirmPassword('');
        failureStep = 'workspace';
        setLoginStep('workspace');
        const resolvedTenantSlug = await resolveTenantSlugForAuthenticatedUser(email.trim() || localStorage.getItem('user_email') || '');
        await routeWithCapacityGate(`/app/${resolvedTenantSlug}/connect-amazon`);
        setLoading(false);
        return;
      }

      failureStep = 'account';
      if (isPaystackReviewerEmail(email)) {
        await resetBrowserAuthForFreshLogin();

        const reviewerResponse = await api.post<DemoReviewerLoginResponse>('/api/auth/demo-reviewer/login', {
          email: email.trim(),
          password,
        });

        if (!reviewerResponse.ok || !reviewerResponse.data?.success) {
          setLoginStep('account');
          const reviewerError = reviewerResponse.status === 401
            ? 'The reviewer email or password is incorrect.'
            : reviewerResponse.status === 503
              ? 'Reviewer access is not available right now.'
              : reviewerResponse.error || 'Reviewer access is not available right now.';
          setError(reviewerError);
          return;
        }

        seedDemoSession({ userEmail: reviewerResponse.data.user?.email || email.trim() });
        setActiveSessionEmail(reviewerResponse.data.user?.email || email.trim());

        toast({
          title: 'Reviewer workspace ready',
          description: 'Opening the Acme Operations demo workspace.',
        });

        navigate(reviewerResponse.data.redirectPath || `/app/${DEMO_TENANT_SLUG}/dashboard`, { replace: true });
        return;
      }

      await resetBrowserAuthForFreshLogin();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setLoginStep('account');
        setError(formatLoginError(authError, 'account'));
        setLoading(false);
        return;
      }

      persistSession(data.session?.access_token, data.user?.id, data.user?.email);
      setActiveSessionEmail(data.user?.email || email.trim() || null);

      toast({
        title: 'Logged in',
        description: 'Redirecting you into your workspace now.',
      });

      failureStep = 'workspace';
      setLoginStep('workspace');
      const resolvedTenantSlug = await resolveTenantSlugForAuthenticatedUser(email.trim());
      const targetPath = nextPath !== '/app'
        ? bindPathToTenant(nextPath, resolvedTenantSlug)
        : `/app/${resolvedTenantSlug}/connect-amazon`;
      await routeWithCapacityGate(targetPath);
    } catch (loginError: unknown) {
      setWorkspaceRetryAvailable(failureStep === 'workspace');
      setError(formatLoginError(loginError, failureStep));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email first so we know where to send the reset link.');
      setLoginStep('account');
      return;
    }

    setLoading(true);
    setError('');
    setLoginStep('account');
    setWorkspaceRetryAvailable(false);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login?mode=recovery`,
      });

      if (resetError) {
        setError(formatLoginError(resetError, 'account'));
        setLoading(false);
        return;
      }

      toast({
        title: 'Reset email sent',
        description: 'Check your inbox for the secure password reset link.',
      });
    } catch (resetError) {
      setError(formatLoginError(resetError, 'account'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FAFAF7] text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]"
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_34%),radial-gradient(circle_at_84%_0%,rgba(46,125,91,0.1),transparent_32%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_18%_100%,rgba(191,216,234,0.24),transparent_44%),radial-gradient(circle_at_76%_88%,rgba(255,255,255,0.7),transparent_48%)]" />
      </div>

      <PublicNavbar variant="light" />

      <main className="relative z-10 px-4 pb-24 pt-28 md:px-6 md:pb-28 md:pt-32">
        <div className="mx-auto max-w-[860px] space-y-8">
          <section className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#DCE8EE] bg-white/78 px-3 py-1.5 text-[11px] font-semibold tracking-tight text-[#0B74DE] shadow-[0_14px_40px_rgba(37,49,58,0.06)] backdrop-blur">
              <span>Workspace access</span>
              <span className="h-1 w-1 rounded-full bg-[#0B74DE]/80" />
              <span className="text-[#66737F]">
                {mode === 'signup' ? 'Create account' : mode === 'recovery' ? 'Reset password' : 'Sign in'}
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-[620px] text-[38px] font-semibold leading-[0.95] tracking-[-0.06em] text-[#182026] md:text-[60px]">
                {heading}
              </h1>
              <p className="max-w-[560px] text-[16px] leading-7 text-[#4D5B66] md:text-lg md:leading-8">
                {intent === 'upload-csv' && mode === 'login'
                  ? 'Sign in to upload files into your workspace. Data import starts after account access, not before.'
                  : intent === 'onboarding'
                    ? 'Your Founding 500 seat is reserved first. Platform activation begins after payment reconciliation and founder onboarding readiness.'
                    : 'Your Margin account gets you into the workspace first. Amazon, Gmail, and other providers are connected after that from inside the product.'}
              </p>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[18px] border border-[#CFE0EA] bg-white p-5 shadow-[0_34px_100px_rgba(37,49,58,0.11)] md:p-7">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#0B74DE]/24 to-transparent" />
            <div className="pointer-events-none absolute -right-16 top-10 h-32 w-32 rounded-full bg-[#0B74DE]/10 blur-3xl" />

            <div className="relative">
              <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">
                    {mode === 'signup' ? 'New account' : mode === 'recovery' ? 'Password recovery' : 'Existing account'}
                  </div>
                  <h2 className="text-[28px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] md:text-[34px]">
                    {mode === 'signup'
                      ? 'Create your reservation access'
                      : mode === 'recovery'
                        ? 'Set your new password'
                        : 'Enter your details'}
                  </h2>
                </div>

                <div className="rounded-full border border-[#DCE8EE] bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-semibold tracking-tight text-[#66737F]">
                  Account step
                </div>
              </div>

              {sessionChecked && activeSessionEmail && mode === 'login' ? (
                <div className="mb-5 rounded-[12px] border border-[#DCE8EE] bg-[#F8FAFC] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#66737F]">
                    Active session found
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#4D5B66]">
                    You are already signed in as <span className="font-semibold text-[#182026]">{activeSessionEmail}</span>.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      onClick={() => void handleContinueExistingSession()}
                      disabled={loading}
                      className="h-11 justify-between rounded-[5px] bg-[#0B74DE] px-4 text-[12px] font-semibold tracking-tight text-white hover:bg-[#0869C9]"
                    >
                      Continue with this account
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleUseDifferentAccount()}
                      disabled={loading}
                      className="h-11 rounded-[5px] border-[#CFE0EA] bg-white px-4 text-[12px] font-semibold tracking-tight text-[#25313A] hover:bg-[#F3F6F8]"
                    >
                      Use different account
                    </Button>
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-semibold tracking-tight text-[#66737F]">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A99A4]" />
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
                    className="h-14 rounded-[5px] border-[#CFE0EA] bg-white pl-11 text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[11px] font-semibold tracking-tight text-[#66737F]">
                  {mode === 'recovery' ? 'New Password' : 'Password'}
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A99A4]" />
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
                    className="h-14 rounded-[5px] border-[#CFE0EA] bg-white pl-11 pr-11 text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A99A4] transition-colors hover:text-[#182026]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === 'recovery' ? (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[11px] font-semibold tracking-tight text-[#66737F]">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A99A4]" />
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
                      className="h-14 rounded-[5px] border-[#CFE0EA] bg-white pl-11 pr-11 text-[14px] tracking-tight text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A99A4] transition-colors hover:text-[#182026]"
                      aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ) : null}

              {error && error === '__SERVICE_PREPARING__' ? (
                <div className="rounded-[12px] border border-[#CFE0EA] bg-[#F8FAFC] px-5 py-6 text-center">
                  <h3 className="text-[22px] font-semibold tracking-[-0.03em] text-[#182026] md:text-[26px]">
                    We're preparing your account.
                  </h3>
                  <p className="mx-auto mt-3 max-w-[440px] text-[14px] leading-6 text-[#4D5B66] md:text-[15px] md:leading-7">
                    Margin is currently in final setup before our official launch. If you've secured Early Access, your account will be ready shortly. We'll notify you the moment you're in.
                  </p>
                  <Button
                    asChild
                    className="mt-5 h-11 rounded-[5px] bg-[#0B74DE] px-6 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] hover:bg-[#0869C9]"
                  >
                    <Link to="/early-access">
                      Join the Founding 500
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : error ? (
                <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <p>{error}</p>
                  {loginStep ? (
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-500">
                      Failed step: {loginStep === 'account' ? 'Account sign-in' : 'Access setup'}
                    </p>
                  ) : null}
                  {workspaceRetryAvailable && mode === 'login' ? (
                    <Button
                      type="button"
                      onClick={() => void handleRetryWorkspaceRouting()}
                      disabled={loading}
                      className="mt-3 h-9 rounded-[5px] bg-[#0B74DE] px-3 text-[11px] font-semibold tracking-tight text-white hover:bg-[#0869C9]"
                    >
                      Retry access setup
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                  {!workspaceRetryAvailable && loginStep === 'account' && mode === 'login' ? (
                    <Button
                      type="button"
                      onClick={() => void handleClearBrowserSession()}
                      disabled={loading}
                      variant="outline"
                      className="mt-3 h-9 rounded-[5px] border-red-200 bg-white px-3 text-[11px] font-semibold tracking-tight text-red-700 hover:bg-red-100"
                    >
                      Clear browser session
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {demoBypassAvailable && mode === 'login' ? (
                <Button
                  type="button"
                  onClick={handleDemoWorkspaceSignIn}
                  disabled={loading}
                  variant="outline"
                  className="h-11 w-full justify-between rounded-[5px] border-[#CFE0EA] bg-white px-5 text-[13px] font-semibold tracking-tight text-[#25313A] hover:bg-[#F3F6F8]"
                >
                  Open demo workspace
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 flex-1 justify-between rounded-[5px] bg-[#0B74DE] px-5 text-[13px] font-semibold tracking-tight text-white shadow-[0_18px_40px_rgba(11,116,222,0.2)] hover:bg-[#0869C9]"
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
                <Button asChild variant="outline" className="h-12 rounded-[5px] border-[#CFE0EA] bg-white px-5 text-[13px] font-semibold tracking-tight text-[#25313A] hover:bg-[#F3F6F8]">
                  <Link to="/">
                    Back Home
                  </Link>
                </Button>
              </div>

              <div className="flex flex-col gap-3 border-t border-[#D8E3E8] pt-4 text-sm text-[#66737F] sm:flex-row sm:items-center sm:justify-between">
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
                  className="text-left transition-colors hover:text-[#182026]"
                >
                  {mode === 'signup' ? 'Already have an account? Log in' : 'No account yet? Create one'}
                </button>
                {mode !== 'recovery' ? (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-left transition-colors hover:text-[#182026] disabled:opacity-50"
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
                    className="text-left transition-colors hover:text-[#182026]"
                  >
                    Back to login
                  </button>
                )}
              </div>

              </form>
            </div>
          </section>

          <p className="mx-auto max-w-[720px] text-center text-[14px] leading-6 text-[#66737F] md:text-[15px]">
            {subtitle}
          </p>
        </div>
      </main>
      <BrandFooter />
    </div>
  );
};

export default Login;

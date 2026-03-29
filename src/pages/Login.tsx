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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        navigate(nextPath, { replace: true });
      }
    };

    redirectIfAuthenticated();

    return () => {
      isMounted = false;
    };
  }, [navigate, nextPath]);

  const intentCopy = intent === 'upload-csv'
    ? 'Sign in to upload files into your workspace. Data import happens after account access, not before.'
    : 'Use your Margin account credentials. Amazon and Gmail connections happen after login inside your workspace.';

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Enter both your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message || 'Unable to log in with those credentials.');
        setLoading(false);
        return;
      }

      if (data.session?.access_token) {
        localStorage.setItem('session_token', data.session.access_token);
      }
      if (data.user?.id) {
        localStorage.setItem('user_id', data.user.id);
      }
      if (data.user?.email) {
        localStorage.setItem('user_email', data.user.email);
      }

      toast({
        title: 'Logged in',
        description: 'Redirecting you into your workspace now.',
      });

      navigate(nextPath, { replace: true });
    } catch (loginError: any) {
      setError(loginError?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <PublicNavbar />
      <main className="px-6 pb-20 pt-32">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="border border-white/10 bg-white/[0.02] p-8 shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-10">
            <div className="mb-8 space-y-4">
              <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-tight text-white/55">
                <Lock className="h-3.5 w-3.5" />
                Account Access
              </div>
              <div className="space-y-3">
                <h1 className="font-heading text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  Log in to your workspace
                </h1>
                <p className="max-w-xl text-sm leading-6 text-white/55 md:text-base">
                  {intentCopy}
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] uppercase tracking-tight text-white/65">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError('');
                    }}
                    placeholder="you@company.com"
                    className="h-12 border-white/10 bg-black/40 pl-11 text-white placeholder:text-white/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[11px] uppercase tracking-tight text-white/65">
                  Password
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
                      setError('');
                    }}
                    placeholder="Enter your password"
                    className="h-12 border-white/10 bg-black/40 pl-11 pr-11 text-white placeholder:text-white/20"
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

              {error ? (
                <div className="border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 flex-1 rounded-none bg-white text-black hover:bg-white/90"
                >
                  {loading ? 'Signing in...' : 'Log In'}
                  {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-none border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white">
                  <Link to="/">
                    Back Home
                  </Link>
                </Button>
              </div>
            </form>
          </section>

          <aside className="border border-white/10 bg-[#080808] p-8 md:p-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-[10px] font-semibold uppercase tracking-tight text-white/35">
                  Login Truth
                </span>
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  User access and marketplace OAuth are separate flows.
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-6 text-white/50">
                <p>
                  Your account login gets you into the workspace. Amazon, Gmail, and the other providers are connected after that from Integrations Hub.
                </p>
                <p>
                  That separation is important now that the platform is running in real authenticated mode instead of the old demo fallback.
                </p>
              </div>
              <div className="space-y-3 border border-white/10 bg-white/[0.02] p-5">
                <div className="text-[10px] font-semibold uppercase tracking-tight text-white/35">
                  After Login
                </div>
                <ul className="space-y-3 text-sm text-white/60">
                  <li>Enter your workspace.</li>
                  <li>Connect Amazon or Gmail from Integrations Hub.</li>
                  <li>Upload CSVs from Data Upload when needed.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <BrandFooter />
    </div>
  );
};

export default Login;

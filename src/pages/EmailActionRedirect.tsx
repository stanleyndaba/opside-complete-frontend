import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';

function sanitizeTargetPath(value: string | null): string | null {
  const normalized = String(value || '').trim();
  if (!normalized) return null;

  const target = normalized.startsWith('/') ? normalized : `/${normalized}`;
  const match = target.match(/^\/(?:cases|recoveries)\/([a-z0-9-]{6,120})$/i);

  return match ? `/cases/${match[1]}` : null;
}

export default function EmailActionRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    const resolveRedirect = async () => {
      const tenantSlug = normalizeTenantSlug(searchParams.get('tenant'));
      const targetPath = sanitizeTargetPath(searchParams.get('target'));
      const safeTargetPath = targetPath || '/notifications';
      const appPath = tenantSlug ? tenantRoute(tenantSlug, safeTargetPath) : '/app';

      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (session?.access_token || localStorage.getItem('session_token')) {
        navigate(appPath, { replace: true });
        return;
      }

      navigate(`/login?next=${encodeURIComponent(appPath)}`, { replace: true });
    };

    void resolveRedirect();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 border-2 border-white/25 border-t-white rounded-full animate-spin" />
        <span className="text-sm text-white/60 tracking-tight">
          Opening your case in Margin...
        </span>
      </div>
    </div>
  );
}

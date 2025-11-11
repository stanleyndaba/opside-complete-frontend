import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * OAuth Callback Redirect Handler
 * Redirects from /auth/callback/integrations-hub to /integrations-hub
 * Preserves all query parameters (gmail_connected, email, outlook_connected, etc.)
 */
export default function OAuthCallbackRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract query parameters from current URL
    const searchParams = new URLSearchParams(location.search);
    
    // Build redirect URL to integrations-hub
    const redirectPath = '/integrations-hub';
    
    // Preserve all query parameters
    const queryString = searchParams.toString();
    const redirectUrl = queryString 
      ? `${redirectPath}?${queryString}`
      : redirectPath;

    // Redirect to integrations-hub with all query parameters
    navigate(redirectUrl, { replace: true });
  }, [navigate, location.search]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      backgroundColor: '#0B1220',
      color: '#e5e7eb'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '20px', fontWeight: 600 }}>Connecting your account...</h2>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Please wait while we redirect you.</p>
      </div>
    </div>
  );
}

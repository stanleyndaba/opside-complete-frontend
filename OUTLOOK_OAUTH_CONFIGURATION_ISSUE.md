# Outlook OAuth Configuration Issue

## Problem

When clicking "Connect Outlook" in the Connect Evidence Sources popup, users get the error:
```
Connection Failed, server error (500): OAuth configuration not found for provider: outlook
```

## Root Cause

The backend OAuth configuration for Outlook is **not set up**. The backend is missing the required Microsoft OAuth credentials.

## Solution

### Backend Configuration Required

The backend needs to have the following environment variables configured:

1. **Microsoft OAuth Client ID**
   - Environment variable: `OUTLOOK_CLIENT_ID` or `MICROSOFT_CLIENT_ID`
   - Get from: [Azure Portal](https://portal.azure.com/) → Azure Active Directory → App registrations

2. **Microsoft OAuth Client Secret**
   - Environment variable: `OUTLOOK_CLIENT_SECRET` or `MICROSOFT_CLIENT_SECRET`
   - Get from: Azure Portal → App registrations → Certificates & secrets

3. **Microsoft OAuth Redirect URI**
   - Environment variable: `OUTLOOK_REDIRECT_URI` or `MICROSOFT_REDIRECT_URI`
   - Should match the callback URL configured in Azure Portal
   - Format: `https://your-backend-domain.com/api/v1/integrations/outlook/callback`

4. **Microsoft OAuth Scopes**
   - Required scopes: `https://graph.microsoft.com/Mail.Read`, `https://graph.microsoft.com/User.Read`
   - These should be configured in the backend OAuth handler

### Backend Code Required

The backend should have:

1. **OAuth Configuration Handler**
   - File: `evidenceSourcesController.ts` or similar
   - Should handle Outlook provider similar to Gmail
   - Should read environment variables for Outlook credentials

2. **OAuth Routes**
   - `POST /api/v1/integrations/outlook/connect` - Initiate OAuth
   - `GET /api/v1/integrations/outlook/callback` - Handle OAuth callback
   - `GET /api/v1/integrations/outlook/status` - Check connection status

3. **Token Storage**
   - Store Outlook tokens in database (similar to Gmail)
   - Use `tokenManager` or similar service

### Azure Portal Setup

1. **Create App Registration**
   - Go to Azure Portal → Azure Active Directory → App registrations
   - Click "New registration"
   - Name: "Clario Outlook Integration"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: `https://your-backend-domain.com/api/v1/integrations/outlook/callback`

2. **Configure API Permissions**
   - Go to "API permissions"
   - Add permissions:
     - Microsoft Graph → Delegated permissions:
       - `Mail.Read` - Read user mail
       - `User.Read` - Sign in and read user profile
   - Click "Grant admin consent" (if applicable)

3. **Create Client Secret**
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Description: "Outlook OAuth Secret"
   - Expires: Choose appropriate expiration
   - Copy the secret value (you'll need this for the backend)

4. **Get Client ID**
   - Go to "Overview"
   - Copy the "Application (client) ID" (you'll need this for the backend)

### Testing

After backend configuration:

1. **Test OAuth Flow**
   - Click "Connect Outlook" in the frontend
   - Should redirect to Microsoft OAuth consent page
   - After consent, should redirect back to frontend
   - Should show "Outlook Connected Successfully" toast

2. **Verify Token Storage**
   - Check backend database for Outlook tokens
   - Verify token is stored correctly
   - Verify token can be refreshed

3. **Test Ingestion**
   - After connection, test Outlook ingestion
   - Should be able to ingest emails from Outlook
   - Should be able to extract attachments

## Frontend Changes

The frontend has been updated to:
- Show clearer error messages for OAuth configuration issues
- Handle 500 errors gracefully
- Provide helpful guidance to users

## Status

- ✅ Frontend error handling improved
- ❌ Backend OAuth configuration missing
- ❌ Azure Portal app registration needed
- ❌ Environment variables need to be set

## Next Steps

1. **Backend Team**: Set up Outlook OAuth configuration
2. **DevOps Team**: Configure environment variables
3. **Testing**: Test OAuth flow after configuration
4. **Documentation**: Update backend documentation with Outlook OAuth setup

## Related Files

- `src/pages/IntegrationsHub.tsx` - Frontend OAuth handler
- `src/lib/api.ts` - API client for OAuth endpoints
- Backend: `evidenceSourcesController.ts` - Backend OAuth handler (needs Outlook configuration)
- Backend: Environment variables configuration

## References

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [Azure AD OAuth 2.0 Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [PHASE4_EVIDENCE_INGESTION_INVENTORY.md](./PHASE4_EVIDENCE_INGESTION_INVENTORY.md) - Phase 4 documentation


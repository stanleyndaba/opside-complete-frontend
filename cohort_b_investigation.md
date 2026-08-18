# Cohort B Route Continuity Investigation

## Observed production journey

Fresh anonymous seller selected `Use Amazon Reports`, reached `/data-upload`, created a `csv_upload` audit intent, authenticated, and was sent to `/app/gmail-2/connect-amazon` instead of the Manual Report workspace.

## Root cause

The server-owned intent was passed to `/api/auth/bootstrap` through `auditIntentId`, but the Clerk signup finalization path in `src/pages/Login.tsx` did not enforce the returned `intent.source_type` when selecting the post-auth target. It used `intent.return_path` if present and otherwise fell through to `nextPath` or `getDefaultWorkspaceLanding()`. Because the manual login URL has no `next` parameter, the default landing was `/app/{tenantSlug}/connect-amazon`.

A csv-upload fallback existed only in the existing-session routing branch. It did not cover the fresh signup path that Cohort B exercises, so runtime behavior disproved the earlier assumption that the frontend route lock covered all authentication branches.

## Additional routing issue

`tenantRoute('/data-upload', tenantSlug)` would produce `/app/{tenantSlug}/data-upload`, even though the frozen Cohort B contract requires the public route `/data-upload` after authentication. The public route is registered in `src/App.tsx` and `DataUpload.tsx` already renders its authenticated operational state based on Clerk session state.

## Implemented direction

`Login.tsx` now centralizes post-auth target resolution. When the server returns an authoritative `intent.source_type === 'csv_upload'`, every relevant authentication path returns exactly `/data-upload`. Other intent routes continue using their server return path, tenant binding, or established default behavior.

The fix does not invoke Amazon authorization, does not modify the Connected route, and does not replace the server-owned intent with a cosmetic URL-only redirect: the manual route is selected only after the bootstrap response confirms `csv_upload`.

## Verification so far

The production Vite build passed after the Login.tsx change. Manual Cohort B recertification remains required after deployment.

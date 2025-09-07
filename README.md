# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a8baea9a-97ae-4008-b023-5de63357c0e2

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a8baea9a-97ae-4008-b023-5de63357c0e2) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a8baea9a-97ae-4008-b023-5de63357c0e2) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

## Backend integration setup

1. Create a `.env.local` (not committed) based on `.env.example`:

```
VITE_API_URL=/api
VITE_API_PROXY_TARGET=http://localhost:3000
```

2. Dev proxy: requests to `/api` are forwarded to `VITE_API_PROXY_TARGET` (see `vite.config.ts`). This avoids CORS in development.

3. API client: use `apiRequest` from `src/lib/api.ts` for all HTTP calls. It automatically adds `Authorization: Bearer <token>` from `localStorage` key `auth_token` and supports timeouts and JSON error handling.

4. Health check: `useApiHealth` in `src/hooks/use-api-health.ts` queries `/health`.

5. Example page using backend: `src/pages/Stocks.tsx` fetches from `/stocks` with React Query. It shows loading and gracefully falls back to mock data on error.

6. Production: set `VITE_API_URL` to your public API origin or keep `/api` and have your reverse proxy route it to the backend. Ensure your server CORS allows your frontend origin if served cross-origin.

7. Auth: store short-lived access tokens in memory or `localStorage` (demo). Prefer httpOnly cookies in production when possible. Use `setAuthToken` from `src/lib/api.ts` for token updates.

## Production reverse-proxy and observability

- Reverse proxy
  - In production, keep client requests under `/api` and configure your reverse proxy (NGINX, Cloudflare, etc.) to route `/api` to your API origin (e.g., `https://api.yourdomain.com`).
  - Alternatively, set `VITE_API_URL=https://api.yourdomain.com` and serve without a path proxy.

- Sentry (optional)
  - Add your DSN to a runtime script or env and expose it on `window.SENTRY_DSN`.
  - If you load Sentry in your HTML (e.g., via CDN), `ErrorBoundary` will call `Sentry.captureException` automatically.
  - Example (index.html):
```
<script>
  window.SENTRY_DSN = "https://<key>@o<org>.ingest.sentry.io/<project>";
</script>
<script src="https://browser.sentry-cdn.com/7.118.0/bundle.min.js" crossorigin="anonymous"></script>
```

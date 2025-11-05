# Render Service Setup Guide

## Step 1: Create New Render Account (if out of pipeline minutes)

1. Go to https://dashboard.render.com
2. Click "Get Started" or "Sign Up"
3. Sign up with:
   - **Different email** (if you want fresh quota)
   - OR use existing account (if quota resets soon)

## Step 2: Create New Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub account (if not already connected)
3. Select your **backend repository** (the one with your Node.js API)
4. Configure the service:

### Service Configuration:
- **Name**: `opside-node-api-new` (or any name you prefer)
- **Region**: Choose closest to your users (e.g., `Oregon (US West)`)
- **Branch**: `main` (or your main branch)
- **Root Directory**: Leave empty (or specify if backend is in subfolder)
- **Environment**: `Node`
- **Build Command**: 
  ```bash
  npm install
  ```
  (or your build command if different)
- **Start Command**: 
  ```bash
  npm start
  ```
  (or `node server.js`, `npm run start`, etc. - check your backend's package.json)
- **Plan**: **Free** (or upgrade if needed)

## Step 3: Set Environment Variables

1. After creating the service, go to **"Environment"** tab
2. Copy ALL environment variables from your old Render service:
   - Go to old service → Environment tab
   - Copy each variable name and value
3. Add them to the new service:
   - Click **"Add Environment Variable"**
   - Paste name and value
   - Repeat for all variables

### Common Environment Variables (check your backend):
```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-secret-key
DATABASE_URL=your-database-url
AMAZON_SPAPI_CLIENT_ID=your-client-id
AMAZON_SPAPI_CLIENT_SECRET=your-secret
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
FRONTEND_URL=https://your-frontend.vercel.app
... (add all your backend env vars)
```

## Step 4: Deploy

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
   - OR wait for auto-deploy (if auto-deploy is enabled)
2. Monitor the build logs
3. Wait for deployment to complete (usually 2-5 minutes)
4. Copy the **service URL**: `https://opside-node-api-new.onrender.com`

## Step 5: Update Frontend API URL

Once you have the new backend URL, update the frontend:

### Option A: Update in code (src/lib/api.ts)
Change line 17:
```typescript
const productionBackend = 'https://opside-node-api-new.onrender.com';
```

### Option B: Use Environment Variable (Recommended)
Set in Vercel dashboard:
1. Go to Vercel project settings
2. Go to "Environment Variables"
3. Add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://opside-node-api-new.onrender.com`
   - **Environment**: Production, Preview, Development

### Option C: Quick update script
Run this command to update the API URL:
```bash
# If using PowerShell (Windows)
(Get-Content src/lib/api.ts) -replace 'opside-node-api.onrender.com', 'opside-node-api-new.onrender.com' | Set-Content src/lib/api.ts

# If using Bash (Mac/Linux)
sed -i 's/opside-node-api.onrender.com/opside-node-api-new.onrender.com/g' src/lib/api.ts
```

## Step 6: Test the New Backend

1. Visit: `https://opside-node-api-new.onrender.com/api/v1/integrations/status`
2. Should return JSON response (or 401 if auth required)
3. Test from frontend - connect Amazon account and verify sync works

## Step 7: Deploy Frontend Changes

1. Commit the API URL change:
   ```bash
   git add src/lib/api.ts
   git commit -m "Update backend API URL to new Render service"
   git push origin main
   ```
2. Vercel will auto-deploy
3. Test the full flow end-to-end

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Verify build command is correct
- Check Node.js version compatibility

### Service Won't Start
- Check start command matches your package.json
- Verify PORT environment variable is set
- Check logs for error messages

### Environment Variables Missing
- Copy all variables from old service
- Double-check variable names match backend expectations

### Still Getting 404
- Wait 30-60 seconds (Render free tier cold start)
- Check service is actually running (not sleeping)
- Verify the endpoint path is correct

## Alternative: Use Railway Instead

If Render continues to have issues, consider Railway:

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your backend repository
5. Railway auto-detects Node.js and deploys
6. Add environment variables in Railway dashboard
7. Get your Railway URL: `https://your-app.up.railway.app`
8. Update frontend API URL to Railway URL

Railway free tier includes $5/month credit, which is usually enough for small projects.



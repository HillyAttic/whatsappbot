# Service Worker Update Guide

## Issue
After updating the service worker configuration to properly handle API routes, users with the old cached service worker may experience login issues.

## Solution
Clear the old service worker cache and reload the application.

### Method 1: Browser DevTools (Recommended)
1. Open your browser's Developer Tools (F12 or Right-click → Inspect)
2. Go to the **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
3. In the left sidebar, find **Service Workers**
4. Click **Unregister** next to the service worker
5. Go to **Storage** → **Clear site data** (or **Clear Storage**)
6. Check all boxes and click **Clear site data**
7. Close DevTools and **hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)

### Method 2: Browser Settings
1. Go to your browser settings
2. Navigate to **Privacy and Security** → **Clear browsing data**
3. Select **Cached images and files** and **Cookies and other site data**
4. Choose **All time** as the time range
5. Click **Clear data**
6. Restart your browser

### Method 3: Incognito/Private Window (Quick Test)
Open the application in an incognito/private window to test without clearing your main browser cache.

## Verification
After clearing:
1. Visit the login page
2. Open DevTools → Console
3. You should see: `Service Worker registered: ...`
4. Login should work without errors
5. Check Console — no "No route found for: /api/auth/login" errors

## What Changed
- Service worker now properly bypasses `/api/*` routes
- API calls (login, auth verification, data fetching) go directly to the network
- Static assets are still cached for offline support

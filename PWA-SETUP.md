# PWA Setup

Your Next.js app is now a Progressive Web App (PWA) with offline support!

## What's Included

✅ **Installable** - Users can install the app on their devices
✅ **Offline Support** - App works offline with intelligent caching
✅ **Service Worker** - Automatic caching of static assets and API responses
✅ **Web App Manifest** - Proper app metadata for installation
✅ **App Icons** - SVG icons (replace with your logo)

## Files Added/Modified

- `app/sw.ts` - Service worker configuration
- `app/manifest.ts` - Web app manifest
- `components/ServiceWorkerRegistration.tsx` - Service worker registration
- `next.config.js` - Serwist integration
- `tsconfig.json` - Added webworker types
- `.env.local` - Added Turbopack warning suppression
- `public/icon-192.svg` - App icon (192x192)
- `public/icon-512.svg` - App icon (512x512)

## Caching Strategy

The service worker uses intelligent caching:
- **Static assets** (JS, CSS, images): StaleWhileRevalidate
- **API calls**: NetworkFirst with 10s timeout
- **Fonts**: CacheFirst for performance
- **Next.js data**: StaleWhileRevalidate

## Testing the PWA

### Development
```bash
npm run dev
```

### Production (Required for full PWA features)
```bash
npm run build
npm start
```

Then visit `http://localhost:3000` and:
1. Open DevTools → Application → Service Workers
2. Check "Offline" to test offline functionality
3. Look for the install prompt in your browser

## Customization

### Replace Icons
Replace `public/icon-192.svg` and `public/icon-512.svg` with your actual logo.
For PNG icons, convert the SVGs and update `app/manifest.ts`.

### Adjust Caching
Edit `app/sw.ts` to customize caching strategies for your needs.

### Change Theme Color
Update the theme color in `app/layout.tsx` (viewport export).

## Deployment

PWAs require HTTPS in production. Deploy to:
- Vercel (automatic HTTPS)
- Netlify (automatic HTTPS)
- Any hosting with SSL certificate

## Browser Support

- ✅ Chrome/Edge (full support)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox
- ⚠️ Safari desktop (limited install support)

## Resources

- [Serwist Documentation](https://serwist.pages.dev)
- [Next.js PWA Guide](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)

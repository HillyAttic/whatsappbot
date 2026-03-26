# Netlify Deployment Guide

## ✅ Build Fixed!

The build errors have been resolved:
- Fixed TypeScript type error in `firebase-admin.ts`
- Removed deprecated `serverActions` config from `next.config.js`

## 🚀 Deploy to Netlify

### Step 1: Login to Netlify

```powershell
netlify login
```

This will open a browser window. Authorize the Netlify CLI.

### Step 2: Initialize Netlify Project

```powershell
netlify init
```

Select the following options when prompted:
- **Create & configure a new site**: Yes
- **Choose your team**: (select your team)
- **Your site name**: (choose a unique name, e.g., `whatsapp-bot-docs`)

### Step 3: Set Environment Variables

You need to add all environment variables to Netlify:

**Option A: Via CLI**
```powershell
netlify env:set WHATSAPP_TOKEN "your_token_here"
netlify env:set PHONE_NUMBER_ID "your_phone_id_here"
netlify env:set WEBHOOK_VERIFY_TOKEN "your_verify_token_here"
netlify env:set APP_SECRET "your_app_secret_here"
netlify env:set FIREBASE_SERVICE_ACCOUNT_JSON "{\"type\":\"service_account\",...}"
```

**Option B: Via Netlify Dashboard** (Recommended for complex JSON)
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Select your site
3. Navigate to **Site configuration** → **Environment variables**
4. Add each variable from `.env.local`:
   - `WHATSAPP_TOKEN`
   - `PHONE_NUMBER_ID`
   - `WEBHOOK_VERIFY_TOKEN`
   - `APP_SECRET`
   - `FIREBASE_SERVICE_ACCOUNT_JSON` (paste entire JSON object)
   - All `NEXT_PUBLIC_FIREBASE_*` variables

### Step 4: Deploy

```powershell
netlify deploy --prod
```

This will:
- Build your Next.js app
- Deploy to production
- Give you a permanent URL like: `https://your-site-name.netlify.app`

### Step 5: Update WhatsApp Webhook

Once deployed, update your webhook URL in Meta Developer Dashboard:

```
https://your-site-name.netlify.app/.netlify/functions/api/webhook
```

**Important**: Netlify functions have a different path structure than Vercel!

1. Go to [Meta Developers Dashboard](https://developers.facebook.com/)
2. Select your app → WhatsApp → Configuration
3. Update webhook URL to the Netlify functions URL above
4. Verify the webhook (it will use your `WEBHOOK_VERIFY_TOKEN`)

## 📝 Important Notes

### Netlify vs Vercel URL Structure

- **Vercel**: `https://yoursite.vercel.app/api/webhook`
- **Netlify**: `https://yoursite.netlify.app/.netlify/functions/api/webhook`

### Automatic Deploys

If you connected GitHub during setup:
- Every push to `main` branch will auto-deploy
- Pull requests create preview deployments
- You can manage this in Netlify dashboard under **Deploys**

### Troubleshooting

**Build fails on Netlify but works locally:**
- Check environment variables are set correctly
- Review build logs in Netlify dashboard
- Ensure `FIREBASE_SERVICE_ACCOUNT_JSON` is valid JSON string

**Webhook not receiving messages:**
- Verify webhook URL includes `/.netlify/functions/` prefix
- Check webhook signature validation is working
- Ensure all environment variables are set in Netlify

## 🔄 Quick Deploy Commands

```powershell
# Build and deploy to production
netlify deploy --prod

# Deploy with build
npm run build; netlify deploy --prod

# Check deployment status
netlify status

# View deployment logs
netlify deploy --prod --message "Your commit message"
```

## 🎯 What's Next?

After successful deployment:
1. Test webhook by sending "Hi" to your WhatsApp bot
2. Monitor logs in Netlify dashboard → **Functions** → **Logs**
3. Set up alerts for failed deployments if needed

---

**Need help?** Run `netlify help` or visit [Netlify Docs](https://docs.netlify.com/)

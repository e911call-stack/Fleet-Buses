# 🚀 FleetGuard Deployment Guide

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm run test`)
- [ ] TypeScript compilation succeeds (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] No console errors or warnings
- [ ] Code review completed

### Security
- [ ] No API keys/secrets in source code
- [ ] `.env.local` is NOT committed to git
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] SQL injection protection verified
- [ ] XSS protection enabled

### Configuration
- [ ] All required environment variables set
- [ ] Database migrations tested on staging
- [ ] RLS policies reviewed and tested
- [ ] Stripe webhooks configured
- [ ] WhatsApp Business account verified
- [ ] Email templates configured

### Database
- [ ] Backup created (Supabase auto-backups enabled)
- [ ] Migrations tested in staging
- [ ] Indexes optimized
- [ ] No unused tables/columns
- [ ] Retention policies set

### Monitoring & Logging
- [ ] Sentry configured for error tracking
- [ ] PostHog configured for analytics
- [ ] CloudFlare/WAF enabled
- [ ] Error alerting set up
- [ ] Performance monitoring enabled

---

## Deployment Steps

### 1. Prepare Environment Variables

Create a `.env.production` file (or use Vercel dashboard):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...

# Stripe (Live Keys!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# WhatsApp
WHATSAPP_ACCESS_TOKEN=EAAxxx...
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789

# MapLibre
NEXT_PUBLIC_MAPLIBRE_STYLE_URL=https://demotiles.maplibre.org/style.json

# App URLs
NEXT_PUBLIC_APP_URL=https://fleetguard.vercel.app
VERCEL_URL=fleetguard.vercel.app
```

### 2. Setup Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link local project to Vercel
vercel link

# Pull environment variables from Vercel
vercel env pull
```

### 3. Configure in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add all variables from `.env.production`
5. Set them for **Production** environment
6. Go to **Settings → Git** and configure:
   - Production branch: `main`
   - Preview deployments: Enabled for all branches

### 4. Configure Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Webhooks** under Developers
3. Add endpoint:
   - **URL:** `https://your-domain.vercel.app/api/webhooks/stripe`
   - **Events to send:** All events
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. Database Migration

```bash
# Apply migrations to production database
psql postgresql://<user>:<password>@<host>:<port>/<database> < packages/supabase/migrations/001_multi_tenant_setup.sql

# Or using Supabase CLI
supabase db push --db-url postgresql://...
```

### 6. Create Test Tenant (First Time Setup)

```sql
INSERT INTO tenants (name, slug, plan, subscription_status, primary_color, secondary_color)
VALUES (
  'Test School',
  'test-school',
  'pro',
  'active',
  '#007BFF',
  '#6C757D'
) ON CONFLICT (slug) DO NOTHING;
```

### 7. Deploy to Vercel

**Option A: Via GitHub (Recommended)**
```bash
# Push to main branch
git add .
git commit -m "Deploy to production"
git push origin main

# Vercel automatically deploys on push to main
```

**Option B: Via CLI**
```bash
vercel --prod
```

### 8. Verify Deployment

1. Check deployment URL: https://fleetguard.vercel.app
2. Verify all pages load correctly
3. Test authentication (login with Google)
4. Test multi-tenant routing:
   - Go to: `https://fleetguard.vercel.app/test-school/dashboard`
5. Check database connectivity
6. Verify Stripe webhook: https://dashboard.stripe.com/webhooks
7. Check error logs: https://vercel.com/dashboard

### 9. Setup Monitoring

**Sentry:**
```bash
npm install @sentry/nextjs
# Configure in next.config.js
# Get DSN from https://sentry.io
```

**PostHog:**
```bash
npm install posthog-js
# Add to _app.tsx
# Get API key from https://posthog.com
```

### 10. Enable Edge Caching

In `next.config.js`:
```javascript
headers: async () => [
  {
    source: '/api/:path*',
    headers: [
      { key: 'Cache-Control', value: 'no-cache' },
    ],
  },
  {
    source: '/:path*',
    headers: [
      { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600' },
    ],
  },
];
```

---

## Post-Deployment

### Monitoring
- [ ] Check Vercel Analytics dashboard
- [ ] Monitor error rates in Sentry
- [ ] Watch API response times
- [ ] Check database performance in Supabase
- [ ] Verify Stripe webhooks are receiving events

### Testing
- [ ] Test login flow (Google OAuth)
- [ ] Create a test bus and trip
- [ ] Test QR code scanning flow
- [ ] Verify WhatsApp notifications send
- [ ] Test payment flow with Stripe test card
- [ ] Check multi-tenant data isolation

### Backup
- [ ] Enable Vercel backup
- [ ] Setup Supabase daily backups
- [ ] Document rollback procedure
- [ ] Test restore from backup

---

## Rollback Procedure

If critical issues occur:

### Option 1: Revert Last Deployment
```bash
# Via Vercel Dashboard:
# 1. Go to Deployments tab
# 2. Click the previous successful deployment
# 3. Click "Promote to Production"

# Via CLI:
vercel --prod --confirm
```

### Option 2: Revert Git Commit
```bash
git revert HEAD
git push origin main
# Vercel will automatically redeploy
```

---

## Environment Variables Reference

| Variable | Type | Purpose | Example |
|----------|------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | String | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | String | Supabase anonymous key | `eyJxxx...` |
| `STRIPE_SECRET_KEY` | Secret | Stripe secret key | `sk_live_xxx` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | String | Stripe public key | `pk_live_xxx` |
| `STRIPE_WEBHOOK_SECRET` | Secret | Stripe webhook signing secret | `whsec_xxx` |
| `WHATSAPP_ACCESS_TOKEN` | Secret | Meta WhatsApp API token | `EAAxxx...` |
| `WHATSAPP_PHONE_NUMBER_ID` | String | WhatsApp Business phone ID | `123456789` |
| `NEXT_PUBLIC_MAPLIBRE_STYLE_URL` | String | MapLibre style URL | `https://demotiles...` |
| `NEXT_PUBLIC_APP_URL` | String | Public app URL | `https://fleetguard.io` |

---

## Troubleshooting

### Vercel Build Fails
```
Error: Build failed
```
**Solutions:**
- Check build logs in Vercel dashboard
- Verify TypeScript compiles: `npm run type-check`
- Clear cache: Vercel → Settings → Deployment → Redeploy
- Check environment variables are set

### Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solutions:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check Supabase project is active
- Verify RLS policies aren't blocking access
- Check database backups are restored

### Stripe Webhook Not Receiving Events
**Solutions:**
- Verify webhook endpoint URL is correct
- Check webhook signing secret matches `STRIPE_WEBHOOK_SECRET`
- Look at webhook attempts in Stripe dashboard
- Verify endpoint returns 200 status

### WhatsApp Messages Not Sending
**Solutions:**
- Verify `WHATSAPP_ACCESS_TOKEN` is valid
- Check phone number format (use +1234567890)
- Verify template is approved in Meta Business Manager
- Check WhatsApp Business Account is active

---

## Performance Optimization

```javascript
// next.config.js
const nextConfig = {
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  
  // Enable caching
  headers: async () => [{
    source: '/:path*',
    headers: [{
      key: 'Cache-Control',
      value: 'public, max-age=3600, s-maxage=86400',
    }],
  }],
};
```

---

## Security Hardening

1. **CORS Configuration**
   ```typescript
   // api/middleware.ts
   export function corsMiddleware(req, res) {
     res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL);
     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
   }
   ```

2. **Rate Limiting**
   ```typescript
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100,
   });
   ```

3. **HTTPS Redirect**
   ```javascript
   // next.config.js
   redirects: async () => [{
     source: '/:path*',
     destination: 'https://:host/:path*',
     permanent: true,
   }],
   ```

---

## Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Sentry Dashboard:** https://sentry.io/organizations/
- **GitHub Repository:** https://github.com/jeepooly-blip/fleetguard-saas

---

## Getting Help

If you encounter issues:
1. Check [GitHub Issues](https://github.com/jeepooly-blip/fleetguard-saas/issues)
2. Search [Documentation](./docs)
3. Contact [support@fleetguard.io](mailto:support@fleetguard.io)
4. Join [Slack Community](https://slack.fleetguard.io)

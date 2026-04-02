# 🚌 FleetGuard SaaS - Multi-Tenant School Transportation Platform

<div align="center">

[![Build and Deploy](https://github.com/jeepooly-blip/fleetguard-saas/actions/workflows/deploy.yml/badge.svg)](https://github.com/jeepooly-blip/fleetguard-saas/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vercel Status](https://img.shields.io/badge/Vercel-Deployed-00C7B7)](https://fleetguard.vercel.app)

**Real-time student safety. Zero complexity.**

A production-ready, multi-tenant SaaS platform for school transportation management. White-label ready. Deployed on Vercel.

[Live Demo](https://fleetguard.vercel.app) • [Documentation](./docs) • [Pricing](https://fleetguard.vercel.app/pricing)

</div>

---

## 🎯 Features

### For School Administrators
- 📍 **Real-time Fleet Tracking** - See all buses on an interactive map with live GPS updates
- 📊 **Advanced Analytics** - Dashboard with KPIs, performance metrics, and compliance reports
- 👥 **Student Management** - Enroll students, assign routes, manage subscriptions
- 🚌 **Bus Operations** - Track maintenance, manage schedules, monitor driver compliance
- 📱 **Multi-tenant** - Manage multiple schools from one platform
- 🎨 **White-Label** - Custom branding with logos, colors, and domain

### For Drivers
- 🗺️ **Route Navigation** - Turn-by-turn directions to each stop
- ✅ **QR Code Scanning** - Verify student boarding with dynamic QR codes
- 📍 **Real-time Location Sharing** - Automatic GPS tracking and parent notifications
- 📴 **Offline-First** - Mobile app works without internet (sync when connected)

### For Parents
- 📍 **Live Location Tracking** - See where your child's bus is in real-time
- 💬 **WhatsApp Notifications** - Get instant alerts when child boards/arrives
- 📊 **Attendance History** - View daily attendance records
- 🔔 **Alerts & Notifications** - Emergency alerts and schedule changes

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│        FleetGuard Multi-Tenant Platform        │
├─────────────────────────────────────────────────┤
│  Next.js 14 + TypeScript + Tailwind CSS          │
│  (Deployed on Vercel)                           │
├─────────────────────────────────────────────────┤
│  Supabase (PostgreSQL + Auth + Realtime)        │
│  Row-Level Security for Data Isolation          │
├─────────────────────────────────────────────────┤
│  MapLibre GL (Real-time map tracking)           │
│  Stripe (Billing & Subscriptions)               │
│  WhatsApp Business API (Notifications)          │
└─────────────────────────────────────────────────┘
```

### Tech Stack
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Vercel Edge Functions, Supabase Edge Functions
- **Database:** Supabase (PostgreSQL) with RLS
- **Maps:** MapLibre GL (free, unlimited, self-hosted)
- **Auth:** Supabase Auth (Google OAuth, Email/Password)
- **Billing:** Stripe (Checkout, Subscriptions, Webhooks)
- **Notifications:** WhatsApp Business API
- **Hosting:** Vercel (for frontend & API routes)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Supabase account (free tier available)
- Stripe account (test mode available)
- WhatsApp Business Account (optional, for production)

### 1. Clone & Setup
```bash
git clone https://github.com/jeepooly-blip/fleetguard-saas.git
cd fleetguard-saas

# Install dependencies
npm install

# Copy environment variables
cp apps/web/.env.example apps/web/.env.local

# Edit .env.local with your credentials
nano apps/web/.env.local
```

### 2. Setup Supabase
```bash
# Create a new Supabase project at https://app.supabase.com

# Run database migrations
npm run db:migrate

# Seed test data (optional)
npm run db:seed
```

### 3. Setup Stripe (for billing)
```bash
# Create a Stripe account at https://stripe.com

# Add your Stripe keys to .env.local:
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
# STRIPE_SECRET_KEY=sk_test_xxx
# STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 4. Run Locally
```bash
npm run dev

# Opens on http://localhost:3000
```

### 5. Deploy to Vercel
```bash
# Login to Vercel
npm i -g vercel
vercel login

# Deploy
vercel --prod

# Add environment variables in Vercel dashboard
```

---

## 📁 Project Structure

```
fleetguard-saas/
├── apps/
│   └── web/                    # Next.js SaaS application
│       ├── src/
│       │   ├── pages/          # Next.js pages & API routes
│       │   │   ├── index.tsx   # Landing page
│       │   │   ├── [slug]/     # Multi-tenant routes
│       │   │   └── api/        # API endpoints
│       │   ├── components/     # React components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Utilities (Supabase, Stripe, etc)
│       │   ├── styles/         # Global CSS
│       │   └── types/          # TypeScript types
│       ├── public/             # Static assets
│       ├── next.config.js      # Next.js config
│       ├── tsconfig.json       # TypeScript config
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared types & utilities
│   │   └── src/
│   │       ├── types/
│   │       └── utils/
│   │
│   └── supabase/               # Database migrations & functions
│       ├── migrations/
│       ├── functions/
│       └── seed.sql
│
├── docs/                       # Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   └── ARCHITECTURE.md
│
├── .github/
│   └── workflows/              # GitHub Actions CI/CD
│       └── deploy.yml
│
├── vercel.json                 # Vercel configuration
├── package.json                # Root package.json
└── README.md
```

---

## 📖 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md) - System design and data flow
- [API Documentation](./docs/API.md) - Complete API reference
- [Deployment Guide](./docs/DEPLOYMENT.md) - Vercel deployment steps
- [Development Guide](./docs/DEVELOPMENT.md) - Local development setup
- [Database Schema](./docs/DATABASE.md) - PostgreSQL schema with RLS policies
- [White-Label Guide](./docs/WHITELABEL.md) - Branding and customization

---

## 💰 Pricing

| Plan | Price | Buses | Students | Features |
|------|-------|-------|----------|----------|
| **Basic** | $29/mo | 2 | 50 | Real-time tracking, QR verification, basic reporting |
| **Pro** | $79/mo | 10 | 300 | Everything in Basic + advanced analytics, API access |
| **Enterprise** | Custom | Unlimited | Unlimited | Everything in Pro + custom features, dedicated support |

---

## 🔐 Security

- **Multi-tenant isolation** via PostgreSQL Row-Level Security (RLS)
- **End-to-end encryption** for sensitive data
- **Secure authentication** with Supabase Auth (Google OAuth, Email/Password)
- **API key rotation** and credential management
- **HTTPS only** - all communication encrypted
- **GDPR compliant** with data privacy controls
- **Regular security audits** and penetration testing

---

## 🧪 Testing

```bash
# Run unit tests
npm run test --workspace=apps/web

# Run E2E tests (Playwright)
npm run test:e2e --workspace=apps/web

# Run type checking
npm run type-check --workspace=apps/web

# Run linting
npm run lint --workspace=apps/web
```

---

## 📊 Monitoring

- **Vercel Analytics** - Performance metrics and real-time alerts
- **Sentry** - Error tracking and crash reporting
- **PostHog** - Product analytics and user behavior
- **DataDog** - Infrastructure monitoring (optional)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md)

### Development Workflow
1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes and commit: `git commit -m 'Add amazing feature'`
3. Push to the branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

---

## 📞 Support & Community

- **Documentation:** https://docs.fleetguard.io
- **Email Support:** support@fleetguard.io
- **Live Chat:** Available in-app for all plans
- **Slack Community:** [Join our community](https://slack.fleetguard.io)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

Built for schools in Jordan and the MENA region with ❤️

- **Supabase** - Backend infrastructure
- **Vercel** - Hosting and deployment
- **Stripe** - Payment processing
- **MapLibre** - Open-source mapping
- **Tailwind CSS** - Utility-first CSS

---

## 📈 Roadmap

- [x] Multi-tenant architecture
- [x] White-label branding
- [x] Real-time tracking with MapLibre GL
- [x] Stripe billing integration
- [x] QR code verification
- [ ] Advanced analytics dashboard
- [ ] Mobile app (Flutter)
- [ ] AI-powered anomaly detection
- [ ] ERP system integrations
- [ ] Multi-language support (Spanish, Turkish, Urdu)
- [ ] Offline-first mobile sync
- [ ] Voice command support
- [ ] IoT device integration

---

<div align="center">

Made with 🚌 for schools across the Middle East

[Report Bug](https://github.com/jeepooly-blip/fleetguard-saas/issues) • [Request Feature](https://github.com/jeepooly-blip/fleetguard-saas/discussions) • [View Live Demo](https://fleetguard.vercel.app)

</div>

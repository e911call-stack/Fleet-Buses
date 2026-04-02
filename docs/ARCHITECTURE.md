# 🏗️ FleetGuard Architecture Documentation

## System Overview

FleetGuard is a **multi-tenant SaaS platform** built on modern, scalable technologies designed for high availability and real-time data processing.

```
┌─────────────────────────────────────────────────────────────┐
│                    User (Browser)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Next.js Frontend (Vercel Edge Network)               │
│  - Multi-tenant routing ([slug]/...)                         │
│  - React components with TenantProvider                      │
│  - Real-time map with MapLibre GL                           │
│  - Stripe checkout integration                              │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐    ┌─────────────┐  ┌──────────┐
    │Supabase│    │  Stripe API │  │WhatsApp  │
    │        │    │  (Billing)  │  │  API     │
    │ Auth   │    │             │  │(Messages)│
    │ DB     │    └─────────────┘  └──────────┘
    │Realtime│
    └────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│          PostgreSQL (Supabase)                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Row-Level Security (RLS) for Multi-Tenant Isolation │   │
│  │  - Tenants can only access their own data             │   │
│  │  - Every table has tenant_id foreign key              │   │
│  │  - Policies enforce database-level access control     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Multi-Tenant Architecture

### Data Isolation Strategy

**Approach: Shared Database with Row-Level Security (RLS)**

All tenants use the same PostgreSQL database, but data is isolated at the database level using RLS policies:

```sql
-- Example RLS Policy
CREATE POLICY "tenants_can_only_see_own_buses" ON buses
  USING (
    tenant_id = (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid()
    )
  );
```

**Pros:**
✅ Cost-effective (single database)
✅ Easier to manage data consistency
✅ Database-level security (RLS)
✅ Shared infrastructure simplifies operations
✅ Easy to run reports across all tenants (admin only)

**Cons:**
❌ Larger database grows with more tenants
❌ Requires careful RLS policy management
❌ One security breach could affect all tenants

### Alternative Approaches (Not Used)

**Separate Database per Tenant:**
- Pros: Complete isolation, easiest to understand
- Cons: Expensive ($30-50/month per database), complex operations

**Schema-based Isolation:**
- Pros: Better than shared tables, easier than separate databases
- Cons: Complex to maintain, schema changes affect all tenants

---

## API Architecture

### Multi-Tenant Routing

**Dynamic Routing with `[slug]` Parameter:**

```
https://fleetguard.vercel.app/[slug]/dashboard
                              ↑
                              └─ Tenant identifier
                                 (matches tenants.slug)

Examples:
- https://fleetguard.vercel.app/abc-school/dashboard
- https://fleetguard.vercel.app/xyz-transport/dashboard
- https://custom-domain.com/abc-school/dashboard (white-label)
```

### API Endpoint Structure

All API routes follow the pattern: `/api/[slug]/resource`

```typescript
// GET /api/abc-school/buses
// Returns buses for tenant 'abc-school' only

// POST /api/abc-school/buses
// Creates a bus for tenant 'abc-school'

// PUT /api/abc-school/buses/[id]
// Updates a specific bus (only if owned by tenant)

// DELETE /api/abc-school/buses/[id]
// Deletes a bus (only if owned by tenant)
```

### Authentication Flow

```
1. User logs in with email/password or Google OAuth
   ↓
2. Supabase Auth returns JWT with user ID
   ↓
3. Frontend stores JWT in httpOnly cookie
   ↓
4. API route extracts JWT and gets user profile
   ↓
5. Get user's tenant_id from profiles table
   ↓
6. Verify tenant_id matches [slug] in URL
   ↓
7. All database queries filtered by tenant_id
   ↓
8. Response returned (only user's tenant's data)
```

---

## Database Schema

### Core Tables with Tenant Isolation

```
tenants
├── id (UUID) ← Primary key
├── name
├── slug ← URL identifier
├── plan (basic/pro/enterprise)
├── subscription_status
├── branding (logo, colors, etc.)
└── created_at

profiles (extends auth.users)
├── id (UUID) → auth.users.id
├── tenant_id → tenants.id  ← TENANT ISOLATION
├── role (admin/driver/student/parent)
├── full_name
└── email

buses
├── id (UUID)
├── tenant_id → tenants.id  ← TENANT ISOLATION
├── plate_number
├── capacity
├── status
└── current_driver_id → profiles.id

routes
├── id (UUID)
├── tenant_id → tenants.id  ← TENANT ISOLATION
├── name
├── origin
├── destination
└── description

trips
├── id (UUID)
├── tenant_id → tenants.id  ← TENANT ISOLATION
├── bus_id → buses.id
├── driver_id → profiles.id
├── route_id → routes.id
├── status (scheduled/in_progress/completed)
└── timestamps

scan_logs
├── id (UUID)
├── tenant_id → tenants.id  ← TENANT ISOLATION
├── trip_id → trips.id
├── subscription_id
├── is_valid
└── scanned_at

bus_locations
├── id (UUID)
├── tenant_id → tenants.id  ← TENANT ISOLATION
├── bus_id → buses.id
├── latitude
├── longitude
└── updated_at (indexed for real-time queries)
```

### RLS Policies for Every Table

**Example for buses table:**

```sql
-- Users can view buses in their tenant
CREATE POLICY "users_can_view_own_tenant_buses" ON buses
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- Only admins can insert buses
CREATE POLICY "admins_can_insert_buses" ON buses
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only bus owners/admins can update
CREATE POLICY "admins_can_update_buses" ON buses
  FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## Real-Time Features

### WebSocket Connection (Supabase Realtime)

For live bus tracking:

```typescript
// Frontend
const subscription = supabase
  .from('bus_locations')
  .on('*', (payload) => {
    // Update map with new location
    updateMapMarker(payload.new);
  })
  .subscribe();

// When a driver updates their location, all admins see it instantly
// (due to Realtime subscription)
```

**Latency:**
- Driver → Supabase: ~50-200ms (network dependent)
- Supabase → Admin dashboards: ~10-50ms (WebSocket)
- **Total:** 60-250ms from driver phone to admin dashboard

---

## Billing & Multi-Tenant SaaS Model

### Pricing Tiers (Per Tenant)

```
Tenant Subscription
├── BASIC Plan ($29/month)
│   ├── 2 buses
│   ├── 50 students
│   ├── Email support
│   └── Basic analytics
│
├── PRO Plan ($79/month)
│   ├── 10 buses
│   ├── 300 students
│   ├── WhatsApp integration
│   ├── API access
│   └── Priority support
│
└── ENTERPRISE Plan (custom)
    ├── Unlimited buses
    ├── Unlimited students
    ├── Custom features
    └── Dedicated support
```

### Stripe Integration

**Payment Flow:**

```
1. Tenant selects plan → Click "Subscribe"
   ↓
2. Frontend creates Stripe Checkout session
   - Links to /api/[slug]/billing/checkout
   ↓
3. Backend creates customer in Stripe (if new)
   ↓
4. Stripe Checkout opens (payment form)
   ↓
5. Customer enters card details
   ↓
6. Stripe processes payment
   ↓
7. Webhook: /api/webhooks/stripe
   - Updates tenant.stripe_customer_id
   - Updates tenant.plan
   - Updates tenant.subscription_status
   ↓
8. Tenant gains access to premium features
```

### Webhook Events

```
Stripe → /api/webhooks/stripe

Events:
- customer.created → Store Stripe customer ID
- customer.subscription.created → Activate subscription
- customer.subscription.updated → Update subscription
- customer.subscription.deleted → Cancel subscription
- invoice.payment_succeeded → Log successful payment
- invoice.payment_failed → Send retry email
```

---

## Security Model

### Authentication (AuthN)

- **Provider:** Supabase Auth
- **Methods:**
  - Google OAuth (simple sign-up)
  - Email/Password (enterprise)
  - Magic Links (optional)

- **JWT Token:**
  ```json
  {
    "iss": "supabase",
    "sub": "user-id",
    "role": "authenticated",
    "aud": "authenticated",
    "tenant_id": "tenant-uuid" // Custom claim
  }
  ```

### Authorization (AuthZ)

- **Type:** Role-Based Access Control (RBAC)
- **Roles:** admin, driver, student, parent
- **Enforcement:**
  1. JWT contains user ID
  2. API queries user's profile for tenant_id & role
  3. RLS policies filter database access
  4. Frontend checks role before showing UI

- **Example Permission Matrix:**
  ```
  Role     | View Buses | Create Bus | View Reports | Manage Billing
  ---------|-----------|-----------|-------------|---------------
  admin    |    ✅     |    ✅     |     ✅      |      ✅
  driver   |    ✅     |    ❌     |     ❌      |      ❌
  student  |    ❌     |    ❌     |     ❌      |      ❌
  parent   |    ❌     |    ❌     |     ❌      |      ❌
  ```

### Data Protection

- **Encryption in Transit:** HTTPS/TLS 1.3
- **Encryption at Rest:** Supabase managed encryption
- **Sensitive Fields:** Passwords hashed with bcrypt
- **API Keys:** Stored in Supabase secrets, never exposed

---

## Performance Optimization

### Database Optimization

**Indexes:** (Critical for multi-tenant queries)

```sql
CREATE INDEX idx_buses_tenant_id ON buses(tenant_id);
CREATE INDEX idx_buses_tenant_status ON buses(tenant_id, status);
CREATE INDEX idx_trips_tenant_status ON trips(tenant_id, status);
CREATE INDEX idx_bus_locations_tenant_time ON bus_locations(tenant_id, updated_at DESC);
```

**Partitioning:** (For large tables)

```sql
-- bus_locations table is partitioned by date
-- Keeps hot data in memory, archives old data
CREATE TABLE bus_locations (
  ...
) PARTITION BY RANGE (created_at);

CREATE TABLE bus_locations_2024_12 
  PARTITION OF bus_locations
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
```

### Query Optimization

**Bad Query (N+1 problem):**
```typescript
const buses = await getBuses(tenantId);
for (const bus of buses) {
  const locations = await getBusLocation(bus.id); // ❌ N queries
}
```

**Good Query (Eager loading):**
```typescript
const buses = await supabase
  .from('buses')
  .select(`
    *,
    bus_locations (*)  // ✅ 1 query (JOIN)
  `)
  .eq('tenant_id', tenantId);
```

### Caching Strategy

- **Client-side:** React Query / SWR for data caching
- **Server-side:** Vercel ISR (Incremental Static Regeneration)
- **CDN:** Vercel Edge Cache for static assets

---

## Scaling Strategy

### Current (1-100 tenants)
- Single database instance
- Shared API servers on Vercel
- Works well for up to ~1M bus locations/day

### Future (100-1000 tenants)
- Database read replicas for analytics
- Sharding by tenant_id (if needed)
- Dedicated instances for enterprise tenants

### Future (1000+ tenants)
- Evaluate separate database per tenant
- Multi-region deployment
- Database federation / distributed queries

---

## Monitoring & Observability

### Error Tracking (Sentry)
- Captures all JavaScript errors
- Tracks API errors and performance

### Analytics (PostHog)
- User behavior tracking
- Feature usage metrics
- Funnel analysis

### Performance Monitoring (Vercel Analytics)
- Real User Monitoring (RUM)
- Core Web Vitals
- Edge function performance

### Logs (Vercel + Supabase)
- Request logs on Vercel
- Database query logs on Supabase
- WhatsApp integration logs

---

## Disaster Recovery

### Backup Strategy

- **Automatic Backups:** Supabase daily backups (7-day retention)
- **Manual Backups:** Weekly export to S3
- **Recovery Time Objective (RTO):** < 1 hour
- **Recovery Point Objective (RPO):** < 1 day

### Failover Plan

1. **Database failure:** Automatic failover to read replica
2. **API failure:** Deploy to different region on Vercel
3. **Complete outage:** Restore from backup (manual)

---

## Development Workflow

### Local Development

```bash
# Clone repo
git clone https://github.com/jeepooly-blip/fleetguard-saas.git

# Install + setup
npm install
npm run db:migrate

# Start dev server
npm run dev

# App runs at: http://localhost:3000/test-school/dashboard
```

### Deployment Pipeline

```
Git push to main
  ↓
GitHub Actions runs tests
  ↓
Passes tests?
  ├─ YES → Deploy to Vercel
  │        ↓
  │        Run E2E tests on staging
  │        ↓
  │        Promote to production
  │
  └─ NO → Reject push, notify developer
```

---

## Useful Queries for Operations

### Check Tenant Health
```sql
SELECT 
  t.name,
  t.plan,
  COUNT(DISTINCT b.id) as bus_count,
  COUNT(DISTINCT p.id) as user_count,
  COUNT(DISTINCT tr.id) as trip_count,
  t.subscription_status,
  t.subscription_ends_at
FROM tenants t
LEFT JOIN buses b ON t.id = b.tenant_id
LEFT JOIN profiles p ON t.id = p.tenant_id
LEFT JOIN trips tr ON t.id = tr.tenant_id
GROUP BY t.id
ORDER BY t.created_at DESC;
```

### Monitor Real-Time Updates
```sql
SELECT 
  tenant_id,
  COUNT(*) as location_updates,
  MAX(updated_at) as latest_update
FROM bus_locations
WHERE updated_at > NOW() - INTERVAL '5 minutes'
GROUP BY tenant_id
ORDER BY COUNT(*) DESC;
```

---

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Row-Level Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Stripe Documentation](https://stripe.com/docs)
- [MapLibre GL Documentation](https://maplibre.org/)

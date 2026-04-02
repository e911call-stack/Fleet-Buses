-- ============================================
-- MULTI-TENANT SETUP FOR FLEETGUARD
-- This migration adds tenant_id to all tables
-- and implements strict row-level security
-- ============================================

-- 1. CREATE TENANTS TABLE (New)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  custom_domain VARCHAR(255) UNIQUE,
  
  -- Plan & Billing
  plan VARCHAR(50) DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'enterprise')),
  subscription_status VARCHAR(50) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  
  -- Branding (White-Label)
  logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#007BFF',
  secondary_color VARCHAR(7) DEFAULT '#6C757D',
  accent_color VARCHAR(7) DEFAULT '#FF6B6B',
  background_color VARCHAR(7) DEFAULT '#FFFFFF',
  text_color VARCHAR(7) DEFAULT '#333333',
  email_logo_url TEXT,
  email_footer_text TEXT,
  whatsapp_message_prefix VARCHAR(100),
  support_email VARCHAR(255),
  support_phone VARCHAR(20),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 2. ADD TENANT_ID TO EXISTING TABLES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE stops ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE bus_locations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 3. ADD INDEXES FOR MULTI-TENANT QUERIES
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_buses_tenant_id ON buses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_buses_tenant_status ON buses(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_routes_tenant_id ON routes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stops_tenant_id ON stops(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trips_tenant_id ON trips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trips_tenant_status ON trips(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_tenant_id ON scan_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_trip_id_tenant ON scan_logs(tenant_id, trip_id);
CREATE INDEX IF NOT EXISTS idx_bus_locations_tenant_id ON bus_locations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bus_locations_tenant_time ON bus_locations(tenant_id, updated_at DESC);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_locations ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES - TENANTS
CREATE POLICY "users_can_view_own_tenant" ON tenants
  FOR SELECT USING (
    id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- 6. RLS POLICIES - PROFILES
DROP POLICY IF EXISTS "users_can_view_own_tenant_profiles" ON profiles;
CREATE POLICY "users_can_view_own_tenant_profiles" ON profiles
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "users_can_update_own_profile" ON profiles
  FOR UPDATE USING (
    id = auth.uid()
  );

-- 7. RLS POLICIES - BUSES
DROP POLICY IF EXISTS "users_can_view_own_tenant_buses" ON buses;
CREATE POLICY "users_can_view_own_tenant_buses" ON buses
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "admins_can_insert_buses" ON buses
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. RLS POLICIES - ROUTES
CREATE POLICY "users_can_view_own_tenant_routes" ON routes
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- 9. RLS POLICIES - STOPS
CREATE POLICY "users_can_view_own_tenant_stops" ON stops
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- 10. RLS POLICIES - TRIPS
CREATE POLICY "users_can_view_own_tenant_trips" ON trips
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- 11. RLS POLICIES - SUBSCRIPTIONS
CREATE POLICY "users_can_view_own_tenant_subscriptions" ON subscriptions
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- 12. RLS POLICIES - SCAN LOGS
DROP POLICY IF EXISTS "Student scan history" ON scan_logs;
CREATE POLICY "users_can_view_own_tenant_scans" ON scan_logs
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "drivers_can_insert_scans" ON scan_logs
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'driver'
    )
  );

-- 13. RLS POLICIES - BUS LOCATIONS
CREATE POLICY "users_can_view_own_tenant_locations" ON bus_locations
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "drivers_can_update_locations" ON bus_locations
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'driver'
    )
  );

-- 14. HELPER FUNCTION - Get tenant context from JWT
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- 15. CREATE TEST TENANT (for development)
INSERT INTO tenants (name, slug, plan, subscription_status, primary_color, secondary_color)
VALUES (
  'Test School',
  'test-school',
  'pro',
  'active',
  '#007BFF',
  '#6C757D'
) ON CONFLICT (slug) DO NOTHING;

-- Verify migration
SELECT 'Multi-tenant setup completed' as status;

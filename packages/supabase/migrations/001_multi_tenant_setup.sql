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

-- ============================================
-- SUPER ADMIN ROLE ADDITIONS
-- Adds super_admin role with platform-wide RLS bypass
-- ============================================

-- 16. SUPER ADMIN HELPER FUNCTION
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 17. RLS BYPASS POLICIES FOR SUPER ADMIN

-- Tenants: super admin can view/manage all
CREATE POLICY "super_admin_all_tenants" ON tenants
  FOR ALL USING (is_super_admin());

-- Profiles: super admin can view all
CREATE POLICY "super_admin_all_profiles" ON profiles
  FOR ALL USING (is_super_admin());

-- Buses: super admin can view all
CREATE POLICY "super_admin_all_buses" ON buses
  FOR ALL USING (is_super_admin());

-- Trips: super admin can view all
CREATE POLICY "super_admin_all_trips" ON trips
  FOR ALL USING (is_super_admin());

-- Bus Locations: super admin can view all
CREATE POLICY "super_admin_all_bus_locations" ON bus_locations
  FOR ALL USING (is_super_admin());

-- Scan Logs: super admin can view all
CREATE POLICY "super_admin_all_scan_logs" ON scan_logs
  FOR ALL USING (is_super_admin());

-- 18. SEED SUPER ADMIN USER
-- IMPORTANT: Replace the UUID below with the actual Supabase auth.users.id
-- after creating the super admin user via Supabase Dashboard > Authentication.
-- The email/password for Super Admin is managed in Supabase Auth, not here.

-- Example seed (replace <YOUR_SUPABASE_AUTH_USER_ID>):
-- INSERT INTO profiles (id, tenant_id, email, full_name, role, is_active)
-- VALUES (
--   '<YOUR_SUPABASE_AUTH_USER_ID>',
--   NULL,                          -- super admins have no tenant
--   'superadmin@fleetguard.app',
--   'Platform Super Admin',
--   'super_admin',
--   true
-- )
-- ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

SELECT 'Super admin role setup completed' as status;

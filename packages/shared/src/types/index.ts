// Database Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  custom_domain?: string;
  plan: 'basic' | 'pro' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'expired' | 'cancelled';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  trial_ends_at?: string;
  subscription_ends_at?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  email_logo_url?: string;
  email_footer_text?: string;
  whatsapp_message_prefix?: string;
  support_email?: string;
  support_phone?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  role: 'admin' | 'driver' | 'student' | 'parent';
  permissions?: Record<string, boolean>;
  student_id?: string;
  parent_id?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Bus {
  id: string;
  tenant_id: string;
  plate_number: string;
  name?: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  panic_status: boolean;
  current_driver_id?: string;
  current_trip_id?: string;
  last_location_update_at?: string;
  last_maintenance_at?: string;
  next_maintenance_due_at?: string;
  maintenance_interval_days: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Route {
  id: string;
  tenant_id: string;
  name: string;
  origin: string;
  destination: string;
  description?: string;
  max_students?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Stop {
  id: string;
  route_id: string;
  tenant_id: string;
  name?: string;
  latitude: number;
  longitude: number;
  order_index: number;
  location?: any; // PostGIS Geography
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  tenant_id: string;
  bus_id: string;
  driver_id: string;
  route_id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_start_time?: string;
  actual_start_time?: string;
  estimated_end_time?: string;
  actual_end_time?: string;
  current_stop_index: number;
  last_stop_departure_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  student_id: string;
  parent_id: string;
  route_id?: string;
  qr_secret: string;
  qr_secret_rotation_interval: string;
  last_qr_generated_at?: string;
  is_active: boolean;
  failed_scan_attempts: number;
  locked_until?: string;
  enrollment_date: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ScanLog {
  id: string;
  tenant_id: string;
  trip_id: string;
  subscription_id: string;
  driver_id?: string;
  qr_code?: string;
  is_valid: boolean;
  offline_sync_id?: string;
  is_synced: boolean;
  scanned_at: string;
  synced_at?: string;
  created_at: string;
}

export interface BusLocation {
  id: string;
  tenant_id: string;
  bus_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  location?: any; // PostGIS Geography
  speed?: number;
  heading?: number;
  altitude?: number;
  created_at: string;
}

// API Types
export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  tenant_id?: string;
  aud?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  full_name: string;
  company_name: string;
}

export interface AuthResponse {
  user: AuthUser;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
    token_type: string;
  };
}

// Billing Types
export interface PricingTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  buses: number;
  students: number;
  features: string[];
  stripeProductId: string;
  stripePriceId: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  plan: 'basic' | 'pro' | 'enterprise';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
}

// Form Types
export interface BusForm {
  plate_number: string;
  name?: string;
  capacity: number;
}

export interface RouteForm {
  name: string;
  origin: string;
  destination: string;
  description?: string;
}

export interface TripForm {
  bus_id: string;
  driver_id: string;
  route_id: string;
}

// Statistics Types
export interface DashboardStats {
  activeBuses: number;
  totalStudents: number;
  onTimePercentage: number;
  totalTripsToday: number;
  averageOnTimeArrival: number;
  activeRoutes: number;
}

export interface TripStats {
  totalTrips: number;
  completedTrips: number;
  onTimeTrips: number;
  lateTrips: number;
  averageDelay: number;
}

// Error Types
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Pagination
export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

// Sorting
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Filtering
export interface FilterOptions {
  [key: string]: any;
}

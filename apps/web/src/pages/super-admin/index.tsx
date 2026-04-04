import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import toast from 'react-hot-toast';
import {
  ShieldCheck, Bus, Users, Building2, CreditCard,
  Activity, AlertTriangle, TrendingUp, LogOut,
  RefreshCw, Search, Eye, CheckCircle, XCircle,
  Clock, Plus, Ban, Edit2, Trash2, X, Save,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────
type ActiveTab = 'overview' | 'tenants' | 'users' | 'fleet' | 'billing' | 'analytics' | 'alerts';

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  expiredTenants: number;
  totalBuses: number;
  totalProfiles: number;
  planBreakdown: Record<string, number>;
}

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscription_status: string;
  created_at: string;
  trial_ends_at: string | null;
}

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  tenant_id: string | null;
  tenant_name?: string;
}

interface BusRow {
  id: string;
  plate: string;
  model: string | null;
  created_at: string;
  tenant_id: string;
  tenant_name?: string;
}

// ── Constants ────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  trial:     'bg-blue-100 text-blue-700',
  expired:   'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active:    <CheckCircle className="h-3 w-3" />,
  trial:     <Clock className="h-3 w-3" />,
  expired:   <XCircle className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
};

const ROLE_COLORS: Record<string, string> = {
  super_admin:  'bg-indigo-100 text-indigo-700',
  tenant_admin: 'bg-purple-100 text-purple-700',
  driver:       'bg-yellow-100 text-yellow-700',
  viewer:       'bg-gray-100 text-gray-600',
};

const PLANS = ['basic', 'pro', 'enterprise'];
const STATUSES = ['trial', 'active', 'expired', 'cancelled'];

// ── Modal wrapper ────────────────────────────────────────────
function Modal({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────
export default function SuperAdminDashboard() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [activeTab, setActiveTab]     = useState<ActiveTab>('overview');
  const [isLoading, setIsLoading]     = useState(false);
  const [search, setSearch]           = useState('');

  // Data
  const [stats,   setStats]   = useState<PlatformStats | null>(null);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [users,   setUsers]   = useState<UserRow[]>([]);
  const [buses,   setBuses]   = useState<BusRow[]>([]);

  // Modals
  const [editTenant,    setEditTenant]    = useState<TenantRow | null>(null);
  const [addBusModal,   setAddBusModal]   = useState(false);
  const [addUserModal,  setAddUserModal]  = useState(false);
  const [newBus,   setNewBus]   = useState({ plate: '', model: '', tenant_id: '' });
  const [newUser,  setNewUser]  = useState({ email: '', full_name: '', role: 'viewer', tenant_id: '', password: '' });

  // ── Auth verify ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth/login'); return; }
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'super_admin') {
        toast.error('Access denied.');
        router.replace('/auth/login');
        return;
      }
      setIsVerifying(false);
      fetchAll();
    })();
  }, []);

  // ── Fetch all data ───────────────────────────────────────
  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      const [
        { data: tenantsData },
        { data: profilesData },
        { data: busesData },
      ] = await Promise.all([
        supabase.from('tenants')
          .select('id, name, slug, plan, subscription_status, created_at, trial_ends_at')
          .order('created_at', { ascending: false }),
        supabase.from('profiles')
          .select('id, full_name, email, role, is_active, created_at, tenant_id')
          .order('created_at', { ascending: false }),
        supabase.from('buses')
          .select('id, plate, model, created_at, tenant_id')
          .order('created_at', { ascending: false }),
      ]);

      const tenantMap: Record<string, string> = {};
      (tenantsData || []).forEach(t => { tenantMap[t.id] = t.name; });

      setTenants(tenantsData || []);

      setUsers((profilesData || []).map(p => ({
        ...p,
        tenant_name: p.tenant_id ? tenantMap[p.tenant_id] || 'Unknown' : 'Platform',
      })));

      setBuses((busesData || []).map(b => ({
        ...(b as BusRow), // FIX: Type assertion added to resolve spread error
        tenant_name: tenantMap[b.tenant_id] || 'Unknown',
      })));

      const td = tenantsData || [];
      const planBreakdown = td.reduce(
        (acc, t) => ({ ...acc, [t.plan]: (acc[t.plan] || 0) + 1 }),
        {} as Record<string, number>
      );
      setStats({
        totalTenants:   td.length,
        activeTenants:  td.filter(t => t.subscription_status === 'active').length,
        trialTenants:   td.filter(t => t.subscription_status === 'trial').length,
        expiredTenants: td.filter(t => ['expired','cancelled'].includes(t.subscription_status)).length,
        totalBuses:     (busesData || []).length,
        totalProfiles:  (profilesData || []).length,
        planBreakdown,
      });
    } catch {
      toast.error('Failed to load platform data');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Tenant actions ───────────────────────────────────────
  const saveTenant = async () => {
    if (!editTenant) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('tenants')
      .update({
        name:                editTenant.name,
        plan:                editTenant.plan,
        subscription_status: editTenant.subscription_status,
      })
      .eq('id', editTenant.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Tenant updated!');
    setEditTenant(null);
    fetchAll();
  };

  const deleteTenant = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from('tenants').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Tenant deleted');
    fetchAll();
  };

  // ── User actions ─────────────────────────────────────────
  const toggleUserActive = async (user: UserRow) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !user.is_active })
      .eq('id', user.id);
    if (error) { toast.error(error.message); return; }
    toast.success(user.is_active ? 'User disabled' : 'User enabled');
    fetchAll();
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast.error('Email and password are required');
      return;
    }
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error || 'Failed to create user'); return; }
    toast.success('User created!');
    setAddUserModal(false);
    setNewUser({ email: '', full_name: '', role: 'viewer', tenant_id: '', password: '' });
    fetchAll();
  };

  // ── Bus actions ──────────────────────────────────────────
  const createBus = async () => {
    if (!newBus.plate || !newBus.tenant_id) {
      toast.error('Plate and tenant are required');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from('buses').insert({
      plate:     newBus.plate,
      model:     newBus.model || null,
      tenant_id: newBus.tenant_id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Bus added!');
    setAddBusModal(false);
    setNewBus({ plate: '', model: '', tenant_id: '' });
    fetchAll();
  };

  const deleteBus = async (id: string) => {
    if (!confirm('Delete this bus?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('buses').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Bus deleted');
    fetchAll();
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // ── Filter helper ─────────────────────────────────────────
  const q = search.toLowerCase();
  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(q) || t.slug?.toLowerCase().includes(q));
  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q) ||
    u.role.toLowerCase().includes(q));
  const filteredBuses = buses.filter(b =>
    b.plate.toLowerCase().includes(q) ||
    b.model?.toLowerCase().includes(q) ||
    b.tenant_name?.toLowerCase().includes(q));

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <div className="h-10 w-10 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Verifying access…</p>
        </div>
      </div>
    );
  }

  const navItems: { icon: React.ElementType; label: string; tab: ActiveTab }[] = [
    { icon: Activity,      label: 'Overview',  tab: 'overview'  },
    { icon: Building2,     label: 'Tenants',   tab: 'tenants'   },
    { icon: Users,         label: 'Users',     tab: 'users'     },
    { icon: Bus,           label: 'Fleet',     tab: 'fleet'     },
    { icon: CreditCard,    label: 'Billing',   tab: 'billing'   },
    { icon: TrendingUp,    label: 'Analytics', tab: 'analytics' },
    { icon: AlertTriangle, label: 'Alerts',    tab: 'alerts'    },
  ];

  const tabTitles: Record<ActiveTab, string> = {
    overview:  'Platform Overview',
    tenants:   'Tenants',
    users:     'Users',
    fleet:     'Fleet',
    billing:   'Billing',
    analytics: 'Analytics',
    alerts:    'Alerts',
  };

  // ── Shared table header ───────────────────────────────────
  const TableSearch = () => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
      <input
        type="text"
        placeholder="Search…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
      />
    </div>
  );

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-xs font-semibold text-gray-400 mb-1";

  // ── Content renderer ──────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {

      // ── OVERVIEW ────────────────────────────────────────
      case 'overview':
        return (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Tenants',        value: stats?.totalTenants   ?? '—', icon: Building2,   color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
                { label: 'Active Subscriptions', value: stats?.activeTenants  ?? '—', icon: CheckCircle, color: 'text-green-400',  bg: 'bg-green-900/30'  },
                { label: 'On Free Trial',         value: stats?.trialTenants   ?? '—', icon: Clock,       color: 'text-blue-400',   bg: 'bg-blue-900/30'   },
                { label: 'Total Buses',           value: stats?.totalBuses     ?? '—', icon: Bus,         color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
                { label: 'Total Users',           value: stats?.totalProfiles  ?? '—', icon: Users,       color: 'text-purple-400', bg: 'bg-purple-900/30' },
                { label: 'Basic Plans',           value: stats?.planBreakdown?.basic       ?? 0, icon: CreditCard,  color: 'text-gray-400',   bg: 'bg-gray-800'      },
                { label: 'Pro Plans',             value: stats?.planBreakdown?.pro         ?? 0, icon: TrendingUp,  color: 'text-blue-400',   bg: 'bg-blue-900/30'   },
                { label: 'Enterprise Plans',      value: stats?.planBreakdown?.enterprise  ?? 0, icon: ShieldCheck, color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
                  <div className={`${bg} ${color} p-3 rounded-xl`}><Icon className="h-5 w-5" /></div>
                  <div>
                    <div className="text-2xl font-bold text-white">{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent tenants */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-800">
                <h2 className="font-semibold text-white">Recent Tenants</h2>
                <button onClick={() => setActiveTab('tenants')} className="text-xs text-indigo-400 hover:underline">View all</button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['School','Plan','Status','Joined'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.slice(0,5).map(t => (
                    <tr key={t.id} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                      <td className="px-5 py-3 font-medium text-white">{t.name}</td>
                      <td className="px-5 py-3 capitalize text-gray-300">{t.plan}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[t.subscription_status] || ''}`}>
                          {STATUS_ICONS[t.subscription_status]}{t.subscription_status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-600">No tenants yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        );

      // ── TENANTS ──────────────────────────────────────────
      case 'tenants':
        return (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="font-semibold text-white">All Tenants ({filteredTenants.length})</h2>
              <TableSearch />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['School','Slug','Plan','Status','Trial Ends','Joined','Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-600">No tenants found</td></tr>
                  ) : filteredTenants.map(t => (
                    <tr key={t.id} className="border-b border-gray-800/60 hover:bg-gray-800/40 transition">
                      <td className="px-5 py-3.5 font-medium text-white">{t.name}</td>
                      <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{t.slug || '—'}</td>
                      <td className="px-5 py-3.5 capitalize text-gray-300">{t.plan}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[t.subscription_status] || 'bg-gray-800 text-gray-400'}`}>
                          {STATUS_ICONS[t.subscription_status]}{t.subscription_status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {t.trial_ends_at ? new Date(t.trial_ends_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 flex items-center gap-2">
                        <button onClick={() => setEditTenant(t)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg text-xs font-semibold transition">
                          <Edit2 className="h-3 w-3" /> Edit
                        </button>
                        <button onClick={() => deleteTenant(t.id, t.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs font-semibold transition">
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ── USERS ────────────────────────────────────────────
      case 'users':
        return (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-800">
                <h2 className="font-semibold text-white">All Users ({filteredUsers.length})</h2>
                <div className="flex items-center gap-3">
                  <TableSearch />
                  <button onClick={() => setAddUserModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition">
                    <Plus className="h-3.5 w-3.5" /> Add User
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Name','Email','Role','Tenant','Status','Joined','Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-600">No users found</td></tr>
                    ) : filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-gray-800/60 hover:bg-gray-800/40 transition">
                        <td className="px-5 py-3.5 font-medium text-white">{u.full_name || '—'}</td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{u.email || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] || 'bg-gray-700 text-gray-300'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{u.tenant_name}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                            {u.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {u.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => toggleUserActive(u)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                              u.is_active
                                ? 'bg-red-600/20 hover:bg-red-600/40 text-red-400'
                                : 'bg-green-600/20 hover:bg-green-600/40 text-green-400'
                            }`}>
                            <Ban className="h-3 w-3" />
                            {u.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add User Modal */}
            {addUserModal && (
              <Modal title="Create New User" onClose={() => setAddUserModal(false)}>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Full Name</label>
                    <input className={inputCls} placeholder="Ahmed Al-Hassan"
                      value={newUser.full_name}
                      onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Email *</label>
                    <input className={inputCls} type="email" placeholder="user@school.edu"
                      value={newUser.email}
                      onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Password *</label>
                    <input className={inputCls} type="password" placeholder="Min 8 characters"
                      value={newUser.password}
                      onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Role</label>
                    <select className={inputCls}
                      value={newUser.role}
                      onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                      <option value="viewer">Viewer</option>
                      <option value="driver">Driver</option>
                      <option value="tenant_admin">Tenant Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Tenant (leave blank for platform-level)</label>
                    <select className={inputCls}
                      value={newUser.tenant_id}
                      onChange={e => setNewUser(p => ({ ...p, tenant_id: e.target.value }))}>
                      <option value="">— None (Super Admin) —</option>
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={createUser}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition">
                    <Save className="h-4 w-4" /> Create User
                  </button>
                </div>
              </Modal>
            )}
          </>
        );

      // ── FLEET ────────────────────────────────────────────
      case 'fleet':
        return (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-800">
                <h2 className="font-semibold text-white">All Buses ({filteredBuses.length})</h2>
                <div className="flex items-center gap-3">
                  <TableSearch />
                  {tenants.length > 0 && (
                    <button onClick={() => setAddBusModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition">
                      <Plus className="h-3.5 w-3.5" /> Add Bus
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Plate','Model','Tenant','Added','Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBuses.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-600">
                        {tenants.length === 0 ? 'Create a tenant first before adding buses' : 'No buses found'}
                      </td></tr>
                    ) : filteredBuses.map(b => (
                      <tr key={b.id} className="border-b border-gray-800/60 hover:bg-gray-800/40 transition">
                        <td className="px-5 py-3.5 font-medium text-white font-mono">{b.plate}</td>
                        <td className="px-5 py-3.5 text-gray-300">{b.model || '—'}</td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{b.tenant_name}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(b.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => deleteBus(b.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs font-semibold transition">
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Bus Modal */}
            {addBusModal && (
              <Modal title="Add New Bus" onClose={() => setAddBusModal(false)}>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Plate Number *</label>
                    <input className={inputCls} placeholder="e.g. AB-1234"
                      value={newBus.plate}
                      onChange={e => setNewBus(p => ({ ...p, plate: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Model</label>
                    <input className={inputCls} placeholder="e.g. Toyota Coaster"
                      value={newBus.model}
                      onChange={e => setNewBus(p => ({ ...p, model: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Assign to Tenant *</label>
                    <select className={inputCls}
                      value={newBus.tenant_id}
                      onChange={e => setNewBus(p => ({ ...p, tenant_id: e.target.value }))}>
                      <option value="">— Select tenant —</option>
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={createBus}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition">
                    <Save className="h-4 w-4" /> Add Bus
                  </button>
                </div>
              </Modal>
            )}
          </>
        );

      // ── BILLING ──────────────────────────────────────────
      case 'billing':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Monthly Revenue (est.)', value: `$${((stats?.planBreakdown?.basic||0)*29 + (stats?.planBreakdown?.pro||0)*79).toLocaleString()}`, color: 'text-green-400', bg: 'bg-green-900/30' },
                { label: 'Active Paying Tenants',  value: stats?.activeTenants ?? 0, color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
                { label: 'Trial Tenants',          value: stats?.trialTenants ?? 0, color: 'text-blue-400', bg: 'bg-blue-900/30' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} border border-gray-800 rounded-xl p-5`}>
                  <div className={`text-3xl font-bold ${color}`}>{value}</div>
                  <div className="text-sm text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-gray-800">
                <h2 className="font-semibold text-white">Subscription Status by Tenant</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Tenant','Plan','Status','Trial Ends','Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-600">No tenants</td></tr>
                  ) : tenants.map(t => (
                    <tr key={t.id} className="border-b border-gray-800/60 hover:bg-gray-800/40">
                      <td className="px-5 py-3.5 font-medium text-white">{t.name}</td>
                      <td className="px-5 py-3.5 capitalize text-gray-300">{t.plan} — ${t.plan === 'basic' ? 29 : t.plan === 'pro' ? 79 : '?'}/mo</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[t.subscription_status] || ''}`}>
                          {STATUS_ICONS[t.subscription_status]}{t.subscription_status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {t.trial_ends_at ? new Date(t.trial_ends_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setEditTenant(t)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg text-xs font-semibold transition">
                          <Edit2 className="h-3 w-3" /> Change Plan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ── ANALYTICS ────────────────────────────────────────
      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Plan breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="font-semibold text-white mb-4">Plan Distribution</h2>
              <div className="space-y-3">
                {PLANS.map(plan => {
                  const count = stats?.planBreakdown?.[plan] || 0;
                  const total = stats?.totalTenants || 1;
                  const pct   = Math.round((count / total) * 100);
                  return (
                    <div key={plan}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-gray-300">{plan}</span>
                        <span className="text-gray-500">{count} tenant{count !== 1 ? 's' : ''} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="font-semibold text-white mb-4">Subscription Status Breakdown</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {STATUSES.map(s => {
                  const count = tenants.filter(t => t.subscription_status === s).length;
                  return (
                    <div key={s} className="bg-gray-800 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white">{count}</div>
                      <div className={`text-xs font-semibold mt-1 capitalize px-2 py-0.5 rounded-full inline-block ${STATUS_COLORS[s] || ''}`}>{s}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fleet stats */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="font-semibold text-white mb-4">Fleet Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-xl p-4">
                  <div className="text-2xl font-bold text-yellow-400">{stats?.totalBuses ?? 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Total Buses Across Platform</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4">
                  <div className="text-2xl font-bold text-purple-400">{stats?.totalProfiles ?? 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Total Users Across Platform</div>
                </div>
              </div>
            </div>
          </div>
        );

      // ── ALERTS ───────────────────────────────────────────
      case 'alerts': {
        const expiredTenants  = tenants.filter(t => t.subscription_status === 'expired');
        const trialExpiringSoon = tenants.filter(t => {
          if (t.subscription_status !== 'trial' || !t.trial_ends_at) return false;
          const daysLeft = Math.ceil((new Date(t.trial_ends_at).getTime() - Date.now()) / 86400000);
          return daysLeft <= 3 && daysLeft >= 0;
        });
        const hasAlerts = expiredTenants.length > 0 || trialExpiringSoon.length > 0;

        return (
          <div className="space-y-4">
            {!hasAlerts && (
              <div className="bg-green-900/20 border border-green-800 rounded-xl p-6 text-center">
                <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
                <p className="text-green-300 font-semibold">All clear — no active alerts</p>
                <p className="text-green-600 text-sm mt-1">All tenants are in good standing</p>
              </div>
            )}

            {expiredTenants.length > 0 && (
              <div className="bg-gray-900 border border-red-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-red-900/20 border-b border-red-800 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <span className="text-red-300 font-semibold text-sm">Expired Subscriptions ({expiredTenants.length})</span>
                </div>
                <div className="divide-y divide-gray-800">
                  {expiredTenants.map(t => (
                    <div key={t.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="text-white font-medium text-sm">{t.name}</div>
                        <div className="text-gray-500 text-xs">{t.plan} plan — expired</div>
                      </div>
                      <button onClick={() => { setEditTenant(t); }}
                        className="text-xs text-indigo-400 hover:underline">Reactivate</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {trialExpiringSoon.length > 0 && (
              <div className="bg-gray-900 border border-yellow-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-yellow-900/20 border-b border-yellow-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-300 font-semibold text-sm">Trials Expiring Soon ({trialExpiringSoon.length})</span>
                </div>
                <div className="divide-y divide-gray-800">
                  {trialExpiringSoon.map(t => {
                    const daysLeft = Math.ceil((new Date(t.trial_ends_at!).getTime() - Date.now()) / 86400000);
                    return (
                      <div key={t.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <div className="text-white font-medium text-sm">{t.name}</div>
                          <div className="text-yellow-500 text-xs">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</div>
                        </div>
                        <button onClick={() => setEditTenant(t)}
                          className="text-xs text-indigo-400 hover:underline">Extend / Activate</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      }

      default: return null;
    }
  };

  return (
    <>
      <Head><title>Super Admin – FleetGuard Platform</title></Head>

      <div className="min-h-screen bg-gray-950 text-white">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 w-60 bg-gray-900 border-r border-gray-800 flex flex-col z-50">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">FleetGuard</div>
                <div className="text-[10px] text-indigo-400 font-semibold tracking-wide">SUPER ADMIN</div>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(({ icon: Icon, label, tab }) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setSearch(''); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-800">
            <button onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="ml-60 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">{tabTitles[activeTab]}</h1>
              <p className="text-gray-400 text-sm mt-1">FleetGuard Platform Control Panel</p>
            </div>
            <button onClick={fetchAll} disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
          {renderContent()}
        </main>
      </div>

      {/* Edit Tenant Modal */}
      {editTenant && (
        <Modal title="Edit Tenant" onClose={() => setEditTenant(null)}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>School Name</label>
              <input className={inputCls} value={editTenant.name}
                onChange={e => setEditTenant(p => p ? ({ ...p, name: e.target.value }) : p)} />
            </div>
            <div>
              <label className={labelCls}>Plan</label>
              <select className={inputCls} value={editTenant.plan}
                onChange={e => setEditTenant(p => p ? ({ ...p, plan: e.target.value }) : p)}>
                {PLANS.map(pl => <option key={pl} value={pl}>{pl}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Subscription Status</label>
              <select className={inputCls} value={editTenant.subscription_status}
                onChange={e => setEditTenant(p => p ? ({ ...p, subscription_status: e.target.value }) : p)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={saveTenant}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition">
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

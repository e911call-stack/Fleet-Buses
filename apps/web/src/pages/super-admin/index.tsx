import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import toast from 'react-hot-toast';
import {
  ShieldCheck, Bus, Users, Building2, CreditCard,
  Activity, AlertTriangle, TrendingUp, LogOut,
  RefreshCw, Search, Eye, CheckCircle, XCircle, Clock,
} from 'lucide-react';

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

type ActiveTab = 'overview' | 'tenants' | 'users' | 'fleet' | 'billing' | 'analytics' | 'alerts';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [isVerifying, setIsVerifying]   = useState(true);
  const [activeTab, setActiveTab]       = useState<ActiveTab>('overview');
  const [stats, setStats]               = useState<PlatformStats | null>(null);
  const [tenants, setTenants]           = useState<TenantRow[]>([]);
  const [search, setSearch]             = useState('');
  const [isLoading, setIsLoading]       = useState(false);

  useEffect(() => {
    const verify = async () => {
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
      fetchData();
    };
    verify();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const [{ data: tenantsData }, { count: busCount }, { count: profileCount }] =
        await Promise.all([
          supabase.from('tenants')
            .select('id, name, slug, plan, subscription_status, created_at, trial_ends_at')
            .order('created_at', { ascending: false }),
          supabase.from('buses').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
        ]);

      if (tenantsData) {
        setTenants(tenantsData);
        const planBreakdown = tenantsData.reduce(
          (acc, t) => ({ ...acc, [t.plan]: (acc[t.plan] || 0) + 1 }),
          {} as Record<string, number>
        );
        setStats({
          totalTenants:   tenantsData.length,
          activeTenants:  tenantsData.filter(t => t.subscription_status === 'active').length,
          trialTenants:   tenantsData.filter(t => t.subscription_status === 'trial').length,
          expiredTenants: tenantsData.filter(t =>
            t.subscription_status === 'expired' || t.subscription_status === 'cancelled').length,
          totalBuses:     busCount || 0,
          totalProfiles:  profileCount || 0,
          planBreakdown,
        });
      }
    } catch {
      toast.error('Failed to load platform data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

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
    { icon: Activity,      label: 'Overview',   tab: 'overview'   },
    { icon: Building2,     label: 'Tenants',    tab: 'tenants'    },
    { icon: Users,         label: 'Users',      tab: 'users'      },
    { icon: Bus,           label: 'Fleet',      tab: 'fleet'      },
    { icon: CreditCard,    label: 'Billing',    tab: 'billing'    },
    { icon: TrendingUp,    label: 'Analytics',  tab: 'analytics'  },
    { icon: AlertTriangle, label: 'Alerts',     tab: 'alerts'     },
  ];

  // ── Tab content renderer ──────────────────────────────────────
  const renderContent = () => {
    // Placeholder for tabs not yet built
    const Placeholder = ({ label }: { label: string }) => (
      <div className="flex flex-col items-center justify-center h-96 text-gray-600">
        <ShieldCheck className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-lg font-semibold">{label}</p>
        <p className="text-sm mt-1 opacity-60">This section is coming soon.</p>
      </div>
    );

    switch (activeTab) {

      // ── OVERVIEW ──────────────────────────────────────────────
      case 'overview':
        return (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Tenants',         value: stats?.totalTenants   ?? '—', icon: Building2,  color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
                { label: 'Active Subscriptions',  value: stats?.activeTenants  ?? '—', icon: CheckCircle,color: 'text-green-400',  bg: 'bg-green-900/30'  },
                { label: 'On Free Trial',          value: stats?.trialTenants   ?? '—', icon: Clock,      color: 'text-blue-400',   bg: 'bg-blue-900/30'   },
                { label: 'Total Buses',            value: stats?.totalBuses     ?? '—', icon: Bus,        color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
                { label: 'Total Users',            value: stats?.totalProfiles  ?? '—', icon: Users,      color: 'text-purple-400', bg: 'bg-purple-900/30' },
                { label: 'Basic Plans',            value: stats?.planBreakdown?.basic      ?? 0, icon: CreditCard,  color: 'text-gray-400',   bg: 'bg-gray-800'      },
                { label: 'Pro Plans',              value: stats?.planBreakdown?.pro        ?? 0, icon: TrendingUp,  color: 'text-blue-400',   bg: 'bg-blue-900/30'   },
                { label: 'Enterprise Plans',       value: stats?.planBreakdown?.enterprise ?? 0, icon: ShieldCheck, color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
                  <div className={`${bg} ${color} p-3 rounded-xl`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tenants table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-800">
                <h2 className="font-semibold text-white">All Tenants</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search tenants…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['School','Slug','Plan','Status','Trial ends','Joined','Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-gray-600 text-sm">
                          {isLoading ? 'Loading tenants…' : 'No tenants found'}
                        </td>
                      </tr>
                    ) : filteredTenants.map(tenant => (
                      <tr key={tenant.id} className="border-b border-gray-800/60 hover:bg-gray-800/40 transition">
                        <td className="px-5 py-3.5 font-medium text-white">{tenant.name}</td>
                        <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{tenant.slug}</td>
                        <td className="px-5 py-3.5 capitalize text-gray-300">{tenant.plan}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[tenant.subscription_status] || 'bg-gray-800 text-gray-400'}`}>
                            {STATUS_ICONS[tenant.subscription_status]}
                            {tenant.subscription_status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">
                          {tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">
                          {new Date(tenant.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => router.push(`/${tenant.slug}/dashboard`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg text-xs font-semibold transition"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );

      // ── TENANTS ───────────────────────────────────────────────
      case 'tenants':
        return (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="font-semibold text-white">Manage Tenants</h2>
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
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['School','Slug','Plan','Status','Trial ends','Joined','Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-600">No tenants yet</td></tr>
                  ) : filteredTenants.map(tenant => (
                    <tr key={tenant.id} className="border-b border-gray-800/60 hover:bg-gray-800/40 transition">
                      <td className="px-5 py-3.5 font-medium text-white">{tenant.name}</td>
                      <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{tenant.slug}</td>
                      <td className="px-5 py-3.5 capitalize text-gray-300">{tenant.plan}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[tenant.subscription_status] || 'bg-gray-800 text-gray-400'}`}>
                          {STATUS_ICONS[tenant.subscription_status]}
                          {tenant.subscription_status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => router.push(`/${tenant.slug}/dashboard`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg text-xs font-semibold transition"
                        >
                          <Eye className="h-3 w-3" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ── OTHER TABS (placeholders) ─────────────────────────────
      case 'users':     return <Placeholder label="User Management" />;
      case 'fleet':     return <Placeholder label="Fleet Overview" />;
      case 'billing':   return <Placeholder label="Billing & Subscriptions" />;
      case 'analytics': return <Placeholder label="Analytics & Reports" />;
      case 'alerts':    return <Placeholder label="Alerts & Notifications" />;
      default:          return null;
    }
  };

  const tabTitles: Record<ActiveTab, string> = {
    overview:  'Platform Overview',
    tenants:   'Tenants',
    users:     'Users',
    fleet:     'Fleet',
    billing:   'Billing',
    analytics: 'Analytics',
    alerts:    'Alerts',
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
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}   // ← THIS was missing before
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="ml-60 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">{tabTitles[activeTab]}</h1>
              <p className="text-gray-400 text-sm mt-1">Real-time view of all tenants and fleet activity</p>
            </div>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {renderContent()}
        </main>
      </div>
    </>
  );
}

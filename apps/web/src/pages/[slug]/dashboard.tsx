import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTenant } from '@/hooks/useTenant';
import { useTenantBranding } from '@/hooks/useTenantBranding';
import Image from 'next/image';
import { Bus, Users, MapPin, AlertCircle } from 'lucide-react';
import MapLibreMap from '@/components/MapLibreMap';
import BusStats from '@/components/BusStats';
import ActiveTrips from '@/components/ActiveTrips';

export default function DashboardPage() {
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const { tenant, loading: tenantLoading } = useTenant(slug);
  const { branding } = useTenantBranding(slug);
  const [buses, setBuses] = useState([]);
  const [stats, setStats] = useState({ activeBuses: 0, totalStudents: 0, onTimePercentage: 0 });

  useEffect(() => {
    if (!slug) return;

    // Fetch buses for this tenant
    fetch(`/api/${slug}/buses`)
      .then(res => res.json())
      .then(data => {
        setBuses(data.buses || []);
        setStats(data.stats || {});
      })
      .catch(err => console.error('Error fetching buses:', err));
  }, [slug]);

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: branding?.primary_color }}></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">School Not Found</h1>
          <p className="text-gray-600 mt-2">The school you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - {tenant.name}</title>
        <meta name="description" content={`${tenant.name} - Fleet Management Dashboard`} />
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: branding?.background_color }}>
        {/* Header */}
        <header className="border-b" style={{ borderColor: `${branding?.primary_color}20` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
            <div>
              {branding?.logo_url ? (
                <Image src={branding.logo_url} alt={tenant.name} width={160} height={40} className="h-10 w-auto" />
              ) : (
                <h1 className="text-2xl font-bold" style={{ color: branding?.primary_color }}>
                  {tenant.name}
                </h1>
              )}
            </div>
            <div className="text-sm text-gray-600">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                {tenant.plan.toUpperCase()} Plan
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <BusStats
              icon={Bus}
              title="Active Buses"
              value={stats.activeBuses}
              color={branding?.primary_color}
            />
            <BusStats
              icon={Users}
              title="Total Students"
              value={stats.totalStudents}
              color={branding?.secondary_color}
            />
            <BusStats
              icon={MapPin}
              title="On-Time %"
              value={`${stats.onTimePercentage}%`}
              color={branding?.accent_color}
            />
            <BusStats
              icon={AlertCircle}
              title="Alerts"
              value="0"
              color="#FF6B6B"
            />
          </div>

          {/* Map Section */}
          <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden h-96">
            <MapLibreMap buses={buses} branding={branding} />
          </div>

          {/* Active Trips */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ActiveTrips slug={slug} />
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition text-sm font-semibold">
                  + Add Bus
                </button>
                <button className="w-full px-4 py-2 rounded bg-green-50 text-green-700 hover:bg-green-100 transition text-sm font-semibold">
                  + Start Trip
                </button>
                <button className="w-full px-4 py-2 rounded bg-orange-50 text-orange-700 hover:bg-orange-100 transition text-sm font-semibold">
                  View Reports
                </button>
                <button className="w-full px-4 py-2 rounded bg-gray-50 text-gray-700 hover:bg-gray-100 transition text-sm font-semibold">
                  Settings
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

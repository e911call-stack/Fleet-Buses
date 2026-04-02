import { useEffect, useState } from 'react';
import { Clock, MapPin } from 'lucide-react';

interface ActiveTripsProps {
  slug: string;
}

export default function ActiveTrips({ slug }: ActiveTripsProps) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await fetch(`/api/${slug}/trips?status=in_progress`);
        const data = await response.json();
        setTrips(data.trips || []);
      } catch (error) {
        console.error('Error fetching trips:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchTrips, 30000);
    return () => clearInterval(interval);
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Loading trips...</p>
      </div>
    );
  }

  if (!trips.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">No active trips</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Active Trips</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {trips.map((trip: any) => (
          <div key={trip.id} className="px-6 py-4 hover:bg-gray-50 transition">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-900">{trip.bus?.plate_number}</p>
                <p className="text-sm text-gray-600">{trip.route?.name}</p>
              </div>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                In Progress
              </span>
            </div>
            <div className="flex gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>Started at {new Date(trip.actual_start_time).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>Stop {trip.current_stop_index + 1}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

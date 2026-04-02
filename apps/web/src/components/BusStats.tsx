import { LucideIcon } from 'lucide-react';

interface BusStatsProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  color?: string;
}

export default function BusStats({ icon: Icon, title, value, color = '#007BFF' }: BusStatsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold" style={{ color }}>
            {value}
          </p>
        </div>
        <Icon className="h-12 w-12" style={{ color: `${color}20` }} />
      </div>
    </div>
  );
}

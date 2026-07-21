import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { get } from '@/lib/api';
import type { Appointment, LookRequest, User } from '@/lib/types';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Spinner,
  StatCard,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

// Build a 30-day chart from a list of dated objects.
function buildTimeSeries(items: { created_at: string }[]): { date: string; count: number }[] {
  const counts: Record<string, number> = {};
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    counts[d.toISOString().slice(0, 10)] = 0;
  }
  for (const item of items) {
    const day = item.created_at.slice(0, 10);
    if (day in counts) counts[day] = (counts[day] ?? 0) + 1;
  }
  return Object.entries(counts).map(([date, count]) => ({
    date: date.slice(5),  // "MM-DD"
    count,
  }));
}

export default function Dashboard() {
  const users = useQuery({ queryKey: ['users'], queryFn: () => get<User[]>('/users') });
  const requests = useQuery({ queryKey: ['requests'], queryFn: () => get<LookRequest[]>('/look-requests') });
  const appointments = useQuery({ queryKey: ['appointments'], queryFn: () => get<Appointment[]>('/appointments') });

  const isLoading = users.isLoading || requests.isLoading || appointments.isLoading;
  const isError = users.isError || requests.isError || appointments.isError;

  if (isLoading) return <PageShell title="Overview"><Spinner /></PageShell>;
  if (isError) return <PageShell title="Overview"><ErrorState message="Failed to load dashboard data." /></PageShell>;

  const totalUsers = users.data!.length;
  const totalArtists = users.data!.filter((u) => u.role === 'artist').length;
  const totalClients = users.data!.filter((u) => u.role === 'client').length;
  const openRequests = requests.data!.filter((r) => r.status === 'pending' || r.status === 'viewed').length;
  const completedAppts = appointments.data!.filter((a) => a.status === 'completed');
  const totalRevenue = completedAppts.reduce((s, a) => s + (a.final_price ?? 0), 0);

  const requestSeries = buildTimeSeries(requests.data!);
  const recentRequests = [...requests.data!]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  return (
    <PageShell title="Overview">
      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total users" value={totalUsers} sub={`${totalClients} clients · ${totalArtists} artists`} />
        <StatCard label="Look requests" value={requests.data!.length} sub={`${openRequests} open`} />
        <StatCard label="Appointments" value={appointments.data!.length} sub={`${completedAppts.length} completed`} />
        <StatCard label="Revenue" value={formatCurrency(totalRevenue)} accent sub="Completed only" />
      </div>

      {/* Chart */}
      <Card className="p-5 mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Look requests — last 30 days</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={requestSeries}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f1" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#colorCount)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent requests */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent look requests</h3>
        {recentRequests.length === 0 ? (
          <EmptyState message="No requests yet." />
        ) : (
          <div className="divide-y divide-gray-50">
            {recentRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.look_name}</p>
                  <p className="text-xs text-gray-400">{formatDate(r.created_at)}</p>
                </div>
                <Badge label={r.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  );
}

function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{title}</h1>
      {children}
    </div>
  );
}

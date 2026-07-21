import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { Appointment } from '@/lib/types';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Spinner,
  Table,
  Td,
  Tr,
} from '@/components/ui';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const STATUSES = ['all', 'booked', 'confirmed', 'completed', 'cancelled', 'no_show'];

export default function Appointments() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => get<Appointment[]>('/appointments'),
  });

  if (isLoading) return <Shell><Spinner /></Shell>;
  if (isError) return <Shell><ErrorState message="Failed to load appointments." /></Shell>;

  const filtered = (data ?? []).filter((a) => {
    if (status !== 'all' && a.status !== status) return false;
    if (!search) return true;
    return a.service_name.toLowerCase().includes(search.toLowerCase());
  });

  const totalRevenue = (data ?? [])
    .filter((a) => a.status === 'completed')
    .reduce((s, a) => s + (a.final_price ?? 0), 0);

  const totalCogs = (data ?? [])
    .filter((a) => a.status === 'completed')
    .reduce((s, a) => s + a.products.reduce((ps, p) => ps + p.cogs, 0), 0);

  return (
    <Shell>
      {/* Revenue summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase font-medium">Revenue (completed)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase font-medium">Total COGS</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalCogs)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase font-medium">Gross margin</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {totalRevenue > 0 ? `${(((totalRevenue - totalCogs) / totalRevenue) * 100).toFixed(1)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Input
          placeholder="Search service name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-64"
        />
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                status === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState message="No appointments match that filter." />
        ) : (
          <Table headers={['Service', 'Scheduled', 'Duration', 'Quoted', 'Final', 'COGS', 'Status']}>
            {filtered.map((a) => {
              const apptCogs = a.products.reduce((s, p) => s + p.cogs, 0);
              return (
                <Tr key={a.id}>
                  <Td>
                    <div>
                      <p className="font-medium text-gray-800">{a.service_name}</p>
                      {a.location && <p className="text-xs text-gray-400">{a.location}</p>}
                    </div>
                  </Td>
                  <Td className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(a.scheduled_at)}</Td>
                  <Td className="text-gray-500">{a.duration_minutes}min</Td>
                  <Td>{a.quoted_price != null ? formatCurrency(a.quoted_price) : '—'}</Td>
                  <Td className="font-medium">{a.final_price != null ? formatCurrency(a.final_price) : '—'}</Td>
                  <Td className="text-amber-600 font-medium">{apptCogs > 0 ? formatCurrency(apptCogs) : '—'}</Td>
                  <Td><Badge label={a.status} /></Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </Card>
      <p className="mt-3 text-xs text-gray-400">{filtered.length} of {data?.length ?? 0} appointments</p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Appointments</h1>
      {children}
    </div>
  );
}

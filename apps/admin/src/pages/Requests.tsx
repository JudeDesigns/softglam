import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get, mediaUrl } from '@/lib/api';
import type { LookRequest } from '@/lib/types';
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
import { formatDate } from '@/lib/utils';

const STATUSES = ['all', 'pending', 'viewed', 'quoted', 'accepted', 'declined'];

export default function Requests() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['look-requests'],
    queryFn: () => get<LookRequest[]>('/look-requests'),
  });

  if (isLoading) return <Shell><Spinner /></Shell>;
  if (isError) return <Shell><ErrorState message="Failed to load requests." /></Shell>;

  const filtered = (data ?? []).filter((r) => {
    if (status !== 'all' && r.status !== status) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return [r.look_name, r.client_name, r.artist_name].some((v) => (v ?? '').toLowerCase().includes(q));
  });

  return (
    <Shell>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Input
          placeholder="Search look, client or artist…"
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
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState message="No requests match that filter." />
        ) : (
          <Table headers={['Look', 'Client', 'Artist', 'Status', 'Quote', 'Sent']}>
            {filtered.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <img
                      src={mediaUrl(r.generated_url)}
                      alt=""
                      className="h-12 w-10 shrink-0 rounded-md bg-gray-100 object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{r.look_name}</p>
                      <p className="text-xs text-gray-400">{r.look_caption}</p>
                    </div>
                  </div>
                </Td>
                <Td className="text-gray-700">{r.client_name || <span className="font-mono text-xs text-gray-400">{r.client_id.slice(0, 8)}…</span>}</Td>
                <Td className="text-gray-700">{r.artist_name || <span className="font-mono text-xs text-gray-400">{r.artist_id.slice(0, 8)}…</span>}</Td>
                <Td><Badge label={r.status} /></Td>
                <Td className="max-w-xs truncate text-gray-500">{r.quote ?? '—'}</Td>
                <Td className="text-xs text-gray-400">{formatDate(r.created_at)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
      <p className="mt-3 text-xs text-gray-400">{filtered.length} of {data?.length ?? 0} requests</p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Look Requests</h1>
      {children}
    </div>
  );
}

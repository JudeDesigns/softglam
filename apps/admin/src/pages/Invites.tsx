import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { Invite } from '@/lib/types';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Spinner,
  Table,
  Td,
  Tr,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default function Invites() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['invites'],
    queryFn: () => get<Invite[]>('/invites'),
  });

  if (isLoading) return <Shell><Spinner /></Shell>;
  if (isError) return <Shell><ErrorState message="Failed to load invites." /></Shell>;

  const invites = data ?? [];
  const accepted = invites.filter((i) => i.status === 'accepted').length;
  const pending  = invites.filter((i) => i.status === 'sent').length;

  return (
    <Shell>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat label="Total sent" value={invites.length} />
        <Stat label="Accepted" value={accepted} />
        <Stat label="Pending" value={pending} />
      </div>

      <Card>
        {invites.length === 0 ? (
          <EmptyState message="No invites yet." />
        ) : (
          <Table headers={['Client name', 'Contact', 'Channel', 'Code', 'Status', 'Sent']}>
            {invites.map((i) => (
              <Tr key={i.id}>
                <Td className="font-medium text-gray-800">{i.client_name}</Td>
                <Td className="text-gray-500">{i.contact || '—'}</Td>
                <Td className="capitalize">{i.channel}</Td>
                <Td className="font-mono text-xs text-gray-400">{i.code}</Td>
                <Td><Badge label={i.status} /></Td>
                <Td className="text-xs text-gray-400">{formatDate(i.created_at)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 uppercase font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Invites</h1>
      {children}
    </div>
  );
}

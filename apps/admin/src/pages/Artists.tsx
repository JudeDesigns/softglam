import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { ArtistProfile } from '@/lib/types';
import {
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  Spinner,
  Table,
  Td,
  Tr,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default function Artists() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['artists'],
    queryFn: () => get<ArtistProfile[]>('/artists'),
  });

  if (isLoading) return <Shell><Spinner /></Shell>;
  if (isError) return <Shell><ErrorState message="Failed to load artists." /></Shell>;

  const artists = data ?? [];

  return (
    <Shell>
      <Card>
        {artists.length === 0 ? (
          <EmptyState message="No artists yet." />
        ) : (
          <Table headers={['Artist', 'Handle', 'City', 'Specialty', 'Rating', 'Yrs exp', 'Joined']}>
            {artists.map((a) => (
              <Tr key={a.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={a.name} size="sm" />
                    <span className="font-medium text-gray-800">{a.name}</span>
                  </div>
                </Td>
                <Td className="text-gray-400 font-mono text-xs">
                  {a.handle ? `@${a.handle}` : '—'}
                </Td>
                <Td>{a.city || '—'}</Td>
                <Td>{a.specialty || '—'}</Td>
                <Td>
                  <span className="flex items-center gap-1">
                    <span className="text-indigo-500">★</span>
                    {a.rating.toFixed(1)}
                  </span>
                </Td>
                <Td>{a.years_experience}y</Td>
                <Td className="text-gray-400 text-xs">{formatDate(a.created_at)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
      <p className="mt-3 text-xs text-gray-400">{artists.length} artist{artists.length !== 1 ? 's' : ''}</p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Artists</h1>
      {children}
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { User } from '@/lib/types';
import {
  Avatar,
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

export default function Users() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: () => get<User[]>('/users'),
  });

  if (isLoading) return <Shell><Spinner /></Shell>;
  if (isError) return <Shell><ErrorState message="Failed to load users." /></Shell>;

  const filtered = (data ?? []).filter((u) => {
    if (role !== 'all' && u.role !== role) return false;
    if (!search) return true;
    return `${u.display_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Shell>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Input
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-64"
        />
        <div className="flex gap-2">
          {['all', 'client', 'artist', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                role === r ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState message="No users match that filter." />
        ) : (
          <Table headers={['User', 'Email', 'Role', 'Status', 'Joined']}>
            {filtered.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.display_name} size="sm" />
                    <span className="font-medium text-gray-800">{u.display_name}</span>
                  </div>
                </Td>
                <Td className="text-gray-500">{u.email}</Td>
                <Td><Badge label={u.role} /></Td>
                <Td>
                  <span className={`text-xs font-medium ${u.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </Td>
                <Td className="text-gray-400 text-xs">{formatDate(u.created_at)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      <p className="mt-3 text-xs text-gray-400">{filtered.length} of {data?.length ?? 0} users</p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Users</h1>
      {children}
    </div>
  );
}

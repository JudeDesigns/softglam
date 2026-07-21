import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api';
import type { Product } from '@/lib/types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Spinner,
  Table,
  Td,
  Tr,
} from '@/components/ui';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

export default function Products() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: () => get<Product[]>('/products'),
  });

  const create = useMutation({
    mutationFn: (body: object) => post<Product>('/products', body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
    },
  });

  if (isLoading) return <Shell onAdd={() => setShowForm(true)}><Spinner /></Shell>;
  if (isError) return <Shell onAdd={() => setShowForm(true)}><ErrorState message="Failed to load products." /></Shell>;

  const filtered = (data ?? []).filter((p) => {
    if (!search) return true;
    return `${p.name} ${p.brand}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Shell onAdd={() => setShowForm(true)}>
      {showForm && (
        <ProductForm
          onClose={() => setShowForm(false)}
          onSubmit={(payload) => create.mutate(payload)}
          loading={create.isPending}
        />
      )}

      <Input
        placeholder="Search product or brand…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-5 max-w-xs"
      />

      <Card>
        {filtered.length === 0 ? (
          <EmptyState message="No products found." />
        ) : (
          <Table headers={['Product', 'Brand', 'Price', 'Health', 'Toxin-free', 'Targets', 'Added']}>
            {filtered.map((p) => (
              <Tr key={p.id}>
                <Td className="font-medium text-gray-800">{p.name}</Td>
                <Td className="text-gray-500">{p.brand}</Td>
                <Td>{formatCurrency(p.price)}</Td>
                <Td>
                  <span className={cn(
                    'font-semibold',
                    p.health_score >= 85 ? 'text-emerald-600' : p.health_score >= 70 ? 'text-amber-500' : 'text-red-500'
                  )}>
                    {p.health_score}
                  </span>
                </Td>
                <Td>
                  {p.is_toxin_free
                    ? <span className="text-emerald-600 text-xs font-medium">Yes</span>
                    : <span className="text-gray-400 text-xs">No</span>}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {p.targets.slice(0, 3).map((t) => (
                      <Badge key={t} label={t} />
                    ))}
                    {p.targets.length > 3 && (
                      <span className="text-xs text-gray-400">+{p.targets.length - 3}</span>
                    )}
                  </div>
                </Td>
                <Td className="text-xs text-gray-400">{formatDate(p.created_at)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
      <p className="mt-3 text-xs text-gray-400">{filtered.length} of {data?.length ?? 0} products</p>
    </Shell>
  );
}

function Shell({
  children,
  onAdd,
}: {
  children: React.ReactNode;
  onAdd: () => void;
}) {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Products</h1>
        <Button onClick={onAdd} size="sm">+ Add product</Button>
      </div>
      {children}
    </div>
  );
}

function ProductForm({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (payload: object) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    brand: '',
    name: '',
    price: '',
    health_score: '80',
    is_toxin_free: false,
    targets: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      brand: form.brand,
      name: form.name,
      price: parseFloat(form.price),
      health_score: parseInt(form.health_score),
      is_toxin_free: form.is_toxin_free,
      targets: form.targets.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Add product</h2>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          <Input label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price (₦)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <Input label="Health score (0–100)" type="number" value={form.health_score} onChange={(e) => setForm({ ...form, health_score: e.target.value })} min="0" max="100" required />
          </div>
          <Input label="Skin concern targets (comma-separated)" value={form.targets} onChange={(e) => setForm({ ...form, targets: e.target.value })} placeholder="acne, dryness, pores" />
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.is_toxin_free} onChange={(e) => setForm({ ...form, is_toxin_free: e.target.checked })} className="rounded" />
            Toxin-free formulation
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving…' : 'Add product'}
            </Button>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

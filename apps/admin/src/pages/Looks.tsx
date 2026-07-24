import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, del, get, patch, post } from '@/lib/api';
import type { Look, LookFinish, LookSection } from '@/lib/types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Spinner,
} from '@/components/ui';

const FINISHES: LookFinish[] = ['matte', 'satin', 'glow'];

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

type SectionModalState = { mode: 'create' } | { mode: 'edit'; section: LookSection };
type LookModalState =
  | { mode: 'create'; sectionId: string }
  | { mode: 'edit'; look: Look; sectionId: string };

export default function Looks() {
  const qc = useQueryClient();
  const [sectionModal, setSectionModal] = useState<SectionModalState | null>(null);
  const [lookModal, setLookModal] = useState<LookModalState | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['look-sections'],
    queryFn: () => get<LookSection[]>('/looks/sections'),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['look-sections'] });

  const createSection = useMutation({
    mutationFn: (body: object) => post<LookSection>('/looks/sections', body),
    onSuccess: () => {
      invalidate();
      setSectionModal(null);
    },
  });
  const updateSection = useMutation({
    mutationFn: ({ id, body }: { id: string; body: object }) =>
      patch<LookSection>(`/looks/sections/${id}`, body),
    onSuccess: () => {
      invalidate();
      setSectionModal(null);
    },
  });
  const deleteSection = useMutation({
    mutationFn: (id: string) => del<void>(`/looks/sections/${id}`),
    onSuccess: () => invalidate(),
  });

  const createLook = useMutation({
    mutationFn: (body: object) => post<Look>('/looks', body),
    onSuccess: () => {
      invalidate();
      setLookModal(null);
    },
  });
  const updateLook = useMutation({
    mutationFn: ({ id, body }: { id: string; body: object }) => patch<Look>(`/looks/${id}`, body),
    onSuccess: () => {
      invalidate();
      setLookModal(null);
    },
  });
  const deleteLook = useMutation({
    mutationFn: (id: string) => del<void>(`/looks/${id}`),
    onSuccess: () => invalidate(),
  });

  const generatePreview = useMutation({
    mutationFn: (lookId: string) => post<Look>(`/looks/${lookId}/generate-preview`, {}),
    onSuccess: () => invalidate(),
  });

  if (isLoading) {
    return (
      <Shell onAddSection={() => setSectionModal({ mode: 'create' })}>
        <Spinner />
      </Shell>
    );
  }
  if (isError) {
    return (
      <Shell onAddSection={() => setSectionModal({ mode: 'create' })}>
        <ErrorState message="Failed to load looks." />
      </Shell>
    );
  }

  const sections = data ?? [];
  const sectionMutationLoading = createSection.isPending || updateSection.isPending;
  const sectionMutationError =
    sectionModal?.mode === 'edit' ? updateSection.error : createSection.error;

  const lookMutationLoading = createLook.isPending || updateLook.isPending;
  const lookMutationError = lookModal?.mode === 'edit' ? updateLook.error : createLook.error;

  return (
    <Shell onAddSection={() => setSectionModal({ mode: 'create' })}>
      {sectionModal && (
        <SectionModal
          initial={sectionModal.mode === 'edit' ? sectionModal.section : undefined}
          loading={sectionMutationLoading}
          error={sectionMutationError ? errorMessage(sectionMutationError, 'Failed to save section.') : null}
          onClose={() => setSectionModal(null)}
          onSubmit={(payload) => {
            if (sectionModal.mode === 'edit') {
              updateSection.mutate({ id: sectionModal.section.id, body: payload });
            } else {
              createSection.mutate(payload);
            }
          }}
        />
      )}

      {lookModal && (
        <LookModal
          sections={sections}
          initial={lookModal.mode === 'edit' ? lookModal.look : undefined}
          defaultSectionId={lookModal.sectionId}
          loading={lookMutationLoading}
          error={lookMutationError ? errorMessage(lookMutationError, 'Failed to save look.') : null}
          onClose={() => setLookModal(null)}
          onSubmit={(payload) => {
            if (lookModal.mode === 'edit') {
              updateLook.mutate({ id: lookModal.look.id, body: payload });
            } else {
              createLook.mutate(payload);
            }
          }}
        />
      )}

      {sections.length === 0 ? (
        <Card>
          <EmptyState message="No look sections yet." />
        </Card>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => (
            <SectionBlock
              key={section.id}
              section={section}
              onEditSection={() => setSectionModal({ mode: 'edit', section })}
              onDeleteSection={() => {
                if (window.confirm(`Delete section "${section.title}"? It must have no looks left.`)) {
                  deleteSection.mutate(section.id);
                }
              }}
              deleteSectionError={
                deleteSection.isError && deleteSection.variables === section.id
                  ? errorMessage(deleteSection.error, 'Failed to delete section.')
                  : null
              }
              onAddLook={() => setLookModal({ mode: 'create', sectionId: section.id })}
              onEditLook={(look) => setLookModal({ mode: 'edit', look, sectionId: section.id })}
              onDeleteLook={(look) => {
                if (window.confirm(`Delete look "${look.name}"?`)) {
                  deleteLook.mutate(look.id);
                }
              }}
              onGeneratePreview={(look) => generatePreview.mutate(look.id)}
              generatingLookId={generatePreview.isPending ? generatePreview.variables : null}
              generateErrorLookId={generatePreview.isError ? generatePreview.variables ?? null : null}
              generateErrorMessage={errorMessage(generatePreview.error, 'Failed to generate preview.')}
            />
          ))}
        </div>
      )}
    </Shell>
  );
}

function Shell({
  children,
  onAddSection,
}: {
  children: React.ReactNode;
  onAddSection: () => void;
}) {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Looks</h1>
        <Button onClick={onAddSection} size="sm">+ Add category</Button>
      </div>
      {children}
    </div>
  );
}

function SectionBlock({
  section,
  onEditSection,
  onDeleteSection,
  deleteSectionError,
  onAddLook,
  onEditLook,
  onDeleteLook,
  onGeneratePreview,
  generatingLookId,
  generateErrorLookId,
  generateErrorMessage,
}: {
  section: LookSection;
  onEditSection: () => void;
  onDeleteSection: () => void;
  deleteSectionError: string | null;
  onAddLook: () => void;
  onEditLook: (look: Look) => void;
  onDeleteLook: (look: Look) => void;
  onGeneratePreview: (look: Look) => void;
  generatingLookId: string | null;
  generateErrorLookId: string | null;
  generateErrorMessage: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{section.subtitle}</p>
          {deleteSectionError && (
            <p className="text-xs text-red-500 mt-1">{deleteSectionError}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={onAddLook}>+ Add look</Button>
          <Button variant="ghost" size="sm" onClick={onEditSection}>Edit section</Button>
          <Button variant="danger" size="sm" onClick={onDeleteSection}>Delete section</Button>
        </div>
      </div>

      {section.looks.length === 0 ? (
        <EmptyState message="No looks in this section yet." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {section.looks.map((look) => (
            <LookCard
              key={look.id}
              look={look}
              onEdit={() => onEditLook(look)}
              onDelete={() => onDeleteLook(look)}
              onGeneratePreview={() => onGeneratePreview(look)}
              generating={generatingLookId === look.id}
              generateError={generateErrorLookId === look.id ? generateErrorMessage : null}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function ShadeSwatch({ color }: { color: string }) {
  return (
    <span
      className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

function LookCard({
  look,
  onEdit,
  onDelete,
  onGeneratePreview,
  generating,
  generateError,
}: {
  look: Look;
  onEdit: () => void;
  onDelete: () => void;
  onGeneratePreview: () => void;
  generating: boolean;
  generateError: string | null;
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden flex flex-col">
      {look.preview_image_url ? (
        <img
          src={look.preview_image_url}
          alt={look.name}
          className="w-full h-40 object-cover bg-gray-100"
        />
      ) : (
        <div className="w-full h-40 flex items-center justify-center bg-gray-50 text-xs text-gray-400">
          No preview yet
        </div>
      )}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-gray-800 text-sm">{look.name}</p>
          <Badge label={look.finish} />
        </div>
        <p className="text-xs text-gray-400 line-clamp-2">{look.caption}</p>
        <div className="flex items-center gap-1.5">
          <ShadeSwatch color={look.shades.lip} />
          <ShadeSwatch color={look.shades.cheek} />
          <ShadeSwatch color={look.shades.eye} />
        </div>

        {generateError && <p className="text-xs text-red-500">{generateError}</p>}

        <div className="flex flex-wrap gap-2 mt-auto pt-1">
          <Button variant="secondary" size="sm" onClick={onEdit}>Edit</Button>
          <Button variant="danger" size="sm" onClick={onDelete}>Delete</Button>
          <Button variant="ghost" size="sm" onClick={onGeneratePreview} disabled={generating}>
            {generating ? 'Generating…' : 'Generate preview'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function SectionModal({
  initial,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  initial?: LookSection;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: object) => void;
}) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState({
    id: initial?.id ?? '',
    title: initial?.title ?? '',
    subtitle: initial?.subtitle ?? '',
    sort_order: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      onSubmit({
        title: form.title,
        subtitle: form.subtitle,
        ...(form.sort_order !== '' ? { sort_order: parseInt(form.sort_order) } : {}),
      });
    } else {
      onSubmit({
        id: form.id,
        title: form.title,
        subtitle: form.subtitle,
        ...(form.sort_order !== '' ? { sort_order: parseInt(form.sort_order) } : {}),
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          {isEdit ? 'Edit section' : 'Add category'}
        </h2>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          <Input
            label="ID (slug)"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            disabled={isEdit}
            required
          />
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            label="Subtitle"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            required
          />
          <Input
            label="Sort order (optional)"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add category'}
            </Button>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LookModal({
  sections,
  initial,
  defaultSectionId,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  sections: LookSection[];
  initial?: Look;
  defaultSectionId: string;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: object) => void;
}) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState({
    id: initial?.id ?? '',
    section_id: defaultSectionId,
    name: initial?.name ?? '',
    caption: initial?.caption ?? '',
    finish: initial?.finish ?? 'matte',
    shade_lip: initial?.shades.lip ?? '#c2185b',
    shade_cheek: initial?.shades.cheek ?? '#e57373',
    shade_eye: initial?.shades.eye ?? '#6d4c41',
    sort_order: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const shades = { lip: form.shade_lip, cheek: form.shade_cheek, eye: form.shade_eye };
    if (isEdit) {
      onSubmit({
        section_id: form.section_id,
        name: form.name,
        caption: form.caption,
        finish: form.finish,
        shades,
        ...(form.sort_order !== '' ? { sort_order: parseInt(form.sort_order) } : {}),
      });
    } else {
      onSubmit({
        id: form.id,
        section_id: form.section_id,
        name: form.name,
        caption: form.caption,
        finish: form.finish,
        shades,
        ...(form.sort_order !== '' ? { sort_order: parseInt(form.sort_order) } : {}),
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 my-8">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          {isEdit ? 'Edit look' : 'Add look'}
        </h2>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          <Input
            label="ID (slug)"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            disabled={isEdit}
            required
          />
          <SelectField
            label="Section"
            value={form.section_id}
            onChange={(v) => setForm({ ...form, section_id: v })}
            options={sections.map((s) => ({ value: s.id, label: s.title }))}
            required
          />
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Caption"
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
            required
          />
          <SelectField
            label="Finish"
            value={form.finish}
            onChange={(v) => setForm({ ...form, finish: v as LookFinish })}
            options={FINISHES.map((f) => ({ value: f, label: f }))}
            required
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="block text-xs font-medium text-gray-500">Lip</label>
                <ShadeSwatch color={form.shade_lip} />
              </div>
              <Input value={form.shade_lip} onChange={(e) => setForm({ ...form, shade_lip: e.target.value })} required />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="block text-xs font-medium text-gray-500">Cheek</label>
                <ShadeSwatch color={form.shade_cheek} />
              </div>
              <Input value={form.shade_cheek} onChange={(e) => setForm({ ...form, shade_cheek: e.target.value })} required />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="block text-xs font-medium text-gray-500">Eye</label>
                <ShadeSwatch color={form.shade_eye} />
              </div>
              <Input value={form.shade_eye} onChange={(e) => setForm({ ...form, shade_eye: e.target.value })} required />
            </div>
          </div>
          <Input
            label="Sort order (optional)"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add look'}
            </Button>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Globe,
  ExternalLink,
  X,
  AlertCircle,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { AdminHeader } from '@/components/admin/admin-header';
import { BadgePill } from '@/components/shared/badge-pill';
import { ConfirmationDialog } from '@/components/admin/confirmation-dialog';
import { useAuthStore } from '@/store/auth-store';
import type { Project } from '@/lib/types';

export default function AdminEcosystemPage() {
  const { user: currentAdmin } = useAuthStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState<Partial<Project>>({
    name: '',
    slug: '',
    description: '',
    category: 'DeFi',
    status: 'Live',
    website_url: '',
    twitter_url: '',
    discord_url: '',
    is_official: false,
    is_verified: true,
  });

  // Delete Target
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ecosystem?userId=${encodeURIComponent(currentAdmin?.id || '')}`);
      const data = await res.json();
      if (data.success && data.projects) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Error loading ecosystem projects:', err);
    } finally {
      setLoading(false);
    }
  }, [currentAdmin?.id]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function openCreateModal() {
    setEditingProject(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      category: 'DeFi',
      status: 'Live',
      website_url: '',
      twitter_url: '',
      discord_url: '',
      is_official: false,
      is_verified: true,
    });
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(project: Project) {
    setEditingProject(project);
    setForm(project);
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!form.name?.trim() || !form.slug?.trim() || !form.description?.trim()) {
      setFormError('Project Name, Slug, and Description are required.');
      return;
    }

    setSaving(true);
    try {
      const url = editingProject
        ? `/api/admin/ecosystem/${editingProject.id}`
        : '/api/admin/ecosystem';
      const method = editingProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, adminUserId: currentAdmin?.id }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save project');

      setModalOpen(false);
      loadProjects();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(reason?: string) {
    if (!deleteTarget || !reason) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/ecosystem/${deleteTarget.id}?adminUserId=${encodeURIComponent(
          currentAdmin?.id || ''
        )}&reason=${encodeURIComponent(reason)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Delete failed');

      setDeleteTarget(null);
      loadProjects();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-6">
      <AdminHeader
        title="Ecosystem Project Directory"
        subtitle="Curate LitVM dApps, set verification status, and manage project links."
        onRefresh={loadProjects}
        refreshing={loading}
      />

      {/* Control Bar */}
      <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ecosystem projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl gradient-primary px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Project</span>
        </button>
      </GlassCard>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((p) => (
          <GlassCard key={p.id} className="p-5 space-y-4 border-white/10 hover:border-primary/40 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">{p.name}</h3>
                  {p.is_official && (
                    <BadgePill label="OFFICIAL" variant="primary" icon={ShieldCheck} />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{p.slug}</p>
              </div>
              <BadgePill label={p.category} variant="secondary" />
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {p.description}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                {p.website_url && (
                  <a
                    href={p.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded bg-white/5 text-muted-foreground hover:text-white"
                  >
                    <Globe className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(p)}
                  className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-white"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(p)}
                  className="p-1.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Create / Edit Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassCard className="relative w-full max-w-lg p-6 space-y-4 border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingProject ? 'Edit Project' : 'Add Ecosystem Project'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Project Name *</label>
                  <input
                    type="text"
                    value={form.name || ''}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                      setForm({ ...form, name, slug: form.slug || slug });
                    }}
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-white">Slug *</label>
                  <input
                    type="text"
                    value={form.slug || ''}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white font-mono focus:border-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-white">Description *</label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Category</label>
                  <select
                    value={form.category || 'DeFi'}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/80 p-2.5 text-white focus:border-primary focus:outline-none"
                  >
                    <option value="DeFi">DeFi</option>
                    <option value="DEX">DEX</option>
                    <option value="Bridge">Bridge</option>
                    <option value="Wallet">Wallet</option>
                    <option value="NFT">NFT</option>
                    <option value="AI">AI</option>
                    <option value="Infrastructure">Infrastructure</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-white">Website URL</label>
                  <input
                    type="url"
                    value={form.website_url || ''}
                    onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-white font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form.is_official}
                    onChange={(e) => setForm({ ...form, is_official: e.target.checked })}
                    className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                  />
                  <span>Mark as Official Project</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg gradient-primary px-5 py-2 font-bold text-white shadow hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title={`Delete Project: "${deleteTarget?.name}"`}
        description="Are you sure you want to permanently delete this project from the ecosystem directory?"
        confirmText="Delete Project"
        confirmVariant="danger"
        requireReason={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}

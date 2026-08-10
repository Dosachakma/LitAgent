'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Target,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Star,
  Calendar,
  AlertCircle,
  X,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { AdminHeader } from '@/components/admin/admin-header';
import { BadgePill } from '@/components/shared/badge-pill';
import { ConfirmationDialog } from '@/components/admin/confirmation-dialog';
import { useAuthStore } from '@/store/auth-store';
import type { Mission } from '@/lib/types';
import type { MissionInput } from '@/lib/admin-service';

export default function AdminMissionsPage() {
  const { user } = useAuthStore();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal State for Create/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [form, setForm] = useState<MissionInput>({
    title: '',
    slug: '',
    description: '',
    type: 'EXPLORE_PROJECT',
    category: 'Ecosystem',
    xp_reward: 100,
    difficulty: 'Easy',
    status: 'active',
    verification_type: 'database',
    max_completions: 1,
    is_featured: false,
    is_active: true,
  });

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState<Mission | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadMissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/missions?userId=${encodeURIComponent(user?.id || '')}`);
      const data = await res.json();
      if (data.success && data.missions) {
        setMissions(data.missions);
      }
    } catch (err) {
      console.error('Error loading missions:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  function openCreateModal() {
    setEditingMission(null);
    setForm({
      title: '',
      slug: '',
      description: '',
      type: 'EXPLORE_PROJECT',
      category: 'Ecosystem',
      xp_reward: 100,
      difficulty: 'Easy',
      status: 'active',
      verification_type: 'database',
      max_completions: 1,
      is_featured: false,
      is_active: true,
    });
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(mission: Mission) {
    setEditingMission(mission);
    setForm({
      title: mission.title,
      slug: mission.slug || '',
      description: mission.description,
      type: mission.type,
      category: mission.category,
      xp_reward: mission.xp_reward,
      difficulty: mission.difficulty as 'Easy' | 'Medium' | 'Hard' | 'Expert',
      status: mission.status,
      start_at: mission.start_at,
      end_at: mission.end_at,
      verification_type: mission.verification_type,
      max_completions: mission.max_completions,
      is_featured: !!mission.is_featured,
      is_active: mission.is_active,
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!form.title.trim()) {
      setFormError('Mission Title is required.');
      return;
    }
    if (!form.slug.trim()) {
      setFormError('Slug is required.');
      return;
    }
    if (form.xp_reward <= 0) {
      setFormError('XP Reward must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingMission) {
        // PUT update
        const res = await fetch(`/api/admin/missions/${editingMission.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, adminUserId: user?.id, reason: 'Updated mission via admin portal' }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Update failed');
      } else {
        // POST create
        const res = await fetch('/api/admin/missions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, adminUserId: user?.id }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Creation failed');
      }

      setModalOpen(false);
      loadMissions();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(mission: Mission) {
    try {
      await fetch(`/api/admin/missions/${mission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !mission.is_active,
          adminUserId: user?.id,
          reason: `Toggled mission active status to ${!mission.is_active}`,
        }),
      });
      loadMissions();
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  }

  async function handleDelete(reason?: string) {
    if (!deleteTarget || !reason) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/missions/${deleteTarget.id}?adminUserId=${encodeURIComponent(
          user?.id || ''
        )}&reason=${encodeURIComponent(reason)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Delete failed');

      setDeleteTarget(null);
      loadMissions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  const filteredMissions = missions.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.slug || '').toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || m.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex-1 space-y-6 p-6">
      <AdminHeader
        title="Mission Management"
        subtitle="Create, edit, feature, and configure XP rewards for ecosystem missions."
        onRefresh={loadMissions}
        refreshing={loading}
      />

      {/* Controls Bar */}
      <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search missions by title, slug, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Ecosystem">Ecosystem</option>
            <option value="Social">Social</option>
            <option value="Special">Special</option>
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl gradient-primary px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Mission</span>
        </button>
      </GlassCard>

      {/* Missions Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/5 text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3.5">Mission</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">XP Reward</th>
                <th className="px-4 py-3.5">Difficulty</th>
                <th className="px-4 py-3.5">Verification</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No missions match your current query or category filter.
                  </td>
                </tr>
              ) : (
                filteredMissions.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{m.title}</span>
                          {m.is_featured && (
                            <span className="text-amber-400" title="Featured Mission">
                              <Star className="h-3.5 w-3.5 fill-amber-400" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">{m.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <BadgePill label={m.category} variant="secondary" />
                    </td>
                    <td className="px-4 py-3.5 font-bold text-amber-400 font-mono">
                      +{m.xp_reward} XP
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="capitalize font-medium text-white">{m.difficulty}</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">
                      {m.verification_type}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => toggleStatus(m)}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                          m.is_active
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/10 text-muted-foreground border border-white/10'
                        }`}
                      >
                        {m.is_active ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Disabled
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                          title="Edit Mission"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(m)}
                          className="p-1.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          title="Delete Mission"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Modal for Create/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassCard className="relative w-full max-w-xl p-6 space-y-4 border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingMission ? 'Edit Mission' : 'Create New Mission'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                      setForm({ ...form, title, slug: form.slug || slug });
                    }}
                    placeholder="e.g. Stake zkLTC on LitVM"
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-white">Slug (URL identifier) *</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="e.g. stake-zkltc"
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white font-mono focus:border-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-white">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed instructions for the mission..."
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/80 p-2.5 text-white focus:border-primary focus:outline-none"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Ecosystem">Ecosystem</option>
                    <option value="Social">Social</option>
                    <option value="Special">Special</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-white">XP Reward *</label>
                  <input
                    type="number"
                    value={form.xp_reward}
                    onChange={(e) => setForm({ ...form, xp_reward: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white font-mono focus:border-primary focus:outline-none"
                    min={1}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-white">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' | 'Expert' })}
                    className="w-full rounded-lg border border-white/10 bg-black/80 p-2.5 text-white focus:border-primary focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Verification Type</label>
                  <select
                    value={form.verification_type}
                    onChange={(e) => setForm({ ...form, verification_type: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/80 p-2.5 text-white focus:border-primary focus:outline-none"
                  >
                    <option value="database">Database Event</option>
                    <option value="wallet">Wallet Balance Check</option>
                    <option value="transaction">On-Chain Tx Check</option>
                    <option value="manual">Manual Admin Review</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 text-white font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                    />
                    <span>Active</span>
                  </label>

                  <label className="flex items-center gap-2 text-white font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                      className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                    />
                    <span>Featured</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg gradient-primary px-5 py-2 text-xs font-bold text-white shadow hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingMission ? 'Update Mission' : 'Create Mission'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title={`Delete Mission: "${deleteTarget?.title}"`}
        description="Are you sure you want to permanently delete this mission? This action will remove the mission and cannot be undone."
        confirmText="Delete Mission"
        confirmVariant="danger"
        requireReason={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}

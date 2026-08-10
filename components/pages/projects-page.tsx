'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Boxes,
  Search,
  Filter,
  Sparkles,
  RefreshCw,
  X,
  Plus,
  Compass,
} from 'lucide-react';
import { SectionTitle } from '@/components/shared/section-title';
import { GlassCard } from '@/components/shared/glass-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ContentLoader } from '@/components/shared/content-loader';
import { BadgePill } from '@/components/shared/badge-pill';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectDetailsModal } from '@/components/projects/project-details-modal';
import {
  fetchProjects,
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  VERIFICATION_STATUSES,
} from '@/lib/projects-service';
import type { Project } from '@/lib/types';

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedVerification, setSelectedVerification] = useState<string>('All');
  const [onlyFeatured, setOnlyFeatured] = useState<boolean>(false);

  // Selected project for modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Load projects from database
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchProjects();
      setProjects(data);
      setLoading(false);
    }
    loadData();
  }, []);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Category check
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }

      // Status check
      if (selectedStatus !== 'All' && p.status !== selectedStatus) {
        return false;
      }

      // Verification check
      if (selectedVerification !== 'All') {
        if (selectedVerification === 'Official' && !p.is_official && p.verification_status !== 'Official') return false;
        if (selectedVerification === 'Verified' && !p.is_verified && p.verification_status !== 'Verified') return false;
        if (selectedVerification === 'Community' && p.verification_status !== 'Community') return false;
        if (selectedVerification === 'Unverified' && (p.is_verified || p.is_official || p.verification_status)) return false;
      }

      // Featured check
      if (onlyFeatured && !p.is_featured && !p.featured) {
        return false;
      }

      // Search term
      if (search.trim()) {
        const term = search.toLowerCase().trim();
        const nameMatch = p.name.toLowerCase().includes(term);
        const descMatch = p.description.toLowerCase().includes(term);
        const catMatch = p.category.toLowerCase().includes(term);
        const tagMatch = p.tags?.some((t) => t.toLowerCase().includes(term)) ?? false;
        if (!nameMatch && !descMatch && !catMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    });
  }, [projects, selectedCategory, selectedStatus, selectedVerification, onlyFeatured, search]);

  // Featured list for top section
  const featuredList = useMemo(() => {
    return projects.filter((p) => p.is_featured || p.featured);
  }, [projects]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedVerification('All');
    setOnlyFeatured(false);
  };

  const hasActiveFilters =
    search !== '' ||
    selectedCategory !== 'All' ||
    selectedStatus !== 'All' ||
    selectedVerification !== 'All' ||
    onlyFeatured;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="LitVM Ecosystem"
        subtitle="Discover projects, tools and applications building on LitVM."
        icon={<Boxes className="h-5 w-5" />}
      />

      {/* Top Controls: Search Bar & Quick Filters */}
      <GlassCard className="p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, description, category, or tags..."
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-white/10 bg-zinc-900/90 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
            >
              <option value="All">All Statuses</option>
              {PROJECT_STATUSES.filter((s) => s !== 'All').map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* Verification Filter */}
            <select
              value={selectedVerification}
              onChange={(e) => setSelectedVerification(e.target.value)}
              className="rounded-xl border border-white/10 bg-zinc-900/90 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
            >
              <option value="All">All Verifications</option>
              {VERIFICATION_STATUSES.filter((v) => v !== 'All').map((vf) => (
                <option key={vf} value={vf}>
                  {vf}
                </option>
              ))}
            </select>

            {/* Featured Only Toggle */}
            <button
              onClick={() => setOnlyFeatured(!onlyFeatured)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                onlyFeatured
                  ? 'border-purple-500/50 bg-purple-500/20 text-purple-300'
                  : 'border-white/10 bg-white/5 text-muted-foreground hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Featured
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/10"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {PROJECT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'gradient-primary text-white shadow-md font-semibold'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Featured Projects Section (if present and no search active) */}
      {!search && selectedCategory === 'All' && featuredList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Featured Projects
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredList.map((project, idx) => (
              <ProjectCard
                key={`featured-${project.id}`}
                project={project}
                onSelect={setSelectedProject}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Projects Grid */}
      {loading ? (
        <ContentLoader lines={4} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No ecosystem projects have been added yet"
          description="LitVM ecosystem projects will automatically populate here once curated into the directory. Check back soon for official tools, bridges, and applications."
        />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No matching projects found"
          description="No projects in the LitVM Ecosystem match your active search term or filter criteria."
          action={{
            label: 'Clear Filters',
            onClick: resetFilters,
          }}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project, idx) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={setSelectedProject}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      <ProjectDetailsModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}

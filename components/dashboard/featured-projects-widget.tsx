'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ExternalLink, Twitter, MessageCircle } from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { BadgePill } from '@/components/shared/badge-pill';
import type { Project } from '@/lib/types';

export function FeaturedProjectsWidget({ projects }: { projects: Project[] | null }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Featured Projects</h3>
      </div>

      {!projects || projects.length === 0 ? (
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">
            No featured projects yet. Ecosystem projects will appear here once they are curated.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
            >
              <GlassCard hover className="h-full p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-lg font-bold text-white shadow-lg">
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  {project.category && (
                    <BadgePill label={project.category} variant="primary" />
                  )}
                </div>
                <h4 className="mt-3.5 font-semibold text-white">{project.name}</h4>
                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  {project.website_url && (
                    <a
                      href={project.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {project.twitter_url && (
                    <a
                      href={project.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                  {project.discord_url && (
                    <a
                      href={project.discord_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

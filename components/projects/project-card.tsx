'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ExternalLink, Twitter, MessageCircle, Github, Info, Globe } from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { BadgePill } from '@/components/shared/badge-pill';
import { VerificationBadge } from './verification-badge';
import type { Project } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  index?: number;
}

export function ProjectCard({ project, onSelect, index = 0 }: ProjectCardProps) {
  const twitterUrl = project.x_url || project.twitter_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <GlassCard hover className="flex flex-col justify-between h-full p-5 group">
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {project.logo_url ? (
                <Image
                  src={project.logo_url}
                  alt={project.name}
                  width={44}
                  height={44}
                  referrerPolicy="no-referrer"
                  className="h-11 w-11 rounded-xl border border-white/10 bg-white/5 object-cover p-0.5 shadow-md shrink-0"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-primary text-lg font-bold text-white shadow-lg">
                  {project.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h3 className="font-semibold text-white text-base truncate group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <BadgePill label={project.category} variant="primary" />
                  {project.status && (
                    <BadgePill
                      label={project.status}
                      variant={project.status === 'Live' ? 'success' : 'warning'}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Verification Badge */}
            <div className="shrink-0">
              <VerificationBadge project={project} />
            </div>
          </div>

          {/* Description */}
          <p className="mt-3.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {project.description}
          </p>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/70 border border-white/5"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-3">
          <div className="flex items-center gap-1">
            {project.website_url && (
              <a
                href={project.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
                title="Website"
              >
                <Globe className="h-3.5 w-3.5" />
              </a>
            )}

            {twitterUrl && (
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-sky-400"
                title="Twitter"
              >
                <Twitter className="h-3.5 w-3.5" />
              </a>
            )}

            {project.discord_url && (
              <a
                href={project.discord_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-indigo-400"
                title="Discord"
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
            )}

            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
                title="GitHub"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelect(project)}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
            >
              <Info className="h-3 w-3" />
              Details
            </button>

            {project.website_url && (
              <a
                href={project.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg gradient-primary px-2.5 py-1.5 text-xs font-medium text-white shadow hover:scale-[1.02]"
              >
                Open
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  Twitter,
  MessageCircle,
  Github,
  FileText,
  Send,
  Copy,
  Check,
  Globe,
  Cpu,
  Share2,
  Sparkles,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { BadgePill } from '@/components/shared/badge-pill';
import { VerificationBadge } from './verification-badge';
import { truncateAddress } from '@/lib/format';
import { getExplorerUrl, LITVM_TESTNET } from '@/lib/wallet-service';
import type { Project } from '@/lib/types';

interface ProjectDetailsModalProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectDetailsModal({ project, onClose }: ProjectDetailsModalProps) {
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  if (!project) return null;

  const twitterUrl = project.x_url || project.twitter_url;
  const networks = project.supported_networks?.length
    ? project.supported_networks
    : [LITVM_TESTNET.chainName];

  const handleCopy = (address: string, key: string) => {
    navigator.clipboard.writeText(address);
    setCopiedContract(key);
    setTimeout(() => setCopiedContract(null), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-2xl z-10 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Banner image if available */}
          {project.banner_url && (
            <div className="h-32 -mx-6 -mt-6 mb-6 overflow-hidden bg-purple-950/40 relative">
              <Image
                src={project.banner_url}
                alt={project.name}
                fill
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
            </div>
          )}

          {/* Header section */}
          <div className="flex items-start gap-4">
            {project.logo_url ? (
              <Image
                src={project.logo_url}
                alt={project.name}
                width={64}
                height={64}
                referrerPolicy="no-referrer"
                className="h-16 w-16 rounded-2xl border border-white/10 bg-white/5 object-cover p-1 shadow-lg shrink-0"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl gradient-primary text-2xl font-bold text-white shadow-xl">
                {project.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-white truncate">{project.name}</h2>
                <VerificationBadge project={project} />
                {project.status && (
                  <BadgePill
                    label={project.status}
                    variant={project.status === 'Live' ? 'success' : 'warning'}
                  />
                )}
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <BadgePill label={project.category} variant="primary" />
                {project.tags && project.tags.length > 0 && (
                  <span className="truncate">
                    • {project.tags.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Body Description */}
          <div className="mt-5 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                About Project
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/90">
                {project.description}
              </p>
            </div>

            {/* Official Links */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Official Links
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.website_url && (
                  <a
                    href={project.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
                  >
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    Website
                  </a>
                )}

                {twitterUrl && (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
                  >
                    <Twitter className="h-3.5 w-3.5 text-sky-400" />
                    X / Twitter
                  </a>
                )}

                {project.discord_url && (
                  <a
                    href={project.discord_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-indigo-400" />
                    Discord
                  </a>
                )}

                {project.telegram_url && (
                  <a
                    href={project.telegram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
                  >
                    <Send className="h-3.5 w-3.5 text-blue-400" />
                    Telegram
                  </a>
                )}

                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
                  >
                    <Github className="h-3.5 w-3.5 text-muted-foreground" />
                    GitHub
                  </a>
                )}

                {project.docs_url && (
                  <a
                    href={project.docs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
                  >
                    <FileText className="h-3.5 w-3.5 text-emerald-400" />
                    Docs
                  </a>
                )}
              </div>
            </div>

            {/* Supported Networks */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Supported Networks
              </h3>
              <div className="flex flex-wrap gap-2">
                {networks.map((net) => (
                  <div key={net} className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs text-primary font-medium">
                    <Cpu className="h-3 w-3" />
                    {net}
                  </div>
                ))}
              </div>
            </div>

            {/* Contract Addresses if available */}
            {project.contract_addresses && Object.keys(project.contract_addresses).length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Official Contract Addresses
                </h3>
                <div className="space-y-2">
                  {Object.entries(project.contract_addresses).map(([label, addr]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white capitalize">{label}:</span>
                        <span className="font-mono text-muted-foreground">{truncateAddress(addr, 8)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(addr, label)}
                          className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-white"
                          title="Copy contract address"
                        >
                          {copiedContract === label ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <a
                          href={getExplorerUrl(addr, 'address')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-primary"
                          title="View on Explorer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Referral URL if provided */}
            {project.referral_url && (
              <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 text-xs flex items-center justify-between">
                <span className="text-purple-300 font-medium">Official Referral Program Active</span>
                <a
                  href={project.referral_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  Join via Referral <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
            >
              Close
            </button>

            {project.website_url && (
              <a
                href={project.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-xs font-medium text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Open App
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

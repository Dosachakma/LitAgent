'use client';

import { Users, MessageCircle, Globe } from 'lucide-react';
import { SectionTitle } from '@/components/shared/section-title';
import { GlassCard } from '@/components/shared/glass-card';
import { EmptyState } from '@/components/shared/empty-state';

export function CommunityPage() {
  const channels = [
    { name: 'X / Twitter', icon: Globe, description: 'Follow official LitVM updates and announcements.', url: 'https://x.com/LitecoinVM' },
    { name: 'Discord', icon: MessageCircle, description: 'Join the LitVM community on Discord for real-time discussions.', url: 'https://discord.gg/EVR5B3pNv' },
    { name: 'Telegram', icon: Users, description: 'Connect with developers and users on the official LitVM Telegram channel.', url: 'https://t.me/litecoinvm' },
    { name: 'Blog', icon: Globe, description: 'Read official engineering blogs and network architecture deep-dives.', url: 'https://litvm.com/blog' },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Community"
        subtitle="Connect with the LitVM community"
        icon={<Users className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <GlassCard key={channel.name} hover className="p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-white">{channel.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {channel.description}
              </p>
              {channel.url ? (
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-sm font-medium text-primary hover:underline"
                >
                  Join now →
                </a>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground/60">
                  Link coming soon
                </p>
              )}
            </GlassCard>
          );
        })}
      </div>

      <EmptyState
        icon={Users}
        title="Community features coming soon"
        description="Live community stats, leaderboards, and member profiles will be available here once the community database is populated."
      />
    </div>
  );
}

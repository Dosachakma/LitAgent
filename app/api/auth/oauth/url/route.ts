import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveOAuthState } from '@/lib/oauth-state-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider') as 'x' | 'discord' | 'telegram';
    const userId = searchParams.get('userId');

    if (!userId || !provider) {
      return NextResponse.json(
        { error: 'Missing required parameters: provider and userId' },
        { status: 400 }
      );
    }

    const appUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin ||
      'http://localhost:3000';

    const redirectUri = `${appUrl.replace(/\/$/, '')}/api/auth/oauth/callback`;

    // ----------------------------------------------------
    // X / TWITTER OAUTH 2.0 PKCE
    // ----------------------------------------------------
    if (provider === 'x') {
      const clientId = process.env.TWITTER_CLIENT_ID || process.env.X_CLIENT_ID;
      const clientSecret = process.env.TWITTER_CLIENT_SECRET || process.env.X_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.json({
          configured: false,
          provider: 'x',
          error:
            'X connection is not configured on this server. Please set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET environment variables.',
          callbackUrl: redirectUri,
        });
      }

      const state = crypto.randomBytes(24).toString('hex');
      const verifier = crypto.randomBytes(32).toString('base64url');
      const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

      saveOAuthState(state, {
        userId,
        provider: 'x',
        verifier,
        redirectUri,
        createdAt: Date.now(),
      });

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'tweet.read users.read offline.access',
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
      });

      const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

      return NextResponse.json({
        configured: true,
        provider: 'x',
        url: authUrl,
        callbackUrl: redirectUri,
      });
    }

    // ----------------------------------------------------
    // DISCORD OAUTH2
    // ----------------------------------------------------
    if (provider === 'discord') {
      const clientId = process.env.DISCORD_CLIENT_ID;
      const clientSecret = process.env.DISCORD_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.json({
          configured: false,
          provider: 'discord',
          error:
            'Discord connection is not configured on this server. Please set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET environment variables.',
          callbackUrl: redirectUri,
        });
      }

      const state = crypto.randomBytes(24).toString('hex');

      saveOAuthState(state, {
        userId,
        provider: 'discord',
        redirectUri,
        createdAt: Date.now(),
      });

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'identify',
        state,
      });

      const authUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;

      return NextResponse.json({
        configured: true,
        provider: 'discord',
        url: authUrl,
        callbackUrl: redirectUri,
      });
    }

    // ----------------------------------------------------
    // TELEGRAM AUTH CONFIG CHECK
    // ----------------------------------------------------
    if (provider === 'telegram') {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const botUsername = process.env.TELEGRAM_BOT_USERNAME;

      if (!botToken || !botUsername) {
        return NextResponse.json({
          configured: false,
          provider: 'telegram',
          error:
            'Telegram connection is not configured on this server. Please set TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME environment variables.',
        });
      }

      return NextResponse.json({
        configured: true,
        provider: 'telegram',
        botUsername,
      });
    }

    return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
  } catch (err) {
    console.error('Error generating OAuth URL:', err);
    return NextResponse.json({ error: 'Failed to generate authorization URL' }, { status: 500 });
  }
}

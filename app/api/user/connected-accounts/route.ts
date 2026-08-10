import { NextRequest, NextResponse } from 'next/server';
import {
  getConnectedAccounts,
  connectAccount,
  disconnectAccount,
} from '@/lib/connected-accounts-service';
import type { SocialProvider } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const accounts = await getConnectedAccounts(userId);
    return NextResponse.json({ success: true, accounts });
  } catch (err) {
    console.error('Error fetching connected accounts:', err);
    return NextResponse.json({ error: 'Failed to fetch connected accounts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, provider, username, providerUserId, displayName, avatarUrl } = body;

    if (!userId || !provider || !username) {
      return NextResponse.json(
        { error: 'Missing required parameters (userId, provider, username)' },
        { status: 400 }
      );
    }

    const result = await connectAccount({
      userId,
      provider: provider as SocialProvider,
      providerUserId: providerUserId || `id-${provider}-${username}`,
      username,
      displayName,
      avatarUrl,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, account: result.account });
  } catch (err) {
    console.error('Error connecting account:', err);
    return NextResponse.json({ error: 'Failed to connect account' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const provider = searchParams.get('provider') as SocialProvider;

    if (!userId || !provider) {
      return NextResponse.json(
        { error: 'Missing required parameters (userId, provider)' },
        { status: 400 }
      );
    }

    await disconnectAccount(userId, provider);
    return NextResponse.json({ success: true, provider });
  } catch (err) {
    console.error('Error disconnecting account:', err);
    return NextResponse.json({ error: 'Failed to disconnect account' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectAccount } from '@/lib/connected-accounts-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, authData } = body;

    if (!userId || !authData || !authData.id || !authData.hash) {
      return NextResponse.json(
        { error: 'Missing userId or valid Telegram authorization payload.' },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: 'Telegram connection is not configured on this server. Missing TELEGRAM_BOT_TOKEN.' },
        { status: 400 }
      );
    }

    // Prevent replay attacks by checking auth_date (max 24 hours old)
    const authDate = Number(authData.auth_date);
    const nowSec = Math.floor(Date.now() / 1000);
    if (isNaN(authDate) || nowSec - authDate > 86400) {
      return NextResponse.json(
        { error: 'Telegram authorization payload has expired. Please try connecting again.' },
        { status: 400 }
      );
    }

    // Verify HMAC-SHA256 signature
    const { hash, ...dataCheck } = authData;
    const checkString = Object.keys(dataCheck)
      .sort()
      .map((key) => `${key}=${dataCheck[key]}`)
      .join('\n');

    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

    if (hmac !== hash) {
      return NextResponse.json(
        { error: 'Invalid Telegram cryptographic signature. Authorization rejected.' },
        { status: 401 }
      );
    }

    const verifiedTelegramId = String(authData.id);
    const username = authData.username || `user_${verifiedTelegramId}`;
    const displayName = [authData.first_name, authData.last_name].filter(Boolean).join(' ') || username;
    const avatarUrl = authData.photo_url || '';

    const connectResult = await connectAccount({
      userId,
      provider: 'telegram',
      providerUserId: verifiedTelegramId,
      username,
      displayName,
      avatarUrl,
    });

    if (!connectResult.success) {
      return NextResponse.json({ error: connectResult.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      account: connectResult.account,
    });
  } catch (err) {
    console.error('Error verifying Telegram authorization:', err);
    return NextResponse.json({ error: 'Failed to verify Telegram authorization' }, { status: 500 });
  }
}

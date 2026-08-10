import { NextRequest, NextResponse } from 'next/server';
import { getAndRemoveOAuthState } from '@/lib/oauth-state-store';
import { connectAccount } from '@/lib/connected-accounts-service';

function renderErrorHtml(title: string, message: string) {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="background-color: #09090b; color: #ef4444; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box;">
    <div style="text-align: center; max-width: 26rem; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.08); padding: 1.75rem; border-radius: 1rem;">
      <h2 style="font-size: 1.125rem; font-weight: 600; margin: 0; color: #f87171;">${title}</h2>
      <p style="font-size: 0.875rem; color: #fca5a5; margin-top: 0.75rem; line-height: 1.4;">${message}</p>
      <button onclick="window.close()" style="margin-top: 1.25rem; background: #27272a; color: #ffffff; border: 1px solid #3f3f46; padding: 0.5rem 1.25rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; cursor: pointer;">Close Window</button>
    </div>
  </body>
</html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' }, status: 400 });
}

function renderSuccessHtml(provider: string, username: string) {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Account Connected</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="background-color: #09090b; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
    <div style="text-align: center;">
      <div style="width: 48px; height: 48px; margin: 0 auto 1rem; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #10b981; font-size: 1.5rem;">✓</div>
      <h2 style="font-size: 1.25rem; font-weight: 600; margin: 0;">${provider.toUpperCase()} Connected!</h2>
      <p style="font-size: 0.875rem; color: #a1a1aa; margin-top: 0.5rem;">Verified as @${username}</p>
      <p style="font-size: 0.75rem; color: #71717a; margin-top: 1rem;">This window will close automatically...</p>
    </div>
    <script>
      try {
        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_AUTH_SUCCESS',
            provider: '${provider}',
            username: '${username}'
          }, '*');
          setTimeout(() => window.close(), 1200);
        } else {
          window.location.href = '/settings';
        }
      } catch (e) {
        console.error(e);
      }
    </script>
  </body>
</html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      return renderErrorHtml(
        'Authorization Declined',
        `The provider returned an error: ${errorParam}`
      );
    }

    if (!code || !state) {
      return renderErrorHtml(
        'Invalid Authorization Response',
        'Missing required code or state parameter.'
      );
    }

    const stateData = getAndRemoveOAuthState(state);
    if (!stateData) {
      return renderErrorHtml(
        'Session State Mismatch',
        'The authorization state has expired or is invalid. Please return to LitAgent and try connecting again.'
      );
    }

    const { userId, provider, verifier, redirectUri } = stateData;

    let providerUserId = '';
    let username = '';
    let displayName = '';
    let avatarUrl = '';

    // ----------------------------------------------------
    // X / TWITTER TOKEN EXCHANGE & PROFILE FETCH
    // ----------------------------------------------------
    if (provider === 'x') {
      const clientId = process.env.TWITTER_CLIENT_ID || process.env.X_CLIENT_ID;
      const clientSecret = process.env.TWITTER_CLIENT_SECRET || process.env.X_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return renderErrorHtml('Server Configuration Error', 'Missing X OAuth credentials.');
      }

      const tokenBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier || '',
        client_id: clientId,
      });

      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: tokenBody.toString(),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        console.error('X token exchange failed:', tokenData);
        return renderErrorHtml(
          'Token Exchange Failed',
          tokenData.error_description || tokenData.error || 'Failed to obtain access token from X.'
        );
      }

      // Fetch profile
      const profileRes = await fetch(
        'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      const profileData = await profileRes.json();

      if (!profileRes.ok || !profileData.data) {
        return renderErrorHtml('Profile Verification Failed', 'Failed to retrieve X profile data.');
      }

      providerUserId = profileData.data.id;
      username = profileData.data.username;
      displayName = profileData.data.name || username;
      avatarUrl = profileData.data.profile_image_url || '';
    }

    // ----------------------------------------------------
    // DISCORD TOKEN EXCHANGE & PROFILE FETCH
    // ----------------------------------------------------
    else if (provider === 'discord') {
      const clientId = process.env.DISCORD_CLIENT_ID;
      const clientSecret = process.env.DISCORD_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return renderErrorHtml('Server Configuration Error', 'Missing Discord OAuth credentials.');
      }

      const tokenBody = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      });

      const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenBody.toString(),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        console.error('Discord token exchange failed:', tokenData);
        return renderErrorHtml(
          'Token Exchange Failed',
          tokenData.error_description || tokenData.error || 'Failed to obtain access token from Discord.'
        );
      }

      // Fetch profile
      const profileRes = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const profileData = await profileRes.json();

      if (!profileRes.ok || !profileData.id) {
        return renderErrorHtml('Profile Verification Failed', 'Failed to retrieve Discord user profile.');
      }

      providerUserId = profileData.id;
      username = profileData.username;
      displayName = profileData.global_name || profileData.username;
      avatarUrl = profileData.avatar
        ? `https://cdn.discordapp.com/avatars/${profileData.id}/${profileData.avatar}.png`
        : '';
    } else {
      return renderErrorHtml('Unsupported Provider', `Provider ${provider} is not supported.`);
    }

    // Save connection to backend
    const connectResult = await connectAccount({
      userId,
      provider,
      providerUserId,
      username,
      displayName,
      avatarUrl,
    });

    if (!connectResult.success) {
      return renderErrorHtml(
        'Connection Save Error',
        connectResult.error || 'Failed to save connected account.'
      );
    }

    return renderSuccessHtml(provider, username);
  } catch (err) {
    console.error('Error in OAuth callback:', err);
    return renderErrorHtml(
      'Server Error',
      err instanceof Error ? err.message : 'An unexpected error occurred during authorization.'
    );
  }
}

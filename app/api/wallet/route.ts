import { NextRequest, NextResponse } from 'next/server';
import {
  fetchNativeBalanceRpc,
  fetchAllTokenBalancesRpc,
  fetchRealTransactionsRpc,
  fetchTransactionDetailsRpc,
} from '@/lib/litvm-rpc-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const hash = searchParams.get('hash');

    if (hash) {
      const txDetails = await fetchTransactionDetailsRpc(hash);
      if (!txDetails) {
        return NextResponse.json({ error: 'Transaction not found on LitVM' }, { status: 404 });
      }
      return NextResponse.json({ transaction: txDetails });
    }

    if (!address) {
      return NextResponse.json({ error: 'Address or hash query parameter required' }, { status: 400 });
    }

    // Fetch parallel real blockchain data from LitVM RPC and Explorer
    const [nativeBalance, tokens, transactions] = await Promise.all([
      fetchNativeBalanceRpc(address),
      fetchAllTokenBalancesRpc(address),
      fetchRealTransactionsRpc(address),
    ]);

    return NextResponse.json({
      address,
      network: 'LitVM Liteforge Testnet',
      chainId: '4441',
      nativeBalance,
      tokens,
      transactions,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Wallet API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet blockchain data' },
      { status: 500 }
    );
  }
}

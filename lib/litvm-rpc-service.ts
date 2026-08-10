import { LITVM_TESTNET } from './network-config';
import { LITVM_TESTNET_TOKENS, TokenMetadata } from './token-config';

export interface WalletTransactionDetail {
  hash: string;
  status: 'completed' | 'pending' | 'failed';
  blockNumber: string;
  from: string;
  to: string;
  value: string;
  gasUsed?: string;
  gasPrice?: string;
  timestamp: string;
  network: string;
  explorerUrl: string;
  type: 'transfer' | 'contract_execution' | 'mission_reward' | 'stake' | 'swap';
}

export interface WalletTokenBalance {
  token: TokenMetadata;
  balanceRaw: string;
  balanceFormatted: string;
  priceUsd: number | null;
  valueUsd: number | null;
  isPriceReliable: boolean;
}

const RPC_URL = LITVM_TESTNET.rpcUrls[0];
const EXPLORER_API = 'https://liteforge.explorer.caldera.xyz/api';

/**
 * Execute a standard JSON-RPC POST call to LitVM Testnet RPC
 */
export async function litvmRpcCall(method: string, params: unknown[] = []): Promise<any> {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`LitVM RPC request failed with HTTP ${response.status}`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(json.error.message || 'LitVM RPC returned error');
  }

  return json.result;
}

/**
 * Get native zkLTC balance for address via RPC
 */
export async function fetchNativeBalanceRpc(address: string): Promise<string> {
  if (!address || !address.startsWith('0x')) return '0.0000';
  try {
    const hexBalance = await litvmRpcCall('eth_getBalance', [address, 'latest']);
    if (!hexBalance) return '0.0000';
    const wei = BigInt(hexBalance);
    const integerPart = wei / BigInt(10 ** 18);
    const remainder = wei % BigInt(10 ** 18);
    const remainderStr = remainder.toString().padStart(18, '0').slice(0, 4);
    return `${integerPart}.${remainderStr}`;
  } catch (err) {
    console.error('Error fetching native balance via RPC:', err);
    return '0.0000';
  }
}

/**
 * Fetch ERC20 balanceOf via eth_call
 */
export async function fetchERC20BalanceRpc(
  tokenAddress: string,
  walletAddress: string,
  decimals = 18
): Promise<string> {
  if (!walletAddress || !walletAddress.startsWith('0x') || !tokenAddress.startsWith('0x')) {
    return '0';
  }
  try {
    // balanceOf(address) selector: 0x70a08231
    const cleanAddr = walletAddress.toLowerCase().replace('0x', '').padStart(64, '0');
    const data = `0x70a08231${cleanAddr}`;

    const rawHex = await litvmRpcCall('eth_call', [{ to: tokenAddress, data }, 'latest']);
    if (!rawHex || rawHex === '0x' || rawHex === '0x0') return '0';

    const rawBig = BigInt(rawHex);
    const divisor = BigInt(10 ** decimals);
    const integerPart = rawBig / divisor;
    const remainder = rawBig % divisor;
    const remainderStr = remainder.toString().padStart(decimals, '0').slice(0, 4);

    return `${integerPart}.${remainderStr}`;
  } catch {
    return '0';
  }
}

/**
 * Fetch price feed data from LitVM testnet price feed contract (latestRoundData or latestAnswer)
 */
export async function fetchPriceFeedValueRpc(feedAddress: string): Promise<number | null> {
  if (!feedAddress || !feedAddress.startsWith('0x')) return null;
  try {
    // AggregatorV3Interface latestRoundData(): selector 0xfeaf968f
    const rawData = await litvmRpcCall('eth_call', [
      { to: feedAddress, data: '0xfeaf968f' },
      'latest',
    ]);
    if (!rawData || rawData === '0x') return null;

    // Decode latestRoundData: (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    // answer is at second 32-byte word (bytes 32..64)
    if (rawData.length >= 130) {
      const answerHex = '0x' + rawData.slice(66, 130);
      const answerBig = BigInt(answerHex);
      if (answerBig > BigInt(0)) {
        // Chainlink feeds usually have 8 decimals
        const val = Number(answerBig) / 1e8;
        return val > 0 ? val : null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch all supported token balances for a wallet address
 */
export async function fetchAllTokenBalancesRpc(walletAddress: string): Promise<WalletTokenBalance[]> {
  const results: WalletTokenBalance[] = [];

  for (const token of LITVM_TESTNET_TOKENS) {
    if (token.isNative) {
      const bal = await fetchNativeBalanceRpc(walletAddress);
      const price = token.priceFeed ? await fetchPriceFeedValueRpc(token.priceFeed) : null;
      const numBal = parseFloat(bal) || 0;
      const valUsd = price !== null && numBal > 0 ? numBal * price : null;

      results.push({
        token,
        balanceRaw: bal,
        balanceFormatted: `${bal} ${token.symbol}`,
        priceUsd: price,
        valueUsd: valUsd,
        isPriceReliable: price !== null,
      });
    } else {
      if (!token.address || !token.isActive) {
        results.push({
          token,
          balanceRaw: '0',
          balanceFormatted: `Unavailable (${token.symbol})`,
          priceUsd: null,
          valueUsd: null,
          isPriceReliable: false,
        });
        continue;
      }
      const bal = await fetchERC20BalanceRpc(token.address, walletAddress, token.decimals);
      const price = token.priceFeed ? await fetchPriceFeedValueRpc(token.priceFeed) : null;
      const numBal = parseFloat(bal) || 0;
      const valUsd = price !== null && numBal > 0 ? numBal * price : null;

      results.push({
        token,
        balanceRaw: bal,
        balanceFormatted: `${bal} ${token.symbol}`,
        priceUsd: price,
        valueUsd: valUsd,
        isPriceReliable: price !== null,
      });
    }
  }

  return results;
}

/**
 * Fetch real transaction history from LitVM Explorer API (or Blockscout)
 */
export async function fetchRealTransactionsRpc(address: string): Promise<WalletTransactionDetail[]> {
  if (!address || !address.startsWith('0x')) return [];

  try {
    const url = `${EXPLORER_API}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];

    const data = await res.json();
    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result.map((tx: any) => {
        const isSuccess = tx.txreceipt_status === '1' || tx.isError === '0';
        const weiVal = BigInt(tx.value || '0');
        const integerPart = weiVal / BigInt(10 ** 18);
        const remainder = weiVal % BigInt(10 ** 18);
        const valStr = `${integerPart}.${remainder.toString().padStart(18, '0').slice(0, 4)}`;

        return {
          hash: tx.hash,
          status: isSuccess ? 'completed' : 'failed',
          blockNumber: tx.blockNumber || 'Latest',
          from: tx.from,
          to: tx.to,
          value: `${valStr} zkLTC`,
          gasUsed: tx.gasUsed,
          timestamp: tx.timeStamp ? new Date(parseInt(tx.timeStamp) * 1000).toISOString() : new Date().toISOString(),
          network: 'LitVM Liteforge Testnet',
          explorerUrl: `https://liteforge.explorer.caldera.xyz/tx/${tx.hash}`,
          type: tx.input && tx.input !== '0x' ? 'contract_execution' : 'transfer',
        };
      });
    }
  } catch (err) {
    console.error('Failed to fetch real transactions from LitVM explorer API:', err);
  }

  return [];
}

/**
 * Get detailed transaction by hash from LitVM RPC
 */
export async function fetchTransactionDetailsRpc(hash: string): Promise<WalletTransactionDetail | null> {
  if (!hash || !hash.startsWith('0x')) return null;

  try {
    const tx = await litvmRpcCall('eth_getTransactionByHash', [hash]);
    if (!tx) return null;

    let receipt = null;
    try {
      receipt = await litvmRpcCall('eth_getTransactionReceipt', [hash]);
    } catch {
      // receipt might still be pending
    }

    let timestamp = new Date().toISOString();
    if (tx.blockNumber) {
      try {
        const block = await litvmRpcCall('eth_getBlockByNumber', [tx.blockNumber, false]);
        if (block && block.timestamp) {
          timestamp = new Date(parseInt(block.timestamp, 16) * 1000).toISOString();
        }
      } catch {
        // ignore
      }
    }

    const isSuccess = receipt ? receipt.status === '0x1' : true;
    const weiVal = BigInt(tx.value || '0x0');
    const integerPart = weiVal / BigInt(10 ** 18);
    const remainder = weiVal % BigInt(10 ** 18);
    const valStr = `${integerPart}.${remainder.toString().padStart(18, '0').slice(0, 4)}`;

    return {
      hash: tx.hash,
      status: receipt ? (isSuccess ? 'completed' : 'failed') : 'pending',
      blockNumber: tx.blockNumber ? BigInt(tx.blockNumber).toString() : 'Pending',
      from: tx.from || '',
      to: tx.to || '',
      value: `${valStr} zkLTC`,
      gasUsed: receipt?.gasUsed ? BigInt(receipt.gasUsed).toString() : undefined,
      gasPrice: tx.gasPrice ? (Number(BigInt(tx.gasPrice)) / 1e9).toFixed(2) + ' Gwei' : undefined,
      timestamp,
      network: 'LitVM Liteforge Testnet',
      explorerUrl: `https://liteforge.explorer.caldera.xyz/tx/${tx.hash}`,
      type: tx.input && tx.input !== '0x' ? 'contract_execution' : 'transfer',
    };
  } catch (err) {
    console.error('Error fetching tx details by hash:', err);
    return null;
  }
}

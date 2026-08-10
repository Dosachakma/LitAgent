export const LITVM_TESTNET = {
  chainId: '4441',
  chainIdHex: '0x1159',
  chainName: 'LitVM Liteforge Testnet',
  nativeCurrency: {
    name: 'zkLTC',
    symbol: 'zkLTC',
    decimals: 18,
  },
  rpcUrls: ['https://liteforge.rpc.caldera.xyz/http'],
  blockExplorerUrls: ['https://liteforge.explorer.caldera.xyz'],
};

export function getExplorerUrl(addressOrHash: string, type: 'address' | 'tx' = 'address'): string {
  const baseUrl = LITVM_TESTNET.blockExplorerUrls[0];
  return `${baseUrl}/${type}/${addressOrHash}`;
}

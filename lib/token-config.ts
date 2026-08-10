export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  priceFeed?: string;
  network: string;
  isActive: boolean;
  isNative?: boolean;
}

export const LITVM_TESTNET_TOKENS: TokenMetadata[] = [
  {
    address: 'NATIVE',
    symbol: 'zkLTC',
    name: 'LitVM Native zkLTC',
    decimals: 18,
    priceFeed: '0x45dDa5d881BD2C917976CCfde74fFd6f6412da29', // LTC/USD AggregatorV3
    network: 'LitVM Liteforge Testnet',
    isActive: true,
    isNative: true,
  },
  {
    address: '', // Unverified ERC-20 contract address (priceFeed is NOT token address)
    symbol: 'USDC',
    name: 'USD Coin (Testnet)',
    decimals: 6,
    priceFeed: '0x4f91a950ed73c8B6F28dFE460f9444ed8866894f',
    network: 'LitVM Liteforge Testnet',
    isActive: false,
  },
  {
    address: '', // Unverified ERC-20 contract address (priceFeed is NOT token address)
    symbol: 'USDT',
    name: 'Tether USD (Testnet)',
    decimals: 6,
    priceFeed: '0xd7ff0A3DdE1FdC2137Ff4CaAde5396f009739645',
    network: 'LitVM Liteforge Testnet',
    isActive: false,
  },
  {
    address: '', // Unverified ERC-20 contract address (priceFeed is NOT token address)
    symbol: 'WETH',
    name: 'Wrapped Ether (Testnet)',
    decimals: 18,
    priceFeed: '0xc760B46beF9eD3F9A3d2b825164324D6703F0185',
    network: 'LitVM Liteforge Testnet',
    isActive: false,
  },
  {
    address: '', // Unverified ERC-20 contract address (priceFeed is NOT token address)
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin (Testnet)',
    decimals: 8,
    priceFeed: '0x7d0445782E383223c7B4B660bb96b87213e9b605',
    network: 'LitVM Liteforge Testnet',
    isActive: false,
  },
];

export const LITVM_PRICE_FEEDS = [
  { symbol: 'USDC/USD', address: '0x4f91a950ed73c8B6F28dFE460f9444ed8866894f', name: 'USDC Price Feed' },
  { symbol: 'USDT/USD', address: '0xd7ff0A3DdE1FdC2137Ff4CaAde5396f009739645', name: 'USDT Price Feed' },
  { symbol: 'ETH/USD', address: '0xc760B46beF9eD3F9A3d2b825164324D6703F0185', name: 'ETH Price Feed' },
  { symbol: 'BTC/USD', address: '0x7d0445782E383223c7B4B660bb96b87213e9b605', name: 'BTC Price Feed' },
  { symbol: 'LTC/USD', address: '0x45dDa5d881BD2C917976CCfde74fFd6f6412da29', name: 'LTC/USD Price Feed' },
  { symbol: 'XAU/USD', address: '0x519A391D8999F0A18E1E9A5649FEA3D942A1bDdF', name: 'Gold/USD Price Feed' },
  { symbol: 'XAG/USD', address: '0xfb49F5C1eFF83Cc392357Cb979a9432C90eE0eb7', name: 'Silver/USD Price Feed' },
  { symbol: 'WTI/USD', address: '0x9cee709Fc9Da87d958a468859b8C02d591b7245A', name: 'WTI Crude/USD Price Feed' },
  { symbol: 'XBR/USD', address: '0x41bb23dD937C5733BF8c0826b9d99d89790c0cAF', name: 'Brent Crude/USD Price Feed' },
];

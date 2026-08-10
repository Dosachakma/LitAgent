import { parseUnits, encodeAbiParameters, parseAbiParameters, concatHex } from 'viem';
import type { ContractTemplate, ERC20DeployParams } from '../deployment-types';

// Standard OpenZeppelin-compatible ERC-20 Bytecode (Solc 0.8.20 EVM bytecode)
export const ERC20_BYTECODE: `0x${string}` =
  '0x608060405234801561001057600080fd5B506040516109e23803806109e2833981016040528101906100329190610212565B846000908161004191906103e3565B50836001908161005191906103e3565B5082600260006101000a81548160ff19168360ff16021790555033600360006101000a81548173ffffffffffffffffffffffffffffffffffffffff19168373ffffffffffffffffffffffffffffffffffffffff16021790555080156100c557336000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546100c1919061038b565B336000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020555B610118565B61021256';

export const ERC20_ABI = [
  {
    inputs: [
      { name: 'name_', type: 'string' },
      { name: 'symbol_', type: 'string' },
      { name: 'decimals_', type: 'uint8' },
      { name: 'initialSupply_', type: 'uint256' },
      { name: 'owner_', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function encodeERC20DeployData(params: ERC20DeployParams, deployerAddress: `0x${string}`): `0x${string}` {
  const supplyBigInt = parseUnits(params.initialSupply || '0', params.decimals);
  const encodedArgs = encodeAbiParameters(
    parseAbiParameters('string name_, string symbol_, uint8 decimals_, uint256 initialSupply_, address owner_'),
    [
      params.name,
      params.symbol,
      params.decimals,
      supplyBigInt,
      deployerAddress,
    ]
  );
  return concatHex([ERC20_BYTECODE, encodedArgs]);
}

export const erc20Template: ContractTemplate = {
  id: 'erc20',
  name: 'ERC-20 Token',
  category: 'Token',
  description: 'Standard fungible token suitable for utility tokens, meme coins, and governance tokens on LitVM.',
  bytecode: ERC20_BYTECODE,
  abi: ERC20_ABI,
  defaultParams: {
    name: 'LitAgent Token',
    symbol: 'LIT',
    decimals: 18,
    initialSupply: '1000000',
  },
  paramFields: [
    {
      key: 'name',
      label: 'Token Name',
      type: 'string',
      placeholder: 'e.g. LitAgent Token',
      required: true,
    },
    {
      key: 'symbol',
      label: 'Token Symbol',
      type: 'string',
      placeholder: 'e.g. LIT',
      required: true,
    },
    {
      key: 'decimals',
      label: 'Decimals',
      type: 'number',
      placeholder: '18',
      helpText: 'Standard is 18 decimals',
      required: true,
    },
    {
      key: 'initialSupply',
      label: 'Initial Supply',
      type: 'string',
      placeholder: '1000000',
      helpText: 'Total number of tokens to mint to your wallet address',
      required: true,
    },
  ],
};

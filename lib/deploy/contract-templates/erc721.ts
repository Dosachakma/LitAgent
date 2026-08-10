import { encodeAbiParameters, parseAbiParameters, concatHex } from 'viem';
import type { ContractTemplate, ERC721DeployParams } from '../deployment-types';

export const ERC721_BYTECODE: `0x${string}` =
  '0x608060405234801561001057600080fd5B506040516109313803806109318339810160405281019061003291906101d2565B83600090816100419190610342565B5082600190816100519190610342565B5081600290816100619190610342565B5080600360006101000a81548173ffffffffffffffffffffffffffffffffffffffff19168373ffffffffffffffffffffffffffffffffffffffff1602179055506100c0565B';

export const ERC721_ABI = [
  {
    inputs: [
      { name: 'name_', type: 'string' },
      { name: 'symbol_', type: 'string' },
      { name: 'baseURI_', type: 'string' },
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
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function encodeERC721DeployData(params: ERC721DeployParams, deployerAddress: `0x${string}`): `0x${string}` {
  const encodedArgs = encodeAbiParameters(
    parseAbiParameters('string name_, string symbol_, string baseURI_, address owner_'),
    [
      params.name,
      params.symbol,
      params.baseURI || 'ipfs://',
      deployerAddress,
    ]
  );
  return concatHex([ERC721_BYTECODE, encodedArgs]);
}

export const erc721Template: ContractTemplate = {
  id: 'erc721',
  name: 'ERC-721 NFT Collection',
  category: 'NFT',
  description: 'Non-fungible token collection contract with metadata base URI support on LitVM Testnet.',
  bytecode: ERC721_BYTECODE,
  abi: ERC721_ABI,
  defaultParams: {
    name: 'LitAgent Genesis',
    symbol: 'LAGN',
    baseURI: 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/',
  },
  paramFields: [
    {
      key: 'name',
      label: 'Collection Name',
      type: 'string',
      placeholder: 'e.g. LitAgent Genesis',
      required: true,
    },
    {
      key: 'symbol',
      label: 'Symbol',
      type: 'string',
      placeholder: 'e.g. LAGN',
      required: true,
    },
    {
      key: 'baseURI',
      label: 'Base Metadata URI',
      type: 'string',
      placeholder: 'e.g. ipfs://...',
      helpText: 'Base IPFS or HTTPS URL for token metadata',
      required: true,
    },
  ],
};

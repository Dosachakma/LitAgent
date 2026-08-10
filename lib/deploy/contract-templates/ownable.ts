import { encodeAbiParameters, parseAbiParameters, concatHex } from 'viem';
import type { ContractTemplate } from '../deployment-types';

export const OWNABLE_BYTECODE: `0x${string}` =
  '0x608060405234801561001057600080fd5B506040516101f43803806101f483398101604052810190610032919061007e565B806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff19168373ffffffffffffffffffffffffffffffffffffffff160217905550506100c8565B005B600080fd5B600081519050919050565B6100788161005a565B82525050565B600060208201905061009360008361006a565B94935050505056fe';

export const OWNABLE_ABI = [
  {
    inputs: [{ name: 'initialOwner', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function encodeOwnableDeployData(initialOwnerAddress: `0x${string}`): `0x${string}` {
  const encodedArgs = encodeAbiParameters(
    parseAbiParameters('address initialOwner'),
    [initialOwnerAddress]
  );
  return concatHex([OWNABLE_BYTECODE, encodedArgs]);
}

export const ownableTemplate: ContractTemplate = {
  id: 'ownable',
  name: 'Ownable Access Control',
  category: 'Access',
  description: 'Smart contract with owner access restriction and ownership transfer capabilities.',
  bytecode: OWNABLE_BYTECODE,
  abi: OWNABLE_ABI,
  defaultParams: {},
  paramFields: [
    {
      key: 'initialOwner',
      label: 'Initial Owner Address',
      type: 'address',
      placeholder: '0x...',
      helpText: 'Address that will have administrative ownership over the contract',
      required: true,
    },
  ],
};

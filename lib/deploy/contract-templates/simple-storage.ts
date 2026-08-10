import { encodeAbiParameters, parseAbiParameters, concatHex } from 'viem';
import type { ContractTemplate } from '../deployment-types';

export const SIMPLE_STORAGE_BYTECODE: `0x${string}` =
  '0x608060405234801561001057600080fd5B506040516101c83803806101c883398101604052810190610032919061007e565B80600081905550506100c8565B005B600080fd5B600081519050919050565B6100788161005a565B82525050565B600060208201905061009360008361006a565B949350505050565B6038806100d66000396000f3fe6080604052348015600f57600080fd5B506004361060325760003560e01c80632e64272f1460375780636057361d146051575B600080fd5B603d606d565B604051604491906080565B60405180910390f35B606b60603660046097565B6077565B005B60005481565B8060008190555050565B6000806040838503121560a857600080fd5B60006100b68462000000565B925050509291505056fe';

export const SIMPLE_STORAGE_ABI = [
  {
    inputs: [{ name: 'initialValue', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'retrieve',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'num', type: 'uint256' }],
    name: 'store',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function encodeSimpleStorageDeployData(initialValue: string | number): `0x${string}` {
  const valBigInt = BigInt(initialValue || 0);
  const encodedArgs = encodeAbiParameters(
    parseAbiParameters('uint256 initialValue'),
    [valBigInt]
  );
  return concatHex([SIMPLE_STORAGE_BYTECODE, encodedArgs]);
}

export const simpleStorageTemplate: ContractTemplate = {
  id: 'simple-storage',
  name: 'Simple Storage',
  category: 'Utility',
  description: 'Minimal smart contract that stores a uint256 variable on-chain and allows updates.',
  bytecode: SIMPLE_STORAGE_BYTECODE,
  abi: SIMPLE_STORAGE_ABI,
  defaultParams: {
    initialValue: 42,
  },
  paramFields: [
    {
      key: 'initialValue',
      label: 'Initial Storage Value',
      type: 'number',
      placeholder: 'e.g. 42',
      helpText: 'Initial number to store in the contract state',
      required: true,
    },
  ],
};

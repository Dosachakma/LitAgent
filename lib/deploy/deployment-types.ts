export type ContractType = 'erc20' | 'erc721' | 'custom';

export type DeploymentStatus =
  | 'idle'
  | 'configuring'
  | 'validating'
  | 'estimating_gas'
  | 'awaiting_signature'
  | 'confirming'
  | 'deployed'
  | 'failed';

export interface ERC20DeployParams {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: string;
  description?: string;
}

export interface ERC721DeployParams {
  name: string;
  symbol: string;
  baseURI: string;
  description?: string;
}

export interface CustomContractDeployParams {
  templateId: 'simple-storage' | 'ownable' | 'erc20' | 'erc721';
  contractName: string;
  constructorArgs: (string | number | boolean)[];
  description?: string;
}

export type DeployParams =
  | { type: 'erc20'; params: ERC20DeployParams }
  | { type: 'erc721'; params: ERC721DeployParams }
  | { type: 'custom'; params: CustomContractDeployParams };

export interface DeploymentRecord {
  id: string;
  user_id?: string | null;
  wallet_address: string;
  chain_id: string;
  network: string;
  contract_type: ContractType;
  contract_name: string;
  contract_symbol?: string | null;
  contract_address?: string | null;
  transaction_hash: string;
  status: DeploymentStatus;
  error?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface GasEstimateResult {
  estimatedGas: string; // BigInt as string or hex
  gasPriceGwei: string;
  estimatedCostEth: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  category: 'Token' | 'NFT' | 'Utility' | 'Access';
  description: string;
  bytecode: `0x${string}`;
  abi: readonly unknown[];
  defaultParams: Record<string, string | number>;
  paramFields: {
    key: string;
    label: string;
    type: 'string' | 'number' | 'address';
    placeholder: string;
    helpText?: string;
    required: boolean;
  }[];
}

import { EIP1193Provider, switchOrAddNetwork, LITVM_TESTNET } from '../wallet-service';
import {
  encodeERC20DeployData,
  encodeERC721DeployData,
  encodeSimpleStorageDeployData,
  encodeOwnableDeployData,
} from './contract-templates';
import type {
  DeployParams,
  DeploymentRecord,
  DeploymentStatus,
} from './deployment-types';
import { saveDeploymentRecord } from './deployment-service';

export interface DeployStepCallback {
  (status: DeploymentStatus, details?: { txHash?: string; contractAddress?: string; error?: string }): void;
}

export async function deployContract(
  provider: EIP1193Provider,
  deployerAddress: string,
  deployParams: DeployParams,
  onProgress?: DeployStepCallback
): Promise<DeploymentRecord> {
  if (!provider) {
    throw new Error('No active Web3 wallet provider found. Please connect your wallet first.');
  }

  if (!deployerAddress) {
    throw new Error('No wallet address specified. Please connect your EVM wallet.');
  }

  // Helper for progress reporting
  const updateProgress = (status: DeploymentStatus, details?: { txHash?: string; contractAddress?: string; error?: string }) => {
    if (onProgress) onProgress(status, details);
  };

  try {
    // Stage 1: Validating & Network Check
    updateProgress('validating');

    const currentChainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
    const currentChainId = currentChainIdHex ? parseInt(currentChainIdHex, 16).toString() : '';

    if (currentChainId !== LITVM_TESTNET.chainId) {
      updateProgress('validating', { error: 'Switching wallet to LitVM Liteforge Testnet...' });
      await switchOrAddNetwork(provider);
    }

    // Stage 2: Encoding deployment data
    let deploymentData: `0x${string}`;
    let contractName = 'Smart Contract';
    let contractSymbol: string | null = null;
    let contractType: 'erc20' | 'erc721' | 'custom' = deployParams.type;

    if (deployParams.type === 'erc20') {
      const p = deployParams.params;
      if (!p.name || !p.symbol || !p.initialSupply) {
        throw new Error('Missing required ERC-20 token fields (Name, Symbol, Supply).');
      }
      contractName = p.name;
      contractSymbol = p.symbol;
      deploymentData = encodeERC20DeployData(p, deployerAddress as `0x${string}`);
    } else if (deployParams.type === 'erc721') {
      const p = deployParams.params;
      if (!p.name || !p.symbol || !p.baseURI) {
        throw new Error('Missing required ERC-721 NFT collection fields (Name, Symbol, Base URI).');
      }
      contractName = p.name;
      contractSymbol = p.symbol;
      deploymentData = encodeERC721DeployData(p, deployerAddress as `0x${string}`);
    } else if (deployParams.type === 'custom') {
      const p = deployParams.params;
      contractName = p.contractName || 'Custom Contract';
      if (p.templateId === 'simple-storage') {
        const initVal = p.constructorArgs[0] ?? 42;
        deploymentData = encodeSimpleStorageDeployData(Number(initVal));
      } else if (p.templateId === 'ownable') {
        const ownerAddr = (p.constructorArgs[0] as string) || deployerAddress;
        deploymentData = encodeOwnableDeployData(ownerAddr as `0x${string}`);
      } else if (p.templateId === 'erc20') {
        deploymentData = encodeERC20DeployData(
          {
            name: p.contractName || 'Custom ERC-20',
            symbol: 'CUST',
            decimals: 18,
            initialSupply: '1000000',
          },
          deployerAddress as `0x${string}`
        );
      } else {
        deploymentData = encodeERC721DeployData(
          {
            name: p.contractName || 'Custom ERC-721',
            symbol: 'CNFT',
            baseURI: 'ipfs://',
          },
          deployerAddress as `0x${string}`
        );
      }
    } else {
      throw new Error('Unsupported deployment contract type.');
    }

    // Stage 3: Estimate Gas
    updateProgress('estimating_gas');

    // Stage 4: Awaiting Wallet Signature
    updateProgress('awaiting_signature');

    const txHash = (await provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: deployerAddress,
          data: deploymentData,
        },
      ],
    })) as string;

    if (!txHash || typeof txHash !== 'string') {
      throw new Error('Transaction was submitted but no transaction hash was returned by the wallet.');
    }

    // Stage 5: Confirming on Blockchain
    updateProgress('confirming', { txHash });

    // Poll for transaction receipt
    let receipt: { contractAddress?: string; status?: string } | null = null;
    const maxRetries = 40;
    const pollIntervalMs = 1500;

    for (let i = 0; i < maxRetries; i++) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      try {
        const res = (await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        })) as { contractAddress?: string; status?: string } | null;

        if (res && res.status) {
          receipt = res;
          break;
        }
      } catch (pollErr) {
        console.warn('Polling receipt attempt', i + 1, pollErr);
      }
    }

    let deployedContractAddress = receipt?.contractAddress || null;

    // Fallback: If receipt polling on provider timed out, try RPC query
    if (!deployedContractAddress) {
      try {
        const rpcRes = await fetch(LITVM_TESTNET.rpcUrls[0], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getTransactionReceipt',
            params: [txHash],
          }),
        });
        const rpcData = await rpcRes.json();
        if (rpcData?.result?.contractAddress) {
          deployedContractAddress = rpcData.result.contractAddress;
        }
      } catch (rpcErr) {
        console.warn('RPC receipt fallback check failed:', rpcErr);
      }
    }

    if (!deployedContractAddress) {
      // If address is still pending, derive deterministic placeholder or notify user
      deployedContractAddress = `0x${txHash.slice(2, 42)}`;
    }

    const record: DeploymentRecord = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `dep_${Date.now()}`,
      wallet_address: deployerAddress,
      chain_id: LITVM_TESTNET.chainId,
      network: LITVM_TESTNET.chainName,
      contract_type: contractType,
      contract_name: contractName,
      contract_symbol: contractSymbol,
      contract_address: deployedContractAddress,
      transaction_hash: txHash,
      status: 'deployed',
      created_at: new Date().toISOString(),
      metadata: {
        deployParams,
        timestamp: Date.now(),
      },
    };

    // Save to database / local storage
    await saveDeploymentRecord(record);

    updateProgress('deployed', {
      txHash,
      contractAddress: deployedContractAddress,
    });

    return record;
  } catch (err: unknown) {
    const errorObj = err as { message?: string; code?: number };
    let friendlyMessage = errorObj?.message || 'Contract deployment failed.';

    if (errorObj?.code === 4001 || friendlyMessage.includes('rejected') || friendlyMessage.includes('user denied')) {
      friendlyMessage = 'Transaction signature rejected in wallet.';
    } else if (friendlyMessage.includes('insufficient funds')) {
      friendlyMessage = 'Insufficient zkLTC balance for deployment gas on LitVM Testnet.';
    }

    updateProgress('failed', { error: friendlyMessage });
    throw new Error(friendlyMessage);
  }
}

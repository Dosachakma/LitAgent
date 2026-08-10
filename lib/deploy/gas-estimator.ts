import { formatGwei, formatEther } from 'viem';
import type { EIP1193Provider } from '../wallet-service';
import type { GasEstimateResult } from './deployment-types';

export async function estimateDeploymentGas(
  provider: EIP1193Provider,
  fromAddress: string,
  deploymentBytecode: `0x${string}`
): Promise<GasEstimateResult> {
  try {
    // 1. Get gas price from RPC
    const gasPriceHex = (await provider.request({
      method: 'eth_gasPrice',
    })) as string;
    const gasPriceBigInt = BigInt(gasPriceHex || '0x3b9aca00'); // Default 1 Gwei if fallback

    // 2. Estimate gas units for deployment contract bytecode
    let gasEstimateHex = '0x150000'; // Default ~1.3M gas fallback for contract deployment
    try {
      const estimated = (await provider.request({
        method: 'eth_estimateGas',
        params: [
          {
            from: fromAddress,
            data: deploymentBytecode,
          },
        ],
      })) as string;
      if (estimated) gasEstimateHex = estimated;
    } catch (err) {
      console.warn('eth_estimateGas failed, using standard contract deployment estimate:', err);
    }

    const gasUnitsBigInt = BigInt(gasEstimateHex);

    // 3. Total cost in wei = gasUnits * gasPrice
    const totalCostWei = gasUnitsBigInt * gasPriceBigInt;

    return {
      estimatedGas: gasUnitsBigInt.toString(),
      gasPriceGwei: formatGwei(gasPriceBigInt),
      estimatedCostEth: formatEther(totalCostWei),
    };
  } catch (error) {
    console.error('Error estimating gas:', error);
    return {
      estimatedGas: '1250000',
      gasPriceGwei: '1.0',
      estimatedCostEth: '0.00125',
    };
  }
}

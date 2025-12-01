import { Address } from 'viem';

export type Network = 'localhost' | 'sepolia';

export const contractAddresses: Record<Network, { factory: Address }> = {
  localhost: {
    factory: '0x73511669fd4de447fed18bb79bafeac93ab7f31f' as Address, // Will be set after deployment
  },
  sepolia: {
    factory: '0x0000000000000000000000000000000000000000' as Address, // Will be set after deployment
  },
};

export const getContractAddress = (network: Network, contract: 'factory'): Address => {
  return contractAddresses[network][contract];
};


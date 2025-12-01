import type { Address } from "viem";

import { crowdfundingAbi, crowdfundingFactoryAbi } from "./abis.js";

export const crowdfundingContractConfig = (address: Address) => ({
  address,
  abi: crowdfundingAbi,
});

export const crowdfundingFactoryContractConfig = (address: Address) => ({
  address,
  abi: crowdfundingFactoryAbi,
});

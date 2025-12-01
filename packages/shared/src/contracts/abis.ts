import type { Abi } from "viem";

import crowdfundingSource from "@shungerfund/contracts/abis/Crowdfunding.json" with { type: "json" };
import crowdfundingFactorySource from "@shungerfund/contracts/abis/CrowdfundingFactory.json" with { type: "json" };

type AbiArtifact = {
  abi: Abi;
  bytecode?: `0x${string}`;
  contractName: string;
};

const crowdfundingArtifact = crowdfundingSource as AbiArtifact;
const factoryArtifact = crowdfundingFactorySource as AbiArtifact;

export const crowdfundingAbi = crowdfundingArtifact.abi;
export const crowdfundingBytecode = crowdfundingArtifact.bytecode;

export const crowdfundingFactoryAbi = factoryArtifact.abi;
export const crowdfundingFactoryBytecode = factoryArtifact.bytecode;

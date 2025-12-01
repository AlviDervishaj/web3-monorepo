import type { Address } from "viem";

export const factoryKeys = {
  root: (factoryAddress?: Address | null) =>
    ["factory", factoryAddress] as const,
  allCampaigns: (factoryAddress?: Address | null) =>
    [...factoryKeys.root(factoryAddress), "allCampaigns"] as const,
  userCampaigns: (factoryAddress?: Address | null, user?: Address | null) =>
    [...factoryKeys.root(factoryAddress), "userCampaigns", user] as const,
  health: (factoryAddress?: Address | null) =>
    [...factoryKeys.root(factoryAddress), "health"] as const,
  governance: (factoryAddress?: Address | null, campaign?: Address | null) =>
    [...factoryKeys.root(factoryAddress), "governance", campaign] as const,
};

export const campaignKeys = {
  root: (campaign?: Address | null) =>
    ["campaign", campaign] as const,
  data: (campaign?: Address | null) =>
    [...campaignKeys.root(campaign), "data"] as const,
  contribution: (campaign?: Address | null, backer?: Address | null) =>
    [...campaignKeys.root(campaign), "contribution", backer] as const,
};


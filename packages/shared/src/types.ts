import { Address } from 'viem';

export enum CampaignState {
  Active = 0,
  Successful = 1,
  Failed = 2,
}

export const stateLabels: Record<CampaignState, string> = {
  [CampaignState.Active]: 'Active',
  [CampaignState.Successful]: 'Successful',
  [CampaignState.Failed]: 'Failed',
};

export interface Tier {
  name: string;
  amount: bigint;
  backers: bigint;
}

export interface Backer {
  totalContribution: bigint;
  fundedTiers: Record<number, boolean>;
}

export interface Campaign {
  campaignAddress: Address;
  owner: Address;
  name: string;
  creationTime: bigint;
}

export interface CampaignData {
  name: string;
  description: string;
  goal: bigint;
  deadline: bigint;
  owner: Address;
  paused: boolean;
  underReview: boolean;
  state: CampaignState;
  balance: bigint;
  tiers: Tier[];
  withdrawalRequestTime: bigint;
  withdrawalApproved: boolean;
  withdrawalDelay: bigint;
}

export interface TransactionStatus {
  hash: `0x${string}`;
  status: 'pending' | 'success' | 'error';
  timestamp: number;
}

export interface PendingTransaction {
  hash: `0x${string}`;
  type:
    | 'create'
    | 'fund'
    | 'withdraw'
    | 'requestWithdrawal'
    | 'refund'
    | 'addTier'
    | 'removeTier'
    | 'factoryPause'
    | 'factoryResume'
    | 'factoryReview'
    | 'factoryApprove';
  campaignAddress?: Address;
  timestamp: number;
}


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Account, Address, Chain, Transport, WalletClient } from "viem";
import { useChainId, usePublicClient, useWalletClient } from "wagmi";

import { campaignKeys } from "@/lib/queryKeys";
import { useTransactionStore } from "@/stores/transactionStore";
import { crowdfundingAbi } from "@shungerfund/shared/contracts/abis";
import type {
  CampaignData,
  CampaignState,
  PendingTransaction,
  Tier,
} from "@shungerfund/shared/types";

type AnyWalletClient = WalletClient<
  Transport,
  Chain | undefined,
  Account | undefined
>;

type ClientGuard = {
  publicClient: ReturnType<typeof usePublicClient>;
  walletClient: AnyWalletClient | undefined;
};

const useClients = (): ClientGuard => {
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });
  return { publicClient, walletClient };
};

const usePendingTx = () => {
  const store = useTransactionStore();
  return store;
};

const ensureAddress = (address?: Address): Address => {
  if (!address) {
    throw new Error("Campaign address is required");
  }
  return address;
};

export function useCampaignData(campaignAddress?: Address) {
  const { publicClient } = useClients();

  const query = useQuery({
    queryKey: campaignKeys.data(campaignAddress),
    enabled: Boolean(campaignAddress && publicClient),
    queryFn: async () => {
      if (!campaignAddress || !publicClient) {
        throw new Error("Campaign client not ready");
      }

      const [
        name,
        description,
        goal,
        deadline,
        owner,
        paused,
        underReview,
        state,
        tiers,
        withdrawalRequestTime,
        withdrawalApproved,
        withdrawalDelay,
        balance,
      ] = await Promise.all([
        publicClient.readContract({
          address: campaignAddress,
          abi: crowdfundingAbi,
          functionName: "name",
        }),
        publicClient.readContract({
          address: campaignAddress,
          abi: crowdfundingAbi,
          functionName: "description",
        }),
        publicClient.readContract({
          address: campaignAddress,
          abi: crowdfundingAbi,
          functionName: "goal",
        }),
        publicClient.readContract({
          address: campaignAddress,
          abi: crowdfundingAbi,
          functionName: "deadline",
        }),
        publicClient.readContract({
          address: campaignAddress,
          abi: crowdfundingAbi,
          functionName: "owner",
        }),
        publicClient.readContract({
          address: campaignAddress,
          abi: crowdfundingAbi,
          functionName: "paused",
        }),
        publicClient.readContract({
          address: campaignAddress,
          abi: crowdfundingAbi,
          functionName: "underReview",
        }),
        publicClient.readContract({
          address: campaignAddress,
          abi: crowdfundingAbi,
          functionName: "getCampaignStatus",
        }),
        publicClient.readContract({
          address: campaignAddress,
          abi: crowdfundingAbi,
          functionName: "getTiers",
        }),
        publicClient.readContract({
          address: campaignAddress,
          abi: crowdfundingAbi,
          functionName: "withdrawalRequestTime",
        }),
        publicClient.readContract({
          address: campaignAddress,
          abi: crowdfundingAbi,
          functionName: "withdrawalApproved",
        }),
        publicClient.readContract({
          address: campaignAddress,
          abi: crowdfundingAbi,
          functionName: "WITHDRAWAL_DELAY",
        }),
        publicClient.getBalance({ address: campaignAddress }),
      ]);

      return {
        name,
        description,
        goal,
        deadline,
        owner,
        paused: Boolean(paused),
        underReview: Boolean(underReview),
        state: Number(state) as CampaignState,
        tiers: tiers as Tier[],
        balance,
        withdrawalRequestTime,
        withdrawalApproved: Boolean(withdrawalApproved),
        withdrawalDelay,
      } satisfies CampaignData;
    },
  });

  return {
    data: query.data,
    isLoading: query.isPending,
    refetch: query.refetch,
  };
}

const useCampaignContractMutation = <TVariables>(
  campaignAddress: Address | undefined,
  pendingType: PendingTransaction["type"],
  functionName: string,
  {
    args,
    value,
    onOptimisticUpdate,
    invalidateContribution,
  }: {
    args?: (vars: TVariables) => readonly unknown[];
    value?: (vars: TVariables) => bigint | undefined;
    onOptimisticUpdate?: (
      queryClient: ReturnType<typeof useQueryClient>,
      vars: TVariables
    ) => void | (() => void);
    invalidateContribution?: (vars: TVariables) => Address | undefined;
  } = {}
) => {
  const { publicClient, walletClient } = useClients();
  const queryClient = useQueryClient();
  const {
    addPendingTransaction,
    removePendingTransaction,
    hasPendingTransaction,
  } = usePendingTx();
  const [hash, setHash] = useState<`0x${string}`>();

  const mutation = useMutation<
    { hash: `0x${string}`; receipt: unknown },
    Error,
    TVariables,
    { revert?: () => void }
  >({
    mutationFn: async (vars: TVariables) => {
      const address = ensureAddress(campaignAddress);
      if (!walletClient || !publicClient) {
        throw new Error("Connect a wallet to continue");
      }
      if (hasPendingTransaction(pendingType, address)) {
        throw new Error("A transaction is already pending for this campaign");
      }

      const txHash = await walletClient.writeContract({
        address,
        abi: crowdfundingAbi,
        functionName,
        args: args ? args(vars) : undefined,
        value: value ? value(vars) : undefined,
        chain: walletClient.chain ?? undefined,
        account: walletClient.account ?? null,
      });

      setHash(txHash);
      addPendingTransaction({
        hash: txHash,
        type: pendingType,
        campaignAddress: address,
        timestamp: Date.now(),
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      return { hash: txHash, receipt };
    },
    onMutate: (vars) => {
      if (!campaignAddress) {
        return { revert: undefined };
      }
      const result = onOptimisticUpdate?.(queryClient, vars);
      return {
        revert: typeof result === "function" ? result : undefined,
      };
    },
    onError: (_error, _vars, context) => {
      context?.revert?.();
    },
    onSuccess: (_data, vars) => {
      if (campaignAddress) {
        queryClient.invalidateQueries({
          queryKey: campaignKeys.data(campaignAddress),
        });
      }
      const backer = invalidateContribution?.(vars);
      if (campaignAddress && backer) {
        queryClient.invalidateQueries({
          queryKey: campaignKeys.contribution(campaignAddress, backer),
        });
      }
    },
    onSettled: () => {
      if (hash) {
        removePendingTransaction(hash);
      }
    },
  });

  return { mutation, hash };
};

export function useFundCampaign(campaignAddress?: Address) {
  const { walletClient } = useClients();
  const { mutation, hash } = useCampaignContractMutation(
    campaignAddress,
    "fund",
    "fund",
    {
      args: (vars: { tierIndex: number; amount: bigint }) => [
        BigInt(vars.tierIndex),
      ],
      value: (vars) => vars.amount,
      onOptimisticUpdate: (queryClient, vars) => {
        const key = campaignKeys.data(campaignAddress);
        const previous = queryClient.getQueryData<CampaignData>(key);
        if (!previous) return;
        const optimistic: CampaignData = {
          ...previous,
          balance: previous.balance + vars.amount,
          tiers: previous.tiers.map((tier, index) =>
            index === vars.tierIndex
              ? { ...tier, backers: tier.backers + 1n }
              : tier
          ),
        };
        queryClient.setQueryData(key, optimistic);
        return () => queryClient.setQueryData(key, previous);
      },
      invalidateContribution: () => walletClient?.account?.address,
    }
  );

  const fund = (tierIndex: number, amount: bigint) =>
    mutation.mutate({ tierIndex, amount });

  return {
    fund,
    hash,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error instanceof Error ? mutation.error : undefined,
  };
}

export function useWithdrawFunds(campaignAddress?: Address) {
  const { mutation, hash } = useCampaignContractMutation(
    campaignAddress,
    "withdraw",
    "withdraw"
  );

  return {
    withdraw: () => mutation.mutate(undefined),
    hash,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error instanceof Error ? mutation.error : undefined,
  };
}

export function useRequestWithdrawal(campaignAddress?: Address) {
  const { mutation, hash } = useCampaignContractMutation(
    campaignAddress,
    "requestWithdrawal",
    "requestWithdrawal"
  );

  return {
    requestWithdrawal: () => mutation.mutate(undefined),
    hash,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error instanceof Error ? mutation.error : undefined,
  };
}

export function useRequestRefund(campaignAddress?: Address) {
  const { mutation, hash } = useCampaignContractMutation(
    campaignAddress,
    "refund",
    "refund"
  );

  return {
    refund: () => mutation.mutate(undefined),
    hash,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error instanceof Error ? mutation.error : undefined,
  };
}

export function useAddTier(campaignAddress?: Address) {
  const { mutation, hash } = useCampaignContractMutation(
    campaignAddress,
    "addTier",
    "addTier",
    {
      args: (vars: { name: string; amount: bigint }) => [
        vars.name,
        vars.amount,
      ],
      onOptimisticUpdate: (queryClient, vars) => {
        const key = campaignKeys.data(campaignAddress);
        const previous = queryClient.getQueryData<CampaignData>(key);
        if (!previous) return;
        const optimistic: CampaignData = {
          ...previous,
          tiers: [
            ...previous.tiers,
            { name: vars.name, amount: vars.amount, backers: 0n },
          ],
        };
        queryClient.setQueryData(key, optimistic);
        return () => queryClient.setQueryData(key, previous);
      },
    }
  );

  const addTier = (name: string, amount: bigint) =>
    mutation.mutate({ name, amount });

  return {
    addTier,
    hash,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error instanceof Error ? mutation.error : undefined,
  };
}

export function useRemoveTier(campaignAddress?: Address) {
  const { mutation, hash } = useCampaignContractMutation(
    campaignAddress,
    "removeTier",
    "removeTier",
    {
      args: (vars: { index: number }) => [BigInt(vars.index)],
      onOptimisticUpdate: (queryClient, vars) => {
        const key = campaignKeys.data(campaignAddress);
        const previous = queryClient.getQueryData<CampaignData>(key);
        if (!previous) return;
        const optimistic: CampaignData = {
          ...previous,
          tiers: previous.tiers.filter((_tier, index) => index !== vars.index),
        };
        queryClient.setQueryData(key, optimistic);
        return () => queryClient.setQueryData(key, previous);
      },
    }
  );

  const removeTier = (index: number) => mutation.mutate({ index });

  return {
    removeTier,
    hash,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error instanceof Error ? mutation.error : undefined,
  };
}

export function useBackerContribution(
  campaignAddress?: Address,
  backerAddress?: Address
) {
  const { publicClient } = useClients();

  const query = useQuery({
    queryKey: campaignKeys.contribution(campaignAddress, backerAddress),
    enabled: Boolean(campaignAddress && backerAddress && publicClient),
    queryFn: async () => {
      if (!campaignAddress || !backerAddress || !publicClient) {
        throw new Error("Contribution query not ready");
      }
      const contribution = await publicClient.readContract({
        address: campaignAddress,
        abi: crowdfundingAbi,
        functionName: "backers",
        args: [backerAddress],
      });

      if (
        typeof contribution === "object" &&
        contribution !== null &&
        "totalContribution" in contribution
      ) {
        return (contribution as { totalContribution: bigint })
          .totalContribution;
      }
      return contribution as bigint;
    },
    initialData: BigInt(0),
  });

  return {
    totalContribution: query.data ?? BigInt(0),
  };
}

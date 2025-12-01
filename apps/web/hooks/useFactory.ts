import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import type { Address } from "viem";
import { useChainId, usePublicClient, useWalletClient } from "wagmi";

import { factoryKeys, campaignKeys } from "@/lib/queryKeys";
import { useTransactionStore } from "@/stores/transactionStore";
import { crowdfundingFactoryAbi } from "@shungerfund/shared/contracts/abis";
import {
  getContractAddress,
  type Network,
} from "@shungerfund/shared/contracts/addresses";
import type {
  Campaign,
  PendingTransaction,
} from "@shungerfund/shared/types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

const getNetwork = (chainId: number): Network => {
  if (chainId === 31337) return "localhost";
  if (chainId === 11155111) return "sepolia";
  return "localhost";
};

const useFactoryConfig = () => {
  const chainId = useChainId();
  const network = getNetwork(chainId);
  const factoryAddress = useMemo(
    () => getContractAddress(network, "factory"),
    [network],
  );
  const isConfigured =
    factoryAddress && factoryAddress !== ZERO_ADDRESS ? factoryAddress : undefined;
  return { chainId, network, factoryAddress: isConfigured };
};

export function useCreateCampaign() {
  const { chainId, factoryAddress } = useFactoryConfig();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });
  const queryClient = useQueryClient();
  const {
    addPendingTransaction,
    removePendingTransaction,
    hasPendingTransaction,
  } = useTransactionStore();
  const [hash, setHash] = useState<`0x${string}`>();

  const mutation = useMutation({
    mutationFn: async (vars: {
      name: string;
      description: string;
      goal: bigint;
      durationInDays: number;
    }) => {
      if (!walletClient) {
        throw new Error("Connect a wallet to create a campaign.");
      }
      if (!publicClient) {
        throw new Error("Public client is not ready yet.");
      }
      if (!factoryAddress) {
        throw new Error("Factory address is not configured");
      }
    if (hasPendingTransaction("create")) {
      throw new Error("A campaign creation transaction is already pending");
    }

      const txHash = await walletClient.writeContract({
      address: factoryAddress,
      abi: crowdfundingFactoryAbi,
      functionName: "createCampaign",
        args: [
          vars.name,
          vars.description,
          vars.goal,
          BigInt(vars.durationInDays),
        ],
        chain: walletClient.chain ?? undefined,
        account: walletClient.account ?? null,
      });

      setHash(txHash);
      addPendingTransaction({
        hash: txHash,
        type: "create",
        timestamp: Date.now(),
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      return { hash: txHash, receipt };
    },
    onSuccess: () => {
      if (factoryAddress) {
        queryClient.invalidateQueries({
          queryKey: factoryKeys.root(factoryAddress),
        });
      }
    },
    onSettled: () => {
      if (hash) {
        removePendingTransaction(hash);
      }
    },
  });

  const createCampaign = (
    name: string,
    description: string,
    goal: bigint,
    durationInDays: number,
  ) => mutation.mutate({ name, description, goal, durationInDays });

  return {
    createCampaign,
    hash,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error:
      mutation.error instanceof Error
        ? mutation.error
        : mutation.error
          ? new Error(String(mutation.error))
          : undefined,
    status: mutation.status,
  };
}

export function useAllCampaigns() {
  const { chainId, factoryAddress } = useFactoryConfig();
  const publicClient = usePublicClient({ chainId });

  const query = useQuery({
    queryKey: factoryKeys.allCampaigns(factoryAddress),
    enabled: Boolean(factoryAddress && publicClient),
    queryFn: async () => {
      if (!factoryAddress || !publicClient) {
        throw new Error("Factory not ready");
      }
      const campaigns = await publicClient.readContract({
    address: factoryAddress,
    abi: crowdfundingFactoryAbi,
    functionName: "getAllCampaigns",
      });
      return campaigns as Campaign[];
    },
  });

  return {
    campaigns: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUserCampaigns(userAddress?: Address) {
  const { chainId, factoryAddress } = useFactoryConfig();
  const publicClient = usePublicClient({ chainId });

  const query = useQuery({
    queryKey: factoryKeys.userCampaigns(factoryAddress, userAddress),
    enabled: Boolean(factoryAddress && userAddress && publicClient),
    queryFn: async () => {
      if (!factoryAddress || !userAddress || !publicClient) {
        throw new Error("Factory not ready");
      }
      const campaigns = await publicClient.readContract({
    address: factoryAddress,
    abi: crowdfundingFactoryAbi,
    functionName: "getUserCampaigns",
        args: [userAddress],
      });
      return campaigns as Campaign[];
    },
  });

  return {
    campaigns: query.data ?? [],
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useFactoryHealth() {
  const { chainId, factoryAddress } = useFactoryConfig();
  const publicClient = usePublicClient({ chainId });

  const query = useQuery({
    queryKey: factoryKeys.health(factoryAddress),
    enabled: Boolean(factoryAddress && publicClient),
    queryFn: async () => {
      if (!factoryAddress || !publicClient) {
        throw new Error("Factory not ready");
      }
      const [paused, owner] = await Promise.all([
        publicClient.readContract({
    address: factoryAddress,
    abi: crowdfundingFactoryAbi,
    functionName: "paused",
        }),
        publicClient.readContract({
    address: factoryAddress,
    abi: crowdfundingFactoryAbi,
    functionName: "owner",
        }),
      ]);
      return {
        paused: Boolean(paused),
        owner: owner as Address,
      };
    },
  });

  return {
    paused: query.data?.paused ?? false,
    owner: query.data?.owner,
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCampaignGovernance(campaignAddress?: Address) {
  const { chainId, factoryAddress } = useFactoryConfig();
  const publicClient = usePublicClient({ chainId });

  const query = useQuery({
    queryKey: factoryKeys.governance(factoryAddress, campaignAddress),
    enabled: Boolean(factoryAddress && campaignAddress && publicClient),
    queryFn: async () => {
      if (!factoryAddress || !campaignAddress || !publicClient) {
        throw new Error("Factory not ready");
      }
      const governance = (await publicClient.readContract({
    address: factoryAddress,
    abi: crowdfundingFactoryAbi,
    functionName: "getCampaignGovernance",
        args: [campaignAddress],
      })) as [boolean, boolean, bigint];
      return governance;
    },
  });

  const governance = query.data ?? [false, false, BigInt(0)];

  return {
    factoryPaused: governance[0],
    factoryUnderReview: governance[1],
    lastWithdrawalApproval: governance[2],
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}

type AdminAction =
  | { action: "pause"; value: boolean }
  | { action: "underReview"; value: boolean }
  | { action: "approve" };

export function useFactoryAdminActions(campaignAddress?: Address) {
  const { chainId, factoryAddress } = useFactoryConfig();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });
  const queryClient = useQueryClient();

  const {
    addPendingTransaction,
    removePendingTransaction,
    hasPendingTransaction,
  } = useTransactionStore();

  const hashRef = useRef<`0x${string}` | undefined>(undefined);

  const mutation = useMutation({
    mutationFn: async (vars: AdminAction) => {
      if (!campaignAddress) {
        throw new Error("Campaign address is required");
      }
      if (!factoryAddress) {
        throw new Error("Factory address is not configured");
      }
      if (!walletClient || !publicClient) {
        throw new Error("Connect a wallet to continue");
      }

      let currentType: PendingTransaction["type"];
      if (vars.action === "pause") {
        currentType = vars.value ? "factoryPause" : "factoryResume";
      } else if (vars.action === "underReview") {
        currentType = "factoryReview";
      } else {
        currentType = "factoryApprove";
      }

      if (hasPendingTransaction(currentType, campaignAddress)) {
        throw new Error("Another admin action is already pending");
      }

      let functionName: "setCampaignPause" | "setCampaignUnderReview" | "approveCampaignWithdrawal";
      let args: readonly unknown[] = [];

      if (vars.action === "pause") {
        functionName = "setCampaignPause";
        args = [campaignAddress, vars.value];
      } else if (vars.action === "underReview") {
        functionName = "setCampaignUnderReview";
        args = [campaignAddress, vars.value];
      } else {
        functionName = "approveCampaignWithdrawal";
        args = [campaignAddress];
      }

      const txHash = await walletClient.writeContract({
        address: factoryAddress,
        abi: crowdfundingFactoryAbi,
        functionName,
        args,
        chain: walletClient.chain ?? undefined,
        account: walletClient.account ?? null,
      });

      hashRef.current = txHash;
      addPendingTransaction({
        hash: txHash,
        type: currentType,
        campaignAddress,
        timestamp: Date.now(),
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      return { hash: txHash, action: vars.action, receipt };
    },
    onMutate: async (vars) => {
      if (!factoryAddress || !campaignAddress) {
        return;
      }
      const key = factoryKeys.governance(factoryAddress, campaignAddress);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<[boolean, boolean, bigint]>(key);
      if (!previous) return { previous };

      let next: [boolean, boolean, bigint] = [...previous];
      if (vars.action === "pause") {
        next = [vars.value, previous[1], previous[2]];
      } else if (vars.action === "underReview") {
        next = [previous[0], vars.value, previous[2]];
      } else {
        next = [...previous] as [boolean, boolean, bigint];
      }
      queryClient.setQueryData(key, next);
      queryClient.invalidateQueries({ queryKey: campaignKeys.data(campaignAddress) });
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (!context?.previous || !factoryAddress || !campaignAddress) return;
      queryClient.setQueryData(
        factoryKeys.governance(factoryAddress, campaignAddress),
        context.previous,
      );
    },
    onSuccess: () => {
      if (!factoryAddress || !campaignAddress) return;
      queryClient.invalidateQueries({
        queryKey: factoryKeys.governance(factoryAddress, campaignAddress),
      });
      queryClient.invalidateQueries({
        queryKey: campaignKeys.data(campaignAddress),
      });
    },
    onSettled: () => {
      if (hashRef.current) {
        removePendingTransaction(hashRef.current);
        hashRef.current = undefined;
      }
    },
  });

  const setPaused = (shouldPause: boolean) => {
    if (!campaignAddress) {
      throw new Error("Campaign address is required");
    }
    mutation.mutate({ action: "pause", value: shouldPause });
  };

  const setUnderReview = (underReview: boolean) => {
    if (!campaignAddress) {
      throw new Error("Campaign address is required");
    }
    mutation.mutate({ action: "underReview", value: underReview });
  };

  const approveWithdrawal = () => {
    if (!campaignAddress) {
      throw new Error("Campaign address is required");
    }
    mutation.mutate({ action: "approve" });
  };

  return {
    setPaused,
    setUnderReview,
    approveWithdrawal,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error:
      mutation.error instanceof Error
        ? mutation.error
        : mutation.error
          ? new Error(String(mutation.error))
          : undefined,
  };
}

import { useEffect, useMemo, useState } from "react";
import { Address } from "viem";
import { usePublicClient } from "wagmi";

import { Campaign, CampaignState } from "@shungerfund/shared/types";
import { crowdfundingAbi } from "@shungerfund/shared/contracts/abis";

type StatusBreakdown = {
  active: number;
  successful: number;
  failed: number;
};

export type OpsAttentionItem = {
  campaignAddress: Address;
  name: string;
  reason: "Paused" | "Under Review";
};

type OpsMetrics = {
  totalValueLocked: bigint;
  status: StatusBreakdown;
  pausedCount: number;
  underReviewCount: number;
  attention: OpsAttentionItem[];
};

const INITIAL_METRICS: OpsMetrics = {
  totalValueLocked: 0n,
  status: {
    active: 0,
    successful: 0,
    failed: 0,
  },
  pausedCount: 0,
  underReviewCount: 0,
  attention: [],
};

export function useOpsMetrics(campaigns: Campaign[]) {
  const publicClient = usePublicClient();
  const [metrics, setMetrics] = useState<OpsMetrics>(INITIAL_METRICS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!publicClient) {
      return;
    }

    if (!campaigns.length) {
      setMetrics(INITIAL_METRICS);
      setError(null);
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const snapshots = await Promise.allSettled(
          campaigns.map(async (campaign) => {
            const address = campaign.campaignAddress as Address;
            try {
              const [status, paused, underReview] = await publicClient
                .multicall({
                  contracts: [
                    {
                      address,
                      abi: crowdfundingAbi,
                      functionName: "getCampaignStatus",
                    },
                    {
                      address,
                      abi: crowdfundingAbi,
                      functionName: "paused",
                    },
                    {
                      address,
                      abi: crowdfundingAbi,
                      functionName: "underReview",
                    },
                  ],
                  allowFailure: true,
                })
                .then((result) => {
                  // Handle partial failures
                  if (
                    result[0].status === "failure" ||
                    result[1].status === "failure" ||
                    result[2].status === "failure"
                  ) {
                    throw new Error(
                      `Failed to read campaign data for ${address}`
                    );
                  }
                  // getCampaignStatus returns uint8 (enum), which viem represents as bigint
                  const statusValue = result[0].result;
                  const statusNumber =
                    typeof statusValue === "bigint"
                      ? Number(statusValue)
                      : (statusValue as unknown as number);
                  return [
                    statusNumber as CampaignState,
                    Boolean(result[1].result),
                    Boolean(result[2].result),
                  ] as [CampaignState, boolean, boolean];
                });

              const balance = await publicClient
                .getBalance({
                  address,
                })
                .catch(() => 0n); // Fallback to 0 if balance check fails

              return {
                address,
                name: campaign.name,
                status,
                paused,
                underReview,
                balance,
              };
            } catch (err) {
              // Return null for failed campaigns so we can still process successful ones
              console.warn(
                `Failed to load metrics for campaign ${address}:`,
                err
              );
              return null;
            }
          })
        );

        if (cancelled) return;

        type CampaignSnapshot = {
          address: Address;
          name: string;
          status: CampaignState;
          paused: boolean;
          underReview: boolean;
          balance: bigint;
        };

        const successfulSnapshots: CampaignSnapshot[] = snapshots
          .filter(
            (result): result is PromiseFulfilledResult<CampaignSnapshot> =>
              result.status === "fulfilled" && result.value !== null
          )
          .map((result) => result.value);

        const failedCount = snapshots.length - successfulSnapshots.length;

        const nextMetrics = successfulSnapshots.reduce<OpsMetrics>(
          (acc, snapshot) => {
            switch (snapshot.status) {
              case CampaignState.Active:
                acc.status.active += 1;
                break;
              case CampaignState.Successful:
                acc.status.successful += 1;
                break;
              default:
                acc.status.failed += 1;
            }

            acc.totalValueLocked += snapshot.balance;

            if (snapshot.paused) {
              acc.pausedCount += 1;
              acc.attention.push({
                campaignAddress: snapshot.address,
                name: snapshot.name,
                reason: "Paused",
              });
            }

            if (snapshot.underReview) {
              acc.underReviewCount += 1;
              acc.attention.push({
                campaignAddress: snapshot.address,
                name: snapshot.name,
                reason: "Under Review",
              });
            }

            return acc;
          },
          {
            totalValueLocked: 0n,
            status: { ...INITIAL_METRICS.status },
            pausedCount: 0,
            underReviewCount: 0,
            attention: [],
          }
        );

        setMetrics(nextMetrics);

        // Only set error if all campaigns failed or if there's a critical RPC issue
        if (failedCount === campaigns.length && campaigns.length > 0) {
          setError(
            new Error(
              "Unable to load metrics for any campaigns. Check RPC connection and contract deployment."
            )
          );
        } else if (failedCount > 0) {
          // Partial failure - don't set error, just log it
          console.warn(
            `${failedCount} of ${campaigns.length} campaigns failed to load metrics`
          );
        }
      } catch (err) {
        if (!cancelled) {
          const error = err as Error;
          // Provide more specific error messages
          if (
            error.message?.includes("network") ||
            error.message?.includes("connection")
          ) {
            setError(
              new Error(
                "RPC connection failed. Ensure Hardhat node is running or check your network connection."
              )
            );
          } else if (error.message?.includes("not a contract")) {
            setError(
              new Error(
                "Some campaigns may not be deployed. Try redeploying contracts with 'pnpm run deploy:local'."
              )
            );
          } else {
            setError(error);
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [campaigns, publicClient]);

  return useMemo(
    () => ({
      metrics,
      isLoading,
      error,
    }),
    [metrics, isLoading, error]
  );
}

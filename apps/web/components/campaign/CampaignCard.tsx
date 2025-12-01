"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Campaign, CampaignState } from "@shungerfund/shared/types";
import { formatEther } from "viem";
import Link from "next/link";
import { useCampaignData } from "@/hooks/useCampaign";
import { useCampaignGovernance } from "@/hooks/useFactory";
import { formatDistanceToNow } from "date-fns";

interface CampaignCardProps {
  campaign: Campaign;
  userContribution?: bigint;
}

const stateLabels: Record<CampaignState, string> = {
  [CampaignState.Active]: "Active",
  [CampaignState.Successful]: "Successful",
  [CampaignState.Failed]: "Failed",
};

const stateColors: Record<CampaignState, string> = {
  [CampaignState.Active]: "bg-green-500",
  [CampaignState.Successful]: "bg-blue-500",
  [CampaignState.Failed]: "bg-red-500",
};

export function CampaignCard({
  campaign,
  userContribution,
}: CampaignCardProps) {
  const { data: campaignData, isLoading } = useCampaignData(
    campaign.campaignAddress
  );
  const {
    factoryPaused,
    factoryUnderReview,
    isLoading: isGovernanceLoading,
  } = useCampaignGovernance(campaign.campaignAddress);

  if (isLoading || isGovernanceLoading || !campaignData) {
    return (
      <Card>
        <CardHeader>
          <div className="h-4 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const progress =
    campaignData.goal > BigInt(0)
      ? Number((campaignData.balance * BigInt(100)) / campaignData.goal)
      : 0;
  const isExpired = new Date(Number(campaignData.deadline) * 1000) < new Date();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl truncate" title={campaignData.name}>
              {campaignData.name}
            </CardTitle>
            <CardDescription className="mt-2 line-clamp-1 break-all">
              {campaignData.description}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge
              className={`${stateColors[campaignData.state]} text-white shrink-0`}
            >
              {stateLabels[campaignData.state]}
            </Badge>
            {factoryPaused && (
              <Badge variant="secondary" className="shrink-0">
                Paused
              </Badge>
            )}
            {factoryUnderReview && (
              <Badge variant="destructive" className="shrink-0">
                Under Review
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">
                {formatEther(campaignData.balance)} /{" "}
                {formatEther(campaignData.goal)} ETH
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          {userContribution !== undefined && userContribution > BigInt(0) && (
            <div className="col-span-2 mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-primary truncate">
                Your Contribution
              </span>
              <span className="text-lg font-bold text-primary truncate">
                {formatEther(userContribution)} ETH
              </span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 text-sm text-center">
            <div className="truncate">
              <span className="text-muted-foreground block">Goal</span>
              <span
                className="font-semibold truncate block"
                title={`${formatEther(campaignData.goal)} ETH`}
              >
                {formatEther(campaignData.goal)} ETH
              </span>
            </div>
            <div className="truncate">
              <span className="text-muted-foreground block">Deadline</span>
              <span
                className="font-semibold truncate block"
                title={
                  isExpired
                    ? "Expired"
                    : formatDistanceToNow(
                        new Date(Number(campaignData.deadline) * 1000),
                        { addSuffix: true }
                      )
                }
              >
                {isExpired
                  ? "Expired"
                  : formatDistanceToNow(
                      new Date(Number(campaignData.deadline) * 1000),
                      { addSuffix: true }
                    )}
              </span>
            </div>
            <div className="truncate">
              <span className="text-muted-foreground block">Tiers</span>
              <span className="font-semibold truncate block">
                {campaignData.tiers.length}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link
          href={`/campaigns/${campaign.campaignAddress}`}
          className="w-full"
        >
          <Button className="w-full">View Campaign</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

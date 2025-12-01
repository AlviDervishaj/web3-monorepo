'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CampaignData } from '@shungerfund/shared/types';
import { formatEther } from 'viem';
import { formatDistanceToNow } from 'date-fns';

interface CampaignStatsProps {
  data: CampaignData;
}

export function CampaignStats({ data }: CampaignStatsProps) {
  const progress = data.goal > BigInt(0)
    ? Number((data.balance * BigInt(100)) / data.goal)
    : 0;
  const isExpired = new Date(Number(data.deadline) * 1000) < new Date();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Raised</span>
            <span className="font-semibold text-lg">
              {formatEther(data.balance)} ETH
            </span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Goal</span>
            <span className="font-semibold">
              {formatEther(data.goal)} ETH
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {progress.toFixed(2)}% of goal reached
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Deadline</p>
            <p className="font-semibold">
              {isExpired ? 'Expired' : formatDistanceToNow(new Date(Number(data.deadline) * 1000), { addSuffix: true })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tiers</p>
            <p className="font-semibold">{data.tiers.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Paused</p>
            <p className="font-semibold">{data.paused ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Under Review</p>
            <p className="font-semibold">{data.underReview ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tier } from '@shungerfund/shared/types';
import { formatEther } from 'viem';
import { Badge } from '@/components/ui/badge';

interface TierSelectorProps {
  tiers: Tier[];
  selectedTier: number | null;
  onSelectTier: (index: number) => void;
  disabled?: boolean;
}

export function TierSelector({ tiers, selectedTier, onSelectTier, disabled }: TierSelectorProps) {
  if (tiers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No tiers available for this campaign
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select a Tier</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiers.map((tier, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all ${
              selectedTier === index
                ? 'ring-2 ring-primary'
                : 'hover:shadow-md'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onSelectTier(index)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <Badge variant="secondary">{Number(tier.backers)} backers</Badge>
              </div>
              <CardDescription className="text-2xl font-bold text-primary mt-2">
                {formatEther(tier.amount)} ETH
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}


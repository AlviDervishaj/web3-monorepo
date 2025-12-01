'use client';

import { Layout } from '@/components/layout/Layout';
import { useAllCampaigns } from '@/hooks/useFactory';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useBackerContribution } from '@/hooks/useCampaign';
import { Campaign } from '@shungerfund/shared/types';
import { CampaignCard } from '@/components/campaign/CampaignCard';

export default function MyContributionsPage() {
  const { address } = useAccount();
  const { campaigns, isLoading } = useAllCampaigns();

  if (!address) {
    return (
      <Layout>
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to view your contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  // Placeholder filter – replace with contribution-aware logic when backend exposes it
  const contributedCampaigns = campaigns.filter((campaign) =>
    Boolean(campaign.campaignAddress)
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Contributions</h1>
          <p className="text-muted-foreground">
            Campaigns you&apos;ve contributed to
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : contributedCampaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">No contributions yet</p>
              <p className="text-muted-foreground text-sm mt-2">
                Start supporting campaigns to see them here
              </p>
              <Link href="/">
                <Button className="mt-4">Browse Campaigns</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contributedCampaigns.map((campaign) => (
              <ContributionCard key={campaign.campaignAddress} campaign={campaign} userAddress={address} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function ContributionCard({ campaign, userAddress }: { campaign: Campaign; userAddress: string }) {
  const { totalContribution } = useBackerContribution(campaign.campaignAddress, userAddress as `0x${string}`);

  if (totalContribution === BigInt(0)) {
    return null;
  }

  return (
    <CampaignCard 
      campaign={campaign} 
      userContribution={totalContribution}
    />
  );
}


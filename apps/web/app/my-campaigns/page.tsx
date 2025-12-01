'use client';

import { Layout } from '@/components/layout/Layout';
import { CampaignList } from '@/components/campaign/CampaignList';
import { useUserCampaigns } from '@/hooks/useFactory';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MyCampaignsPage() {
  const { address } = useAccount();
  const { campaigns, isLoading } = useUserCampaigns(address);

  if (!address) {
    return (
      <Layout>
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to view your campaigns
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

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Campaigns</h1>
            <p className="text-muted-foreground">
              Manage your crowdfunding campaigns
            </p>
          </div>
          <Link href="/create">
            <Button>Create New Campaign</Button>
          </Link>
        </div>

        <CampaignList campaigns={campaigns} isLoading={isLoading} />
      </div>
    </Layout>
  );
}


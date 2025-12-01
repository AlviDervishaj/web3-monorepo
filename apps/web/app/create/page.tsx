'use client';

import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateCampaignForm } from '@/components/form/CreateCampaignForm';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CreateCampaignPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <Layout>
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to create a campaign
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Campaign</h1>
          <p className="text-muted-foreground">
            Start a new crowdfunding campaign on the blockchain
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>
              Fill in the details for your campaign. You can add tiers after creation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateCampaignForm />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}


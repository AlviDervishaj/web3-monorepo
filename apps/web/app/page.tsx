"use client";

import { Layout } from "@/components/layout/Layout";
import { CampaignList } from "@/components/campaign/CampaignList";
import { useAllCampaigns } from "@/hooks/useFactory";
import { TransactionStatus } from "@/components/transaction/TransactionStatus";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useChainId } from "wagmi";

export default function HomePage() {
  const { campaigns, isLoading, error } = useAllCampaigns();
  const chainId = useChainId();
  const isLocalhost = chainId === 31337;

  // Check if error suggests contract not deployed
  const contractNotDeployed =
    Boolean(error) &&
    (error?.message?.includes("not a contract") ||
      error?.message?.includes("execution reverted"));
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Discover Campaigns</h1>
          <p className="text-muted-foreground">
            Support projects and causes you believe in on the blockchain
          </p>
        </div>

        {contractNotDeployed && isLocalhost && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-5 w-5" />
                Contracts Not Deployed
              </CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                The contracts need to be deployed to the local Hardhat network.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <CampaignList campaigns={campaigns} isLoading={isLoading} />
      </div>
      <TransactionStatus />
    </Layout>
  );
}

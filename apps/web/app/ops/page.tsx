"use client";

import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import { useAllCampaigns, useFactoryHealth } from "@/hooks/useFactory";
import { useOpsMetrics } from "@/hooks/useOpsMetrics";
import { isAdmin } from "@shungerfund/shared/admin";
import { OpsStatCard } from "@/components/ops/OpsStatCard";
import { OpsRecentActivity } from "@/components/ops/OpsRecentActivity";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { formatEther } from "viem";

const NETWORK_LABELS: Record<number, string> = {
  31337: "Localhost (Hardhat)",
  11155111: "Sepolia",
};

export default function OpsPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { campaigns, isLoading } = useAllCampaigns();
  const {
    metrics,
    isLoading: isMetricsLoading,
    error: metricsError,
  } = useOpsMetrics(campaigns);
  const { paused, owner, isLoading: isFactoryLoading } = useFactoryHealth();

  if (!isConnected) {
    return (
      <Layout>
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You need to connect an admin wallet to view operations data.</p>
            <Link href="/">
              <Button>Connect Wallet on Home</Button>
            </Link>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  if (!isAdmin(address)) {
    return (
      <Layout>
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This dashboard is restricted to administrator wallets. Contact the
              operations team if you believe this is a mistake.
            </p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const totalCampaigns = campaigns.length;
  const uniqueOwners = new Set(
    campaigns.map((campaign) => campaign.owner.toLowerCase())
  ).size;
  const tvlDisplay = isMetricsLoading
    ? "—"
    : `${Number(formatEther(metrics.totalValueLocked)).toFixed(2)} ETH`;

  const latestCampaign = campaigns.reduce<bigint | null>((latest, campaign) => {
    if (!latest || campaign.creationTime > latest) {
      return campaign.creationTime;
    }
    return latest;
  }, null);

  const networkLabel = NETWORK_LABELS[chainId] ?? `Chain ID ${chainId}`;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Operations Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor platform health, campaign inventory, and pending operations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <OpsStatCard
            title="Total Campaigns"
            value={isLoading ? "—" : totalCampaigns}
            description="Factory inventory"
          />
          <OpsStatCard
            title="Unique Creators"
            value={isLoading ? "—" : uniqueOwners}
            description="Distinct wallet owners"
          />
          <OpsStatCard
            title="Factory Status"
            value={
              isFactoryLoading ? "Checking…" : paused ? "Paused" : "Active"
            }
            description={owner ? `Admin: ${owner}` : undefined}
          />
          <OpsStatCard
            title="Network"
            value={networkLabel}
            description="Current chain for wagmi config"
          />
          <OpsStatCard
            title="Total Value Locked"
            value={tvlDisplay}
            description="Across all campaigns"
          />
        </div>

        {metricsError ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/5 dark:bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-semibold mb-2">
              Failed to load campaign metrics
            </p>
            <p className="text-destructive/80 dark:text-destructive/90 mb-2">
              {metricsError.message || "Unable to connect to the RPC node."}
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <OpsStatCard
                  title="Active"
                  value={isMetricsLoading ? "—" : metrics.status.active}
                  description="Currently fundraising"
                />
                <OpsStatCard
                  title="Successful"
                  value={isMetricsLoading ? "—" : metrics.status.successful}
                  description="Goal reached"
                />
                <OpsStatCard
                  title="Failed"
                  value={isMetricsLoading ? "—" : metrics.status.failed}
                  description="Eligible for refunds"
                />
                <OpsStatCard
                  title="Paused / Under Review"
                  value={
                    isMetricsLoading
                      ? "—"
                      : `${metrics.pausedCount} / ${metrics.underReviewCount}`
                  }
                  description="Governance interventions"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Totals automatically refresh as new campaigns are deployed or
                their state changes on-chain.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaigns Requiring Attention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.attention.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  All campaigns are healthy. You&apos;ll see entries here when a
                  campaign is paused or under review.
                </p>
              ) : (
                metrics.attention.slice(0, 6).map((item) => (
                  <div
                    key={`${item.campaignAddress}-${item.reason}`}
                    className="rounded-lg border p-3"
                  >
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.reason} • {item.campaignAddress.slice(0, 10)}…
                    </p>
                  </div>
                ))
              )}
              {metrics.attention.length > 6 ? (
                <p className="text-xs text-muted-foreground">
                  {metrics.attention.length - 6} additional campaigns omitted.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No campaigns deployed yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.slice(0, 8).map((campaign) => (
                    <TableRow key={campaign.campaignAddress}>
                      <TableCell>
                        {campaign.name || "Untitled Campaign"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {campaign.owner.slice(0, 10)}…
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(
                          new Date(Number(campaign.creationTime) * 1000),
                          { addSuffix: true }
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {campaign.campaignAddress.slice(0, 10)}…
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {campaigns.length > 8 ? (
              <p className="text-xs text-muted-foreground">
                Showing the 8 most recent campaigns.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <OpsRecentActivity />

        <Card>
          <CardHeader>
            <CardTitle>Latest Campaign Creation</CardTitle>
          </CardHeader>
          <CardContent>
            {latestCampaign ? (
              <p className="text-sm text-muted-foreground">
                Last campaign deployed{" "}
                {formatDistanceToNow(new Date(Number(latestCampaign) * 1000), {
                  addSuffix: true,
                })}
                .
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No campaigns have been deployed yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

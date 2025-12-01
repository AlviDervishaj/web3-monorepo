"use client";

import { useMemo } from "react";
import { useTransactionStore } from "@/stores/transactionStore";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const typeLabels: Record<string, string> = {
  create: "Campaign Created",
  fund: "Funding",
  withdraw: "Withdrawal",
  requestWithdrawal: "Withdrawal Requested",
  refund: "Refund",
  addTier: "Tier Added",
  removeTier: "Tier Removed",
  factoryPause: "Factory Pause",
  factoryResume: "Factory Resume",
  factoryReview: "Factory Review",
  factoryApprove: "Factory Approval",
};

export function OpsRecentActivity() {
  const pendingTransactions = useTransactionStore(
    (state) => state.pendingTransactions
  );

  const items = useMemo(() => {
    return Array.from(pendingTransactions.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }, [pendingTransactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Pending Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending transactions. Everything looks good!
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.hash}
              className="rounded-lg border p-3 text-sm leading-relaxed"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{typeLabels[item.type]}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                </span>
              </div>
              <p className="mt-2 font-mono text-xs break-all">{item.hash}</p>
              {item.campaignAddress ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Campaign: {item.campaignAddress}
                </p>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}


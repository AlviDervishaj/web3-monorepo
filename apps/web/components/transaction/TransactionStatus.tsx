'use client';

import { useTransactionStore } from '@/stores/transactionStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useWaitForTransactionReceipt } from 'wagmi';

export function TransactionStatus() {
  const { pendingTransactions } = useTransactionStore();
  const transactions = Array.from(pendingTransactions.values());

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-md">
      {transactions.map((tx) => (
        <TransactionItem key={tx.hash} hash={tx.hash} type={tx.type} />
      ))}
    </div>
  );
}

function TransactionItem({ hash, type }: { hash: `0x${string}`; type: string }) {
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm capitalize">{type} Transaction</CardTitle>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSuccess && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {isError && <XCircle className="h-4 w-4 text-red-500" />}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="font-mono text-xs break-all">
          {hash}
        </CardDescription>
        <Badge variant={isSuccess ? 'default' : isError ? 'destructive' : 'secondary'} className="mt-2">
          {isLoading ? 'Pending' : isSuccess ? 'Confirmed' : isError ? 'Failed' : 'Unknown'}
        </Badge>
      </CardContent>
    </Card>
  );
}


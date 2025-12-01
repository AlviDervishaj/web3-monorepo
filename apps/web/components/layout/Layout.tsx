'use client';

import { Header } from './Header';
import { Footer } from './Footer';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Layout({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const isOnRealNetwork = isConnected && chainId !== 31337;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {isOnRealNetwork && (
        <div className="border-b border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <span>
                ⚠️ You&apos;re on a real network! Transactions will cost real money. Switch to <strong>Localhost (31337)</strong> for free testing.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => switchChain({ chainId: 31337 })}
              className="ml-4"
            >
              Switch to Localhost
            </Button>
          </div>
        </div>
      )}
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}


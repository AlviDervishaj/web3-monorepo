'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Wallet, LogOut, Network } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect } from 'react';

import { ThemeToggle } from './ThemeToggle';
import { isAdmin } from '@shungerfund/shared/admin';

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const userIsAdmin = isAdmin(address);

  const handleConnect = async () => {
    if (connectors[0] && !isConnecting) {
      try {
        // Connect to mock wallet
        await connect({ connector: connectors[0] });
        
        // After connection, ensure we're on localhost
        if (chainId !== 31337) {
          try {
            await switchChain({ chainId: 31337 });
          } catch (switchError) {
            console.error('Switch chain error:', switchError);
          }
        }
      } catch (error) {
        console.error('Connection error:', error);
      }
    }
  };

  // Automatically switch to localhost when connected
  useEffect(() => {
    if (isConnected && chainId !== 31337) {
      const switchToLocalhost = async () => {
        try {
          await switchChain({ chainId: 31337 });
        } catch (error) {
          console.error('Failed to switch to localhost:', error);
        }
      };
      switchToLocalhost();
    }
  }, [isConnected, chainId, switchChain]);

  const handleNetworkChange = (value: string) => {
    const targetChainId = parseInt(value);
    if (targetChainId !== chainId) {
      switchChain({ chainId: targetChainId });
    }
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          Web3 GoFundMe
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium hover:underline">
            Campaigns
          </Link>
          {isConnected && (
            <>
              <Link href="/create" className="text-sm font-medium hover:underline">
                Create
              </Link>
              <Link href="/my-campaigns" className="text-sm font-medium hover:underline">
                My Campaigns
              </Link>
              <Link href="/my-contributions" className="text-sm font-medium hover:underline">
                My Contributions
              </Link>
              {userIsAdmin && (
                <Link href="/ops" className="text-sm font-medium hover:underline">
                  Ops
                </Link>
              )}
            </>
          )}

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Select value={chainId.toString()} onValueChange={handleNetworkChange}>
              <SelectTrigger className="w-[140px]">
                <Network className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="31337">Localhost</SelectItem>
                <SelectItem value="11155111">Sepolia</SelectItem>
              </SelectContent>
            </Select>

            {isConnected ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <Button variant="outline" size="sm" onClick={() => disconnect()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button onClick={handleConnect} disabled={isConnecting}>
                <Wallet className="h-4 w-4 mr-2" />
                {isConnecting ? 'Connect Wallet' : 'Connect Mock Wallet'}
              </Button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}


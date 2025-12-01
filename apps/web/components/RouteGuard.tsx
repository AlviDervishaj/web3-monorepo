'use client';

import { useAccount } from 'wagmi';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * RouteGuard component that protects routes requiring wallet connection.
 * Only allows access to "/" without a wallet connection.
 * All other routes require a connected wallet.
 */
export function RouteGuard({ children }: RouteGuardProps) {
  const { isConnected } = useAccount();
  const pathname = usePathname();
  const router = useRouter();

  // Routes that don't require wallet connection
  const publicRoutes = ['/'];

  const isPublicRoute = publicRoutes.includes(pathname);
  const requiresAuth = !isPublicRoute;

  useEffect(() => {
    // If route requires auth and wallet is not connected, redirect to home after a delay
    // This gives users time to see the message and prevents jarring redirects
    if (requiresAuth && !isConnected) {
      const redirectTimer = setTimeout(() => {
        router.push('/');
      }, 3000); // 3 second delay

      return () => clearTimeout(redirectTimer);
    }
  }, [requiresAuth, isConnected, router]);

  // If route requires auth but wallet is not connected, show connect prompt
  if (requiresAuth && !isConnected) {
    return (
      <Layout>
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Wallet Connection Required</CardTitle>
            <CardDescription>
              You need to connect your wallet to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please connect your wallet to continue.
            </p>
            <Link href="/">
              <Button className="w-full">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  // Allow access to public routes or authenticated users - return children as-is
  return <>{children}</>;
}


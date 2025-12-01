'use client';

import { useParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignStats } from '@/components/campaign/CampaignStats';
import { FundingForm } from '@/components/form/FundingForm';
import { AddTierForm } from '@/components/form/AddTierForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCampaignData, useWithdrawFunds, useRequestRefund, useBackerContribution, useRequestWithdrawal } from '@/hooks/useCampaign';
import { useCampaignGovernance, useFactoryAdminActions } from '@/hooks/useFactory';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import { CampaignState, stateLabels } from '@shungerfund/shared/types';
import { formatEther } from 'viem';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { isAdmin } from '@shungerfund/shared/admin';
import { formatDistanceToNow } from 'date-fns';
import { RouteGuard } from '@/components/RouteGuard';

const stateColors: Record<CampaignState, string> = {
  [CampaignState.Active]: 'bg-green-500',
  [CampaignState.Successful]: 'bg-blue-500',
  [CampaignState.Failed]: 'bg-red-500',
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function CampaignPage() {
  const params = useParams();
  const address = params.address as string;
  const campaignAddress = address as Address;
  const { address: userAddress } = useAccount();
  const { data: campaignData, isLoading, refetch } = useCampaignData(campaignAddress);
  const { withdraw, isPending: isWithdrawing } = useWithdrawFunds(campaignAddress);
  const { requestWithdrawal, isPending: isRequestingWithdrawal } = useRequestWithdrawal(campaignAddress);
  const { refund, isPending: isRefunding } = useRequestRefund(campaignAddress);
  const { totalContribution } = useBackerContribution(campaignAddress, userAddress);
  const {
    factoryPaused,
    factoryUnderReview,
    lastWithdrawalApproval,
    isLoading: governanceLoading,
    refetch: refetchGovernance,
  } = useCampaignGovernance(campaignAddress);
  const {
    setPaused: adminSetPaused,
    setUnderReview: adminSetUnderReview,
    approveWithdrawal: adminApproveWithdrawal,
    isPending: isAdminActionPending,
    isSuccess: isAdminActionSuccess,
    error: adminActionError,
  } = useFactoryAdminActions(campaignAddress);
  const [isAddTierOpen, setIsAddTierOpen] = useState(false);
  const [lastAdminAction, setLastAdminAction] = useState<string | null>(null);

  useEffect(() => {
    if (adminActionError) {
      toast.error(adminActionError.message || 'Admin transaction failed');
    }
  }, [adminActionError]);

  // Refetch data when admin action succeeds
  useEffect(() => {
    if (isAdminActionSuccess && lastAdminAction) {
      Promise.all([refetch(), refetchGovernance()]).then(() => {
        setLastAdminAction(null);
      });
    }
  }, [isAdminActionSuccess, lastAdminAction, refetch, refetchGovernance]);

  const isOwner = userAddress && campaignData?.owner === userAddress;
  const isAdminUser = userAddress ? isAdmin(userAddress) : false;
  const canWithdraw = isOwner && campaignData?.state === CampaignState.Successful;
  const canRefund = !isOwner && campaignData?.state === CampaignState.Failed && totalContribution > BigInt(0);

  const handleWithdraw = async () => {
    try {
      await withdraw();
      toast.success('Withdrawal transaction submitted!');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to withdraw funds'));
    }
  };

  const handleRefund = async () => {
    try {
      await refund();
      toast.success('Refund transaction submitted!');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to request refund'));
    }
  };

  const handleRequestWithdrawal = async () => {
    try {
      await requestWithdrawal();
      toast.success('Withdrawal request submitted!');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to request withdrawal'));
    }
  };

  const handleAdminPause = (nextState: boolean) => {
    try {
      adminSetPaused(nextState);
      setLastAdminAction('pause');
      toast.success(nextState ? 'Campaign paused via factory' : 'Campaign resumed');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update pause state'));
    }
  };

  const handleAdminReview = (nextState: boolean) => {
    try {
      adminSetUnderReview(nextState);
      setLastAdminAction('review');
      toast.success(nextState ? 'Campaign marked under review' : 'Review cleared');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update review status'));
    }
  };

  const handleAdminApprove = () => {
    try {
      adminApproveWithdrawal();
      setLastAdminAction('approve');
      toast.success('Withdrawal approved');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to approve withdrawal'));
    }
  };

  if (isLoading || !campaignData) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="h-96 bg-muted rounded-lg animate-pulse" />
        </div>
      </Layout>
    );
  }

  const fundingDisabled = campaignData.paused || campaignData.underReview;
  const hasWithdrawalRequest = campaignData.withdrawalRequestTime > BigInt(0);
  const withdrawalReadyAtSeconds = hasWithdrawalRequest
    ? Number(
        campaignData.withdrawalRequestTime + campaignData.withdrawalDelay
      )
    : null;
  const withdrawalReady =
    !!hasWithdrawalRequest &&
    !!campaignData.withdrawalApproved &&
    withdrawalReadyAtSeconds !== null &&
    Date.now() >= withdrawalReadyAtSeconds * 1000;
  const canExecuteWithdrawal = Boolean(canWithdraw && withdrawalReady);
  const canRequestWithdrawal = Boolean(canWithdraw && !hasWithdrawalRequest);
  const requestDate = hasWithdrawalRequest
    ? new Date(Number(campaignData.withdrawalRequestTime) * 1000)
    : null;
  const readyDate =
    withdrawalReadyAtSeconds !== null
      ? new Date(withdrawalReadyAtSeconds * 1000)
      : null;
  const lastApprovalDate =
    lastWithdrawalApproval && lastWithdrawalApproval > 0
      ? new Date(Number(lastWithdrawalApproval) * 1000)
      : null;
  const withdrawalStatusText = !canWithdraw
      ? ''
      : hasWithdrawalRequest
        ? `Requested ${
            requestDate ? formatDistanceToNow(requestDate, { addSuffix: true }) : ''
          }. ${
            campaignData.withdrawalApproved
              ? 'Approved by operations.'
              : 'Awaiting operations approval.'
          } ${
            !withdrawalReady && readyDate
              ? `Available ${formatDistanceToNow(readyDate, {
                  addSuffix: true,
                })}.`
              : ''
          }`
        : 'No withdrawal requested yet.';

  return (
    <RouteGuard>
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-4xl font-bold">{campaignData.name}</h1>
              <Badge
                className={`${stateColors[campaignData.state]} text-white`}
              >
                {stateLabels[campaignData.state]}
              </Badge>
              {campaignData.paused && (
                <Badge variant="secondary">Paused</Badge>
              )}
              {campaignData.underReview && (
                <Badge variant="destructive">Under Review</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-lg break-all">{campaignData.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CampaignStats data={campaignData} />

            {campaignData.state === CampaignState.Active && (
              <Card>
                <CardHeader>
                  <CardTitle>Fund This Campaign</CardTitle>
                  <CardDescription>
                    Select a tier to contribute to this campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {fundingDisabled && (
                    <p className="mb-4 text-sm text-yellow-600">
                      Funding is temporarily disabled while this campaign is{' '}
                      {campaignData.paused ? 'paused' : 'under review'}.
                    </p>
                  )}
                  <FundingForm 
                    campaignAddress={campaignAddress} 
                    tiers={campaignData.tiers} 
                    onSuccess={refetch}
                    disabled={fundingDisabled}
                  />
                </CardContent>
              </Card>
            )}

            {canRefund && (
              <Card>
                <CardHeader>
                  <CardTitle>Request Refund</CardTitle>
                  <CardDescription>
                    This campaign failed. You can request a refund of your contribution.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm">
                      Your contribution: <span className="font-semibold">{formatEther(totalContribution)} ETH</span>
                    </p>
                    <Button onClick={handleRefund} disabled={isRefunding} className="w-full">
                      {isRefunding ? 'Processing...' : 'Request Refund'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {canWithdraw && (
                    <div className="space-y-2">
                      {canRequestWithdrawal && (
                        <Button
                          variant="outline"
                          onClick={handleRequestWithdrawal}
                          disabled={isRequestingWithdrawal}
                          className="w-full"
                        >
                          {isRequestingWithdrawal
                            ? 'Requesting...'
                            : 'Request Withdrawal'}
                        </Button>
                      )}
                      <Button
                        onClick={handleWithdraw}
                        disabled={!canExecuteWithdrawal || isWithdrawing}
                        className="w-full"
                      >
                        {isWithdrawing
                          ? 'Processing...'
                          : canExecuteWithdrawal
                            ? 'Withdraw Funds'
                            : 'Withdrawal Not Ready'}
                      </Button>
                      {withdrawalStatusText ? (
                        <p className="text-xs text-muted-foreground">
                          {withdrawalStatusText}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {campaignData.state === CampaignState.Active && (
                    <Dialog open={isAddTierOpen} onOpenChange={setIsAddTierOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          Add Tier
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Funding Tier</DialogTitle>
                          <DialogDescription>
                            Create a new funding tier for your campaign
                          </DialogDescription>
                        </DialogHeader>
                        <AddTierForm
                          campaignAddress={campaignAddress}
                          onSuccess={() => {
                            setIsAddTierOpen(false);
                            refetch();
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Owner:{' '}
                    <span className="font-mono">
                      {campaignData.owner.slice(0, 6)}...
                      {campaignData.owner.slice(-4)}
                    </span>
                  </p>
                </CardContent>
              </Card>
            )}

            {isAdminUser && (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => handleAdminPause(!factoryPaused)}
                    disabled={isAdminActionPending || governanceLoading}
                    className="w-full"
                  >
                    {factoryPaused ? 'Resume Campaign' : 'Pause via Factory'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAdminReview(!factoryUnderReview)}
                    disabled={isAdminActionPending || governanceLoading}
                    className="w-full"
                  >
                    {factoryUnderReview ? 'Clear Review' : 'Mark Under Review'}
                  </Button>
                  <Button
                    onClick={handleAdminApprove}
                    disabled={
                      isAdminActionPending ||
                      !hasWithdrawalRequest ||
                      governanceLoading
                    }
                    className="w-full"
                  >
                    Approve Withdrawal
                  </Button>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      Factory paused: {factoryPaused ? 'Yes' : 'No'} | Under
                      review: {factoryUnderReview ? 'Yes' : 'No'}
                    </p>
                    <p>
                      Last approval:{' '}
                      {lastApprovalDate
                        ? formatDistanceToNow(lastApprovalDate, {
                            addSuffix: true,
                          })
                        : 'Never'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {totalContribution > BigInt(0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Contribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatEther(totalContribution)} ETH</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      </Layout>
    </RouteGuard>
  );
}


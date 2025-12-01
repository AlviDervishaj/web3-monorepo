'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fundSchema, FundInput } from '@shungerfund/shared/schemas';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { TierSelector } from '@/components/campaign/TierSelector';
import { Tier } from '@shungerfund/shared/types';
import { useFundCampaign } from '@/hooks/useCampaign';
import { Address } from 'viem';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';

interface FundingFormProps {
  campaignAddress: Address;
  tiers: Tier[];
  onSuccess?: () => void;
  disabled?: boolean;
}

export function FundingForm({ campaignAddress, tiers, onSuccess, disabled = false }: FundingFormProps) {
  const { address } = useAccount();
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const { fund, isPending, isSuccess, error } = useFundCampaign(campaignAddress);

  const form = useForm<FundInput>({
    resolver: zodResolver(fundSchema),
    defaultValues: {
      tierIndex: 0,
    },
  });

  const onSubmit = async ({ tierIndex }: FundInput) => {
    if (selectedTier === null || tierIndex === null || tierIndex === undefined) {
      toast.error('Please select a tier');
      return;
    }

    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    const tier = tiers[tierIndex];
    if (!tier) {
      toast.error('Invalid tier selected');
      return;
    }

    try {
      await fund(tierIndex, tier.amount);
      toast.success('Transaction submitted! Waiting for confirmation...');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to submit funding transaction';
      toast.error(message);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success('Campaign funded successfully!');
      onSuccess?.();
    }
  }, [isSuccess, onSuccess]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || 'Transaction failed');
    }
  }, [error]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <TierSelector
          tiers={tiers}
          selectedTier={selectedTier}
          onSelectTier={(index) => {
            setSelectedTier(index);
            form.setValue('tierIndex', index);
          }}
          disabled={isPending || disabled}
        />

        <FormField
          control={form.control}
          name="tierIndex"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <input type="hidden" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || selectedTier === null || disabled}
        >
          {isPending ? 'Processing...' : 'Fund Campaign'}
        </Button>
      </form>
    </Form>
  );
}


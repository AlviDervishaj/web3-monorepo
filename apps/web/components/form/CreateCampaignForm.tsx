'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCampaignInputSchema, CreateCampaignInput } from '@shungerfund/shared/schemas';
import { parseEther } from 'viem';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCampaign } from '@/hooks/useFactory';
import { toast } from 'sonner';
import { useAccount, useChainId } from 'wagmi';

export function CreateCampaignForm() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { createCampaign, isPending, isSuccess, error, hash, status } = useCreateCampaign();

  const form = useForm<CreateCampaignInput>({
    resolver: zodResolver(createCampaignInputSchema),
    defaultValues: {
      name: '',
      description: '',
      goal: '0',
      durationInDays: 30,
    },
  });

  const onSubmit = (data: CreateCampaignInput) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    // Check if user is on the correct network
    if (chainId !== 11155111) {
      toast.error('Please switch to Sepolia testnet in MetaMask', {
        duration: 6000,
        description: `Current network: ${chainId}, Expected: 11155111`,
      });
      return;
    }

    try {
      // Convert ETH string to wei (BigInt)
      const goalInWei = parseEther(data.goal);
      createCampaign(data.name, data.description, goalInWei, data.durationInDays);
      // Don't show success toast here - wait for hash to be available via useEffect
    } catch (error) {
      // Handle synchronous errors (validation, etc.)
      const message = error instanceof Error ? error.message : 'Failed to create campaign';
      toast.error(message);
      console.error('Campaign creation error:', error);
    }
  };

  // Show "Transaction submitted" when hash becomes available
  useEffect(() => {
    if (hash) {
      toast.success('Transaction submitted! Waiting for confirmation...');
    }
  }, [hash]);

  // Handle success and error states with useEffect to avoid duplicate toasts
  useEffect(() => {
    if (isSuccess) {
      toast.success('Campaign created successfully!');
      form.reset();
    }
  }, [isSuccess, form]);

  useEffect(() => {
    if (error) {
      const errorMessage = error.message || 'Transaction failed';
      toast.error(errorMessage, {
        duration: 5000,
      });
      console.error('Campaign creation error:', { 
        error, 
        status, 
        hash,
        message: error.message,
        stack: error.stack,
      });
    }
  }, [error, status, hash]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Name</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome Campaign" {...field} />
              </FormControl>
              <FormDescription>
                A catchy name for your campaign
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your campaign and what you're raising funds for..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide details about your campaign (10-1000 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="goal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Goal (ETH)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="10"
                    {...field}
                    value={field.value}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow numbers and decimal point
                      if (/^\d*\.?\d*$/.test(value) || value === '') {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Target amount in ETH
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="durationInDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (Days)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="30"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Campaign duration in days
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Creating Campaign...' : 'Create Campaign'}
        </Button>
      </form>
    </Form>
  );
}


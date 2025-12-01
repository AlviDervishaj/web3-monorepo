'use client';

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { addTierInputSchema, AddTierInput } from '@shungerfund/shared/schemas';
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
import { useAddTier } from '@/hooks/useCampaign';
import { Address } from 'viem';
import { toast } from 'sonner';

interface AddTierFormProps {
  campaignAddress: Address;
  onSuccess?: () => void;
}

export function AddTierForm({ campaignAddress, onSuccess }: AddTierFormProps) {
  const { addTier, isPending, isSuccess, error } = useAddTier(campaignAddress);

  const form = useForm<AddTierInput>({
    resolver: zodResolver(addTierInputSchema),
    defaultValues: {
      name: '',
      amount: '0',
    },
  });

  const onSubmit = async (data: AddTierInput) => {
    try {
      // Convert ETH string to wei (BigInt)
      const amountInWei = parseEther(data.amount);
      await addTier(data.name, amountInWei);
      toast.success('Transaction submitted! Waiting for confirmation...');
      form.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add tier';
      toast.error(message);
    }
  };

  // Handle success state with useEffect to avoid "cannot update component while rendering" error
  useEffect(() => {
    if (isSuccess) {
      toast.success('Tier added successfully!');
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tier Name</FormLabel>
              <FormControl>
                <Input placeholder="Early Supporter" {...field} />
              </FormControl>
              <FormDescription>
                A name for this funding tier
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (ETH)</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="1"
                  {...field}
                  value={field.value}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      field.onChange(value);
                    }
                  }}
                />
              </FormControl>
              <FormDescription>
                Contribution amount in ETH for this tier
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Adding Tier...' : 'Add Tier'}
        </Button>
      </form>
    </Form>
  );
}


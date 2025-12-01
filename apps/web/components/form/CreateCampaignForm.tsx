"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCampaignInputSchema,
  CreateCampaignInput,
} from "@shungerfund/shared/schemas";
import { parseEther } from "viem";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCampaign } from "@/hooks/useFactory";
import { toast } from "sonner";
import { useConnection, useChainId, useWalletClient } from "wagmi";

export function CreateCampaignForm() {
  const connection = useConnection();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient({ chainId });
  const { createCampaign, isPending, isSuccess, error, hash, status } =
    useCreateCampaign();

  // Get account info from connection (wagmi v3 pattern - useConnection replaces useAccount)
  const address = connection.address;
  const isConnected = connection.isConnected;

  const form = useForm<CreateCampaignInput>({
    resolver: zodResolver(createCampaignInputSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: "0",
      durationInDays: 30,
    },
  });

  const onSubmit = (data: CreateCampaignInput) => {
    // Early validation: check if wallet is connected
    if (!isConnected || !address) {
      toast.error("Please connect your wallet", {
        description: "You need to connect your wallet to create a campaign",
      });
      return;
    }

    // Check if walletClient is ready (handles race condition)
    if (!walletClient) {
      toast.error("Wallet is initializing...", {
        description: "Please wait for your wallet to be ready, then try again",
        duration: 5000,
      });
      return;
    }

    // Check if user is on the correct network
    if (chainId !== 11155111) {
      toast.error("Please switch to Sepolia testnet in MetaMask", {
        duration: 6000,
        description: `Current network: ${chainId}, Expected: 11155111`,
      });
      return;
    }

    // Verify walletClient chain matches expected chainId
    if (walletClient.chain?.id !== chainId) {
      toast.error("Network mismatch detected", {
        description: `Please switch to the correct network. Expected: ${chainId}, Current: ${walletClient.chain?.id}`,
        duration: 6000,
      });
      return;
    }

    try {
      // Convert ETH string to wei (BigInt)
      const goalInWei = parseEther(data.goal);
      createCampaign(
        data.name,
        data.description,
        goalInWei,
        data.durationInDays
      );
      // Don't show success toast here - wait for hash to be available via useEffect
    } catch (error) {
      // Handle synchronous errors (validation, etc.)
      const message =
        error instanceof Error ? error.message : "Failed to create campaign";
      toast.error(message);
      console.error("Campaign creation error:", error);
    }
  };

  // Show "Transaction submitted" when hash becomes available
  useEffect(() => {
    if (hash) {
      toast.success("Transaction submitted! Waiting for confirmation...");
    }
  }, [hash]);

  // Handle success and error states with useEffect to avoid duplicate toasts
  useEffect(() => {
    if (isSuccess) {
      toast.success("Campaign created successfully!");
      form.reset();
    }
  }, [isSuccess, form]);

  useEffect(() => {
    if (error) {
      const errorMessage = error.message || "Transaction failed";
      toast.error(errorMessage, {
        duration: 5000,
      });
      console.error("Campaign creation error:", {
        error,
        status,
        hash,
        message: error.message,
        stack: error.stack,
      });
    }
  }, [error, status, hash]);

  // Determine wallet connection status for UI feedback
  const walletStatus = !isConnected
    ? {
        message: "Please connect your wallet to create a campaign",
        type: "error" as const,
      }
    : !walletClient
    ? {
        message: "Wallet is initializing... Please wait",
        type: "warning" as const,
      }
    : chainId !== 11155111
    ? {
        message: "Please switch to Sepolia testnet to create a campaign",
        type: "warning" as const,
      }
    : { message: "Wallet connected and ready", type: "success" as const };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Wallet connection status indicator */}
        {walletStatus.type !== "success" && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              walletStatus.type === "error"
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
                : "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
            }`}
          >
            {walletStatus.message}
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Name</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome Campaign" {...field} />
              </FormControl>
              <FormDescription>A catchy name for your campaign</FormDescription>
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
                      if (/^\d*\.?\d*$/.test(value) || value === "") {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>Target amount in ETH</FormDescription>
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
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormDescription>Campaign duration in days</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={
            isPending || !isConnected || !walletClient || chainId !== 11155111
          }
        >
          {isPending
            ? "Creating Campaign..."
            : !isConnected || !walletClient
            ? "Connect Wallet"
            : chainId !== 11155111
            ? "Switch to Sepolia"
            : "Create Campaign"}
        </Button>
      </form>
    </Form>
  );
}

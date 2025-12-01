"use client";

import { cookieStorage, createStorage } from "wagmi";

import { createShungerFundConfig } from "@shungerfund/shared/wallet/config";

export const config = createShungerFundConfig({
  sepoliaRpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

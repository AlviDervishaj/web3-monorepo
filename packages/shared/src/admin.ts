import { Address } from "viem";

const DEFAULT_ADMIN_WALLETS: Address[] = [
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
];

const envAdmins =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_ADMIN_WALLETS
    : undefined;

const parsedAdmins =
  envAdmins
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.toLowerCase()) ?? [];

const fallbackAdmins = DEFAULT_ADMIN_WALLETS.map((addr) => addr.toLowerCase());

const combinedAdmins = new Set<string>([
  ...fallbackAdmins,
  ...parsedAdmins,
]);

export const ADMIN_WALLETS: Address[] = Array.from(combinedAdmins).map(
  (addr) => addr as Address
);

export const isAdmin = (address?: string | null) => {
  if (!address) return false;
  return combinedAdmins.has(address.toLowerCase());
};


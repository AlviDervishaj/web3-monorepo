import { injected, mock } from "@wagmi/connectors";
import { createConfig, http, type Config } from "wagmi";
import { localhost, sepolia } from "wagmi/chains";

const MOCK_ACCOUNT = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

export const localhostChain = {
  ...localhost,
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
} as const;

const TARGET_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID ?? localhostChain.id.toString()
);
export const shouldUseMockConnector = TARGET_CHAIN_ID === localhostChain.id;

export type CreateShungerFundConfigOptions = {
  storage?: Config["storage"];
  sepoliaRpcUrl?: string;
};

export const createShungerFundConfig = ({
  storage,
  sepoliaRpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
}: CreateShungerFundConfigOptions = {}) =>
  createConfig({
    chains: [localhostChain, sepolia],
    connectors: shouldUseMockConnector
      ? [
          mock({
            accounts: [MOCK_ACCOUNT],
            features: { reconnect: true },
          }),
        ]
      : [
          injected({
            shimDisconnect: true,
            target: "metaMask",
          }),
        ],
    transports: {
      [localhostChain.id]: http(),
      [sepolia.id]: http(sepoliaRpcUrl),
    },
    ssr: true,
    storage,
  });


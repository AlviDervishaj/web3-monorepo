# ShungerFund - Decentralized Crowdfunding Platform

A complete monorepo for a GoFundMe‑style web3 crowdfunding application built with Next.js, TypeScript, TanStack Query, wagmi, viem, and Solidity smart contracts. This platform allows users to create campaigns, browse active campaigns, contribute funds via tier-based donations, withdraw funds (campaign owners), and request refunds (backers).

## Project Overview

This project includes:

- **Smart Contracts**: Solidity contracts for crowdfunding campaigns and a factory pattern
- **Frontend**: Next.js 14+ with App Router, React, TypeScript
- **Web3 Integration**: wagmi v2 + viem for type-safe blockchain interactions
- **UI Components**: Tailwind CSS + shadcn/ui for modern, accessible UI
- **Type Safety**: Full TypeScript coverage with Zod validation
- **Idempotency**: Transaction tracking to prevent duplicate submissions
- **Wallet Support**: MetaMask and WalletConnect integration

## Features

- **Campaign Creation**: Create crowdfunding campaigns with goals and deadlines
- **Tier-Based Funding**: Support multiple funding tiers with different contribution amounts
- **Campaign Management**: Owners can add/remove tiers, withdraw funds, and manage campaigns
- **Refund System**: Automatic refunds for failed campaigns
- **Type-Safe**: Full TypeScript coverage with contract type generation
- **Idempotent Operations**: Prevents duplicate transactions
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS and shadcn/ui
- **Wallet Integration**: Support for MetaMask and WalletConnect

## Tech Stack

### Smart Contracts
- Solidity ^0.8.28
- Hardhat 3
- viem

### Frontend
- Next.js 14+ (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- wagmi v2
- Zustand (state management)
- React Hook Form + Zod (form validation)
- Sonner (toast notifications)

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- MetaMask or compatible wallet
- For local development: Hardhat node running on `http://127.0.0.1:8545`

### Installation

Install all workspace dependencies:

```bash
pnpm install
```

Compile the smart contracts:

```bash
pnpm contracts:compile
```

Set up the frontend environment variables in `apps/web/.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-api-key
```

### Running Locally

1. Start Hardhat local node:

```bash
pnpm contracts:node
```

2. Deploy contracts to the local network:

```bash
NETWORK=localhost RPC_URL=http://127.0.0.1:8545 PRIVATE_KEY=your-private-key pnpm contracts:deploy
```

The deployment script automatically updates `packages/shared/src/contracts/addresses.ts` so the web app shares the latest factory address.

3. Start the Next.js frontend:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Deploying to Sepolia

1. Get a WalletConnect Project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com)

2. Deploy contracts:

```bash
NETWORK=sepolia RPC_URL=https://sepolia.infura.io/v3/your-api-key PRIVATE_KEY=your-private-key pnpm contracts:deploy
```

The address book in `packages/shared/src/contracts/addresses.ts` will be updated automatically.

4. Build the frontend:

```bash
pnpm --filter @shungerfund/web build
```

## Project Structure

```
web3/
├── apps/
│   └── web/                # Next.js frontend (App Router)
│       ├── app/            # Route segments
│       ├── components/     # React components & providers
│       ├── hooks/          # TanStack Query-powered hooks
│       ├── lib/            # UI-specific helpers (e.g., wagmi client)
│       └── stores/         # Zustand stores
├── packages/
│   ├── contracts/          # Hardhat project + artifacts + scripts
│   └── shared/             # Shared schemas, utils, contract metadata
├── docs/                   # Operations & onboarding docs
├── scripts/                # Legacy helper scripts
└── pnpm-workspace.yaml     # Workspace definition
```

## Usage

### Creating a Campaign

1. Connect your wallet
2. Navigate to "Create" page
3. Fill in campaign details (name, description, goal, duration)
4. Submit transaction
5. After confirmation, add funding tiers from the campaign page

### Funding a Campaign

1. Browse campaigns on the home page
2. Click on a campaign to view details
3. Select a funding tier
4. Confirm the transaction in your wallet
5. Wait for transaction confirmation

### Withdrawing Funds (Campaign Owner)

1. Navigate to your campaign
2. Once the campaign is successful, click "Withdraw Funds"
3. Confirm the transaction

### Requesting Refund (Backer)

1. Navigate to a failed campaign you contributed to
2. Click "Request Refund"
3. Confirm the transaction

## Operations & Governance

The admin dashboard lives at [`/ops`](apps/web/app/ops/page.tsx) and surfaces
factory health, total value locked, campaign status counts, and pending
transactions. Access is restricted to wallets listed in the
`NEXT_PUBLIC_ADMIN_WALLETS` environment variable (see
`@shungerfund/shared/admin`). Once connected, the header reveals an **Ops** link for
quick navigation.

Campaign owners can request withdrawals, while administrators can pause/resume
campaigns, mark them under review, and approve withdrawals directly from the
campaign detail page (`apps/web/app/campaigns/[address]/page.tsx`). The contracts
(`contracts/Crowdfunding*.sol`) enforce withdrawal delays plus factory-driven
governance hooks.

For a full runbook, review [docs/OPERATIONS.md](docs/OPERATIONS.md).

## Testing

Run the Hardhat test suite:

```bash
pnpm contracts:test
```

## Type Safety & Idempotency

- All contract interactions are fully typed using generated TypeScript types
- Zod schemas validate all form inputs
- Transaction hash tracking prevents duplicate submissions
- Zustand store manages transaction state for idempotency

## License

MIT

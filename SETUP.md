# Setup Guide - ShungerFund

This guide will walk you through setting up and running the project from scratch.

## Prerequisites

- Node.js 18+ installed
- pnpm (or npm/yarn) installed
- MetaMask browser extension (for testing)
- For Sepolia deployment: Sepolia ETH in your wallet

## Step 1: Install Dependencies

Install all workspace dependencies:

```bash
cd /Users/shunger/Projects/web3
pnpm install
```

## Step 2: Compile Smart Contracts

The contracts are already compiled (you can see artifacts in `artifacts/`), but if you need to recompile:

```bash
pnpm contracts:compile
```

This will compile:

- `Crowdfunding.sol` - Individual campaign contract
- `CrowdfundingFactory.sol` - Factory contract for creating campaigns

## Step 3: Set Up Environment Variables

### For Frontend (Required)

Create `apps/web/.env.local`:

```bash
cd apps/web
touch .env.local
```

Add the following variables:

```env
# WalletConnect Project ID (get from https://cloud.walletconnect.com)
# For local development, you can use a placeholder, but for production get a real one
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id

# Sepolia RPC URL (optional, only needed if deploying to Sepolia)
# Get from Infura, Alchemy, or other providers
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-api-key
```

**Note**: For local development, you can use a placeholder WalletConnect ID, but WalletConnect features won't work. For full functionality, get a free project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com).

### For Contract Deployment (Optional - only if deploying)

If you want to deploy contracts, you'll need:

```bash
# For localhost deployment
NETWORK=localhost
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=your-private-key-without-0x-prefix

# For Sepolia deployment
NETWORK=sepolia
RPC_URL=https://sepolia.infura.io/v3/your-api-key
PRIVATE_KEY=your-private-key-without-0x-prefix
```

**⚠️ Security Warning**: Never commit private keys to git! Use environment variables or a secure key management system.

## Step 4: Deploy Contracts (Local Development)

### Option A: Using Hardhat Node (Recommended for Development)

1. **Start a local Hardhat node** (in a separate terminal):

```bash
pnpm contracts:node
```

This will:

- Start a local blockchain on `http://127.0.0.1:8545`
- Provide 20 test accounts with 10,000 ETH each
- Display account addresses and private keys

2. **Deploy contracts to local network**:

Deploy the contracts (copy a private key from the Hardhat node output without the `0x` prefix):

```bash
NETWORK=localhost RPC_URL=http://127.0.0.1:8545 PRIVATE_KEY=0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e pnpm contracts:deploy
```

3. **Verify contract addresses**:

After deployment the script rewrites `packages/shared/src/contracts/addresses.ts`. Confirm the `localhost` entry points at your new factory address:

```typescript
export const contractAddresses: Record<Network, { factory: Address }> = {
  localhost: {
    factory: "0x<YOUR_DEPLOYED_FACTORY_ADDRESS>" as Address,
  },
  // ...
};
```

### Option B: Use Existing Deployed Contracts

If contracts are already deployed, just update `packages/shared/src/contracts/addresses.ts`.

## Step 5: Start the Frontend

```bash
pnpm dev
```

The frontend runs on [http://localhost:3000](http://localhost:3000)

## Step 6: Connect Your Wallet

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Click "Connect Wallet" in the header
3. Select MetaMask (or your preferred wallet)
4. **For localhost network**:
   - Make sure your MetaMask is connected to a local network
   - Add Hardhat network: Network Name: "Hardhat Local", RPC URL: `http://127.0.0.1:8545`, Chain ID: `31337`, Currency: ETH
   - Import one of the test accounts from Hardhat node using its private key

## Step 7: Test the Application

1. **Create a Campaign**:

   - Click "Create" in the navigation
   - Fill in campaign details
   - Submit transaction
   - Wait for confirmation

2. **Add Tiers**:

   - Go to your created campaign
   - Click "Add Tier" in the management section
   - Add funding tiers with different amounts

3. **Fund a Campaign**:
   - Browse campaigns on the home page
   - Click on a campaign
   - Select a tier
   - Confirm transaction

## Deploying to Sepolia (Production)

1. **Get Sepolia ETH**: Use a faucet like [sepoliafaucet.com](https://sepoliafaucet.com)

2. **Deploy contracts**:

```bash
NETWORK=sepolia RPC_URL=https://sepolia.infura.io/v3/your-api-key PRIVATE_KEY=your-private-key pnpm contracts:deploy
```

3. **Confirm addresses** in `packages/shared/src/contracts/addresses.ts`

4. **Update environment variables** in `apps/web/.env.local` with your Sepolia RPC URL

5. **Build and deploy the frontend**:

```bash
pnpm --filter @shungerfund/web build
# Deploy to Vercel, Netlify, or your preferred hosting
```

## Troubleshooting

### Contracts not found

- Make sure contracts are compiled: `pnpm contracts:compile`
- Check that `artifacts/` directory exists with contract JSON files

### "Invalid address" errors

- Verify contract addresses in `packages/shared/src/contracts/addresses.ts` match deployed addresses
- Ensure you're on the correct network (localhost vs Sepolia)

### Wallet connection issues

- Make sure MetaMask is installed and unlocked
- For localhost: Add the Hardhat network to MetaMask
- Check that you're on the correct network in MetaMask

### Transaction failures

- Ensure you have enough ETH for gas fees
- Check that the contract is not paused
- Verify campaign state (Active, Successful, Failed)

### Frontend build errors

- Ensure `pnpm install` has been run at the workspace root
- Check that all environment variables are set in `apps/web/.env.local`
- Clear `.next` cache: `rm -rf apps/web/.next` and rebuild

## Quick Start Summary

```bash
# 1. Install dependencies
pnpm install

# 2. Compile contracts (if needed)
pnpm contracts:compile

# 3. Start Hardhat node (in separate terminal)
pnpm contracts:node

# 4. Deploy contracts (in new terminal, use private key from hardhat node)
NETWORK=localhost RPC_URL=http://127.0.0.1:8545 PRIVATE_KEY=<key> pnpm contracts:deploy

# 5. Verify packages/shared/src/contracts/addresses.ts reflects the deployed address

# 6. Create apps/web/.env.local with WalletConnect project ID

# 7. Start frontend
pnpm dev
```

## Operations & Admin Setup

- Add an allowlist of admin wallets via `NEXT_PUBLIC_ADMIN_WALLETS` in
  `apps/web/.env.local` (comma-separated). The default Hardhat Account #0 is
  already included in `@shungerfund/shared/admin`.
- After connecting an admin wallet, the navigation will expose an **Ops**
  dashboard at `/ops` where you can monitor KPIs, view campaigns needing
  attention, and review pending transactions.
- Campaign pages (`/campaigns/[address]`) now include an **Admin Controls** panel
  for pausing, marking under review, and approving withdrawals. Exercise these
  flows locally before moving to Sepolia.
- See [docs/OPERATIONS.md](docs/OPERATIONS.md) for escalation procedures and
  governance guidance.

## Environment Variables Reference

### Frontend (`apps/web/.env.local`)

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID (required for WalletConnect)
- `NEXT_PUBLIC_SEPOLIA_RPC_URL` - Sepolia RPC endpoint (optional, for Sepolia network)

### Deployment Script

- `NETWORK` - Network to deploy to: `localhost` or `sepolia`
- `RPC_URL` - RPC endpoint URL
- `PRIVATE_KEY` - Private key of deployer account (without 0x prefix)

## Next Steps

- Read the main [README.md](./README.md) for more details
- Check contract tests: `pnpm contracts:test`
- Explore the codebase structure in the README

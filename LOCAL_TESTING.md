# Local Testing Guide - Free Transactions

When testing locally with Hardhat, **transactions are completely FREE** - you don't need real ETH or testnet ETH. This guide will help you set up local testing properly.

## Why You're Seeing Transaction Costs

If MetaMask is asking for real money, it means you're connected to a **real network** (like Sepolia or Mainnet) instead of the **local Hardhat network**.

## Solution: Connect to Localhost Network

### Step 1: Start Hardhat Node

Make sure your local Hardhat node is running:

```bash
# From root directory
pnpm run hardhat:node
```

This starts a local blockchain at `http://127.0.0.1:8545` with **free test accounts** that have 10,000 ETH each.

**⚠️ Important**: Every time you restart Hardhat, the blockchain state resets. You'll need to redeploy contracts (see Step 1.5 below).

### Step 1.5: Deploy Contracts (Required After Each Hardhat Restart)

**⚠️ CRITICAL**: Every time you restart Hardhat node, you MUST redeploy contracts. The blockchain state resets, so the old contract addresses no longer exist.

After starting Hardhat node, deploy the contracts:

```bash
# Quick deploy (uses Account #0 from Hardhat)
pnpm run deploy:local
```

Or manually with a different account:

```bash
# Copy a private key from the Hardhat node output (Account #0 is recommended)
# Use the private key WITHOUT the 0x prefix
NETWORK=localhost RPC_URL=http://127.0.0.1:8545 PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 npx tsx scripts/deploy.ts
```

**Note**:

- The deployment script automatically updates `frontend/lib/contracts/addresses.ts` with the new contract address
- You'll see the factory contract address in the terminal output
- If you see "WARNING: Calling an account which is not a contract" errors, it means contracts need to be redeployed

### Step 2: Add Localhost Network to MetaMask

The app will try to automatically add the network, but if it doesn't work, add it manually:

1. **Open MetaMask**
2. Click the network dropdown (top of MetaMask)
3. Click "Add Network" or "Add a network manually"
4. Enter these details:

   - **Network Name**: `Hardhat Local`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
   - **Block Explorer URL**: (leave empty)

5. Click "Save"

### Step 3: Import a Test Account

From the Hardhat node output, copy one of the private keys and import it into MetaMask:

1. In MetaMask, click the account icon (top right)
2. Click "Import Account"
3. Paste the private key (without `0x` prefix)
4. Click "Import"

**Example account from Hardhat:**

```
Account #0:  0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Step 3.5: Exercise Ops & Governance Tools

1. Ensure the wallet you connected is part of `NEXT_PUBLIC_ADMIN_WALLETS` (the
   default Hardhat Account #0 already is).
2. Visit `/ops` to confirm the dashboard loads KPIs for total campaigns, status
   counts, and total value locked.
3. Create and fund a campaign, request a withdrawal as the owner, then approve it
   from the admin wallet to validate the delay + approval workflow.
4. Pause or mark a campaign under review and watch it appear in the Ops attention
   list as well as the campaign detail page.
5. Refer to [docs/OPERATIONS.md](docs/OPERATIONS.md) for full runbooks if you
   need to simulate escalations.

### Step 4: Connect and Switch Network

1. **Connect your wallet** in the app
2. The app will automatically try to switch to Localhost (Chain ID 31337)
3. If MetaMask prompts you to switch networks, **click "Approve"**
4. Verify you're on "Hardhat Local" network in MetaMask

### Step 5: Test Transactions

Now all transactions are **FREE**:

- Creating campaigns: **FREE**
- Funding campaigns: **FREE**
- Withdrawing funds: **FREE**
- All other operations: **FREE**

## Verification

To verify you're on the correct network:

1. Check MetaMask - it should show "Hardhat Local" or "Localhost 8545"
2. Check the app header - network selector should show "Localhost"
3. Check your balance - should show 10,000 ETH (or whatever the Hardhat account has)

## Troubleshooting

### "Transaction costs real money"

**Problem**: You're on Sepolia or Mainnet instead of Localhost.

**Solution**:

1. Make sure Hardhat node is running
2. Switch to "Hardhat Local" network in MetaMask
3. Use the network selector in the app header to switch to Localhost

### "Network not found"

**Problem**: Localhost network not added to MetaMask.

**Solution**:

1. The app will try to add it automatically
2. If that fails, add it manually (see Step 2 above)
3. Make sure the RPC URL is exactly `http://127.0.0.1:8545`

### "Insufficient funds"

**Problem**: You're using a MetaMask account that doesn't have ETH on localhost.

**Solution**:

1. Import one of the Hardhat test accounts (see Step 3)
2. Or send ETH from a Hardhat account to your MetaMask account using the Hardhat console

### "Connection fails"

**Problem**: Hardhat node not running or wrong RPC URL.

**Solution**:

1. Verify Hardhat node is running: `pnpm run hardhat:node`
2. Check it's listening on `http://127.0.0.1:8545`
3. Try refreshing the page

## Important Notes

- **Localhost transactions are FREE** - no real ETH needed
- **Hardhat accounts have unlimited ETH** - use them for testing
- **Network must be "Hardhat Local" (31337)** - not Sepolia or Mainnet
- **Always use localhost for development** - switch to Sepolia only for staging/testing on testnet

## Sepolia Environment Checklist

When you are ready to stage or deploy against Sepolia, set the following environment variables in your shell (or `.env.local`) **before** running `pnpm contracts:deploy` or the Next.js app. These are required locally and will also be mirrored to Vercel:

| Variable | Purpose | Example |
| --- | --- | --- |
| `NETWORK` | Target network for scripts | `sepolia` |
| `RPC_URL` | HTTPS endpoint from Infura, Alchemy, etc. | `https://sepolia.infura.io/v3/<key>` |
| `PRIVATE_KEY` | Deployer wallet (no `0x` prefix needed) | `df5708…` |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Frontend read-only RPC | same as `RPC_URL` or a gateway with higher rate limits |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | Latest factory deployed on Sepolia | `0x1234…` |
| `NEXT_PUBLIC_CHAIN_ID` | Ensures wallets switch to Sepolia | `11155111` |

**Security tips**

- Never commit these values—use `direnv`, `.env.local`, or Vercel project secrets.
- Prefer a dedicated deployer wallet; keep a small balance and rotate keys after each production deploy.
- Rate limiting: if `RPC_URL` throttles, use two providers and rotate by setting `RPC_URL` when running a deploy vs. `NEXT_PUBLIC_SEPOLIA_RPC_URL` for read-only traffic.

# ShungerFund Deployment Runbook

This document walks through every step required to ship ShungerFund to Sepolia via Vercel. Follow the checklist in order to keep deployments idempotent and reproducible.

## 1. Prerequisites

1. Install pnpm 10.18+ and Node 20+ matching the `packageManager` value.
2. Have access to the GitHub repo and the Vercel project (Production + Preview scopes).
3. Create a **dedicated Sepolia deployer wallet** funded with test ETH.
4. Obtain at least one HTTPS RPC endpoint (Infura, Alchemy, or a self-hosted node).

## 2. Contracts: Build & Deploy to Sepolia

```bash
cd /Users/shunger/Projects/web3
pnpm install
pnpm contracts:build

export NETWORK=sepolia
export RPC_URL="https://sepolia.infura.io/v3/<YOUR_KEY>"
export PRIVATE_KEY="<DEPLOYER_PRIVATE_KEY_WITHOUT_0x>"

pnpm contracts:deploy
```

The script will:

- Compile & generate ABIs
- Deploy `CrowdfundingFactory` to Sepolia
- Emit the factory address + tx hash
- Write `/packages/contracts/deployments/sepolia.json`
- Update `/packages/shared/src/contracts/addresses.ts`

If deployment fails mid-way:

1. Delete the partial file in `packages/contracts/deployments/sepolia.json`
2. Re-run `pnpm contracts:build`
3. Re-run `pnpm contracts:deploy`

## 3. Commit Artifacts

After a successful deploy:

1. Commit `packages/contracts/abis/*.json`
2. Commit `packages/contracts/deployments/sepolia.json`
3. Commit `packages/shared/src/contracts/addresses.ts`
4. Tag the commit (e.g., `git tag contracts/v0.2.0-sepolia`) so CI/Vercel can roll back to an exact deployment if needed.

## 4. Configure Environment Variables

Set the following variables locally (`.env.local`) **and** in Vercel (Project Settings → Environment Variables). Mirror them for **Development**, **Preview**, and **Production** unless noted.

| Variable | Scope | Notes |
| --- | --- | --- |
| `NETWORK` | Build scripts only | `sepolia` |
| `RPC_URL` | Build scripts only | Use the same endpoint used for deployment |
| `PRIVATE_KEY` | Build scripts only | Keep in Vercel **Production** only, not Preview |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Frontend | Safe to expose (read-only) |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | Frontend | Copied from deployment summary |
| `NEXT_PUBLIC_CHAIN_ID` | Frontend | `11155111` |
| `NEXT_PUBLIC_ADMIN_WALLETS` | Frontend | Comma-separated addresses with ops powers |

> Tip: add secrets via `vercel env add` or the dashboard. Never commit `.env` files.

## 5. Vercel Project Settings

- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Install Command**: `pnpm install --frozen-lockfile`
- **Build Command**: `pnpm web:build`
- **Output Directory**: `.next`
- **Serverless Functions**: leave default
- **Environment**: enable “Monorepo” and set `NODE_OPTIONS=--max_old_space_size=4096`
- **Ignored Build Step**: leave empty (we rely on tests to gate deploys)
- Add build cache includes for `packages/shared` and `packages/contracts/abis`
- The checked-in [`vercel.json`](vercel.json) mirrors these commands so anyone using `vercel --prod` gets the same behavior as the dashboard configuration.

## 6. CI Gate (GitHub Actions)

Create `.github/workflows/deploy.yml` with the following steps on every push/PR:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm test` (contracts + frontend as needed)
4. `pnpm contracts:check` (verifies Sepolia factory health)
5. `pnpm web:build`

If the workflow succeeds on `main`, trigger a Vercel production deployment (via Vercel GitHub integration or `vercel deploy --prod`).

## 7. Post-Deploy Verification

After Vercel finishes:

1. Visit the production URL.
2. Connect a wallet (MetaMask on Sepolia) and confirm the header shows `Sepolia`.
3. Create a campaign, fund it, and ensure it appears in “Campaigns” and “My Campaigns”.
4. Request a withdrawal, approve via the ops dashboard, and confirm funds move.
5. Check the “Contracts Not Deployed” card is hidden.

Record the tx hashes and screenshots in the release ticket.

## 8. Rollback

If something breaks:

1. In Vercel, open the Deployments tab and “Promote” the last known good deployment.
2. `git revert` or `git checkout` the tag created in step 3 and push to `main`.
3. Ensure `packages/shared/src/contracts/addresses.ts` never reverts to an *older* factory unless you intentionally redeploy contracts.

With this runbook, every deployment is deterministic, auditable, and reversible.***


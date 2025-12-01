# Operations & Governance Runbook

This document explains how to monitor the platform and perform common
governance interventions when running the Web3 GoFundMe stack.

## 1. Admin Access

- Define the list of admin wallets via `NEXT_PUBLIC_ADMIN_WALLETS` (comma
  separated) in `apps/web/.env.local`. See `@shungerfund/shared/admin` for the
  default Hardhat account that ships with local development.
- Connect one of the allow‑listed wallets in the UI. The header will reveal an
  **Ops** link that navigates to `/ops`.

## 2. Monitoring Dashboard (`/ops`)

- **KPIs**: Total campaigns, unique creators, current network, factory pause
  state, total value locked, and a status breakdown (active/successful/failed).
- **Attention list**: Campaigns that are paused or marked under review.
- **Recent activity**: Live pending transactions pulled from the transaction
  store (funding, withdrawals, admin actions, etc.).

Use this page to quickly validate that contracts are deployed, Hardhat is
running on the expected chain, and no campaigns require manual intervention.

## 3. Governance Actions

Each campaign page (`/campaigns/[address]`) exposes owner tools plus an **Admin
Controls** panel (visible to allow‑listed wallets):

- **Pause/Resume** a campaign via the factory (calls
  `CrowdfundingFactory.setCampaignPause`).
- **Mark Under Review** to halt new funding while investigating.
- **Approve Withdrawal** after a creator has requested funds. Withdrawals also
  enforce a 24h delay (`WITHDRAWAL_DELAY`) before execution.

The UI automatically surfaces the latest approval timestamp, pending withdrawal
status, and whether funding is disabled due to pausing or review.

## 4. Incident Runbooks

| Scenario | Steps |
| --- | --- |
| Suspicious campaign | Pause via admin panel, mark under review, contact the owner, and keep the Ops dashboard attention list clear. |
| Creator stuck on withdrawal | Ensure the owner requested a withdrawal, approve it from the admin panel, and confirm the 24h delay has elapsed before they retry `Withdraw Funds`. |
| Hardhat restart | Rerun `pnpm contracts:node` (if needed) and `pnpm contracts:deploy` (see `SETUP.md`) so the factory address updates, then verify `/ops` shows a healthy factory. |
| Refund storm | When many campaigns fail simultaneously, use `/ops` to track failures and confirm refunds succeed from the campaign page. |

## 5. Local Testing Checklist

1. Start Hardhat (`pnpm contracts:node`) and deploy contracts (`pnpm contracts:deploy`).
2. Launch the frontend (`pnpm dev` from the repo root).
3. Connect the default Hardhat admin wallet (Account #0) to unlock `/ops`.
4. Create/fund campaigns, request withdrawals, and exercise admin controls to
   confirm governance flows before moving to testnet.

Refer back to `SETUP.md` and `LOCAL_TESTING.md` for full environment bootstraps.

## 6. CI Pipeline Checklist

Run the following commands in automation (GitHub Actions, Jenkins, etc.):

1. `pnpm install`
2. `pnpm --filter @shungerfund/web lint`
3. `pnpm --filter @shungerfund/web build`
4. `pnpm contracts:test`


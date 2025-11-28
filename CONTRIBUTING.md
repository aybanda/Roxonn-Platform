# Contributing to Roxonn Platform

Welcome to the Roxonn Platform! We're excited you're interested in contributing. This document will help you get started with the codebase and understand our contribution process.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Making Contributions](#making-contributions)
- [Bounty System](#bounty-system)
- [Testing](#testing)
- [Common Tasks](#common-tasks)

---

## Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 9.x or higher
- **PostgreSQL** 14+ (for local development)
- **Git** with signed commits enabled

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Roxonn-FutureTech/Roxonn-Platform.git
cd Roxonn-Platform

# Install dependencies
npm install

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your configuration

# Compile smart contracts (required for build)
npx hardhat compile

# Run development server
npm run dev
```

---

## Project Architecture

### Directory Structure

```
Roxonn-Platform/
├── client/                 # React frontend
│   └── src/
│       ├── pages/          # Page components (20 pages)
│       ├── components/     # Reusable UI components (70+)
│       │   └── ui/         # shadcn/ui primitives
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # Utilities (api, blockchain, csrf)
│       └── styles/         # Global styles
├── server/                 # Express backend
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API route definitions
│   ├── auth.ts             # GitHub OAuth & JWT auth
│   ├── blockchain.ts       # XDC blockchain service
│   ├── walletService.ts    # Tatum wallet integration
│   ├── db.ts               # PostgreSQL with Drizzle ORM
│   ├── config.ts           # Configuration management
│   ├── services/           # Business logic services
│   └── routes/             # Additional route modules
├── contracts/              # Solidity smart contracts
│   ├── DualCurrencyRepoRewards.sol  # Main rewards contract
│   ├── ROXNToken.sol                # ROXN ERC20 token
│   ├── CustomForwarder.sol          # Meta-transactions
│   └── ProofOfCompute.sol           # Compute node management
├── shared/                 # Shared types and schema
│   └── schema.ts           # Database schema & types
├── migrations/             # Database migrations
├── scripts/                # Deployment scripts
└── docs/                   # Documentation
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Blockchain | XDC Network, Solidity, Hardhat, ethers.js v6 |
| Authentication | GitHub OAuth, JWT, Passport.js |
| Wallet | Tatum API, AWS KMS encryption |

### Smart Contracts Overview

| Contract | Purpose | Pattern |
|----------|---------|---------|
| `DualCurrencyRepoRewards` | Repository funding & rewards (XDC/ROXN/USDC) | UUPS Proxy |
| `ROXNToken` | Platform governance token (1B max supply) | UUPS Proxy |
| `CustomForwarder` | Gasless meta-transactions (EIP-712) | Stateless |
| `ProofOfCompute` | Compute node registration & tracking | Ownable |

### Database Schema (Key Tables)

- `users` - GitHub users with wallet info
- `registered_repositories` - Repos registered on platform
- `subscriptions` - Course subscriptions
- `referral_codes`, `referrals`, `referral_rewards` - Referral system
- `multi_currency_bounties` - Issue bounty tracking
- `prompt_transactions` - AI usage ledger

---

## Development Setup

### Environment Variables

Create `server/.env` with required variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/roxonn

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_APP_ID=your_app_id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_WEBHOOK_SECRET=your_webhook_secret

# Authentication
SESSION_SECRET=random_32_char_string
JWT_SECRET=random_32_char_string
ENCRYPTION_KEY=random_32_char_string

# Blockchain (XDC Testnet for development)
XDC_RPC_URL=https://rpc.apothem.network
PRIVATE_KEY=your_test_wallet_private_key

# Contract Addresses (Testnet)
DUAL_CURRENCY_REWARDS_CONTRACT_ADDRESS=0x...
ROXN_TOKEN_ADDRESS=0x...
FORWARDER_CONTRACT_ADDRESS=0x...
USDC_XDC_ADDRESS=0x...

# Tatum (Wallet Provider)
TATUM_API_KEY=your_tatum_api_key

# URLs
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5000
```

### Running Locally

```bash
# Full-stack development (frontend + backend)
npm run dev

# Backend only
npm run dev:server

# Frontend only (connects to production API)
npm run dev:client

# Type checking
npm run check

# Production build
npx hardhat compile  # Required first
npm run build
```

### Database Setup

```bash
# Push schema to database
npm run db:push

# Run specific migration
psql $DATABASE_URL < migrations/0015_add_referral_system.sql
```

### Smart Contract Development

```bash
# Compile contracts
npx hardhat compile

# Deploy to testnet (Apothem)
npx hardhat run scripts/deploy_dual_currency_rewards.cjs --network xdcTestnet

# Deploy to mainnet
npx hardhat run scripts/deploy_dual_currency_rewards.cjs --network xinfin

# Verify on XDCScan
npx hardhat verify --network xinfin <CONTRACT_ADDRESS>
```

---

## Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Prefer `const` over `let`, avoid `var`
- Use async/await over raw Promises
- Add types to function parameters and returns
- Use meaningful variable names

```typescript
// Good
async function getUserWallet(userId: number): Promise<Wallet | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });
  return user?.xdcWalletAddress ? { address: user.xdcWalletAddress } : null;
}

// Avoid
async function getWallet(id) {
  var u = await db.query.users.findFirst({ where: eq(users.id, id) });
  return u?.xdcWalletAddress ? { address: u.xdcWalletAddress } : null;
}
```

### React Components

- Use functional components with hooks
- Keep components focused and small
- Extract reusable logic into custom hooks
- Use TypeScript interfaces for props

```typescript
interface WalletCardProps {
  address: string;
  balance: string;
  currency: 'XDC' | 'ROXN' | 'USDC';
}

export function WalletCard({ address, balance, currency }: WalletCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{currency} Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{balance}</p>
        <p className="text-sm text-muted-foreground">{formatAddress(address)}</p>
      </CardContent>
    </Card>
  );
}
```

### Solidity

- Use Solidity 0.8.22+
- Follow OpenZeppelin patterns
- Add NatSpec comments to public functions
- Use SafeERC20 for token operations
- Add reentrancy guards to state-changing functions

```solidity
/// @notice Distribute reward to a contributor
/// @param repoId The repository ID
/// @param issueId The issue ID
/// @param contributorAddress The contributor's wallet address
function distributeReward(
    uint256 repoId,
    uint256 issueId,
    address contributorAddress
) external onlyPoolManager(repoId) nonReentrant {
    // Implementation
}
```

### CSS/Styling

- Use Tailwind CSS utilities
- Follow the existing design system (see `client/src/styles/index.css`)
- Use CSS variables for theming
- Prefer utility classes over custom CSS

---

## Making Contributions

### Workflow

1. **Find an Issue** - Browse [open issues](https://github.com/Roxonn-FutureTech/Roxonn-Platform/issues) with `community-bounty` label
2. **Comment** - Express interest and ask questions
3. **Fork & Branch** - Create a feature branch from `main`
4. **Develop** - Make changes following our guidelines
5. **Test** - Ensure your changes work correctly
6. **Submit PR** - Open a pull request with clear description
7. **Review** - Address feedback from reviewers
8. **Merge** - Once approved, your PR will be merged
9. **Reward** - Receive bounty payment to your Roxonn wallet

### Branch Naming

```
feature/issue-number-brief-description
fix/issue-number-brief-description
docs/brief-description

# Examples
feature/10-leaderboard-page
fix/15-wallet-balance-display
docs/api-documentation
```

### Commit Messages

Use conventional commits:

```
feat: add leaderboard page with top contributors
fix: correct wallet balance calculation for ROXN
docs: update API documentation for rewards endpoint
refactor: split routes.ts into modular files
test: add unit tests for referral service
```

### Pull Request Template

Your PR should include:

```markdown
## Summary
Brief description of changes

## Related Issue
Fixes #<issue-number>

## Changes Made
- Change 1
- Change 2

## Testing Done
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] Verified on testnet (if blockchain)

## Screenshots (if UI changes)
```

---

## Bounty System

### How Bounties Work

1. **Issues are funded** by pool managers with XDC, ROXN, or USDC
2. **Contributors claim** issues by commenting and getting assigned
3. **Work is submitted** via pull request
4. **PR is reviewed** and merged by maintainers
5. **Bounty is distributed** to contributor's Roxonn wallet

### Bounty Labels

| Label | Meaning |
|-------|---------|
| `community-bounty` | Open for community contributions with reward |
| `good first issue` | Beginner-friendly task |
| `help-wanted` | We need community help |
| `bounty` | Has associated bounty payment |

### Payment Process

- Rewards are paid in XDC, ROXN, or USDC (as specified in issue)
- Payments go to your registered Roxonn wallet
- Platform fee: 0.5% from pool, 0.5% from payout
- Minimum payout: No minimum

---

## Testing

### Running Tests

```bash
# Run all tests (when implemented)
npm test

# Run specific test file
npm test -- path/to/test.ts
```

### Writing Tests

We use Vitest for testing. Place tests in `__tests__` directories or with `.test.ts` suffix:

```typescript
// server/services/__tests__/referralService.test.ts
import { describe, it, expect } from 'vitest';
import { ReferralService } from '../referralService';

describe('ReferralService', () => {
  it('should generate unique referral code', async () => {
    const code = await ReferralService.generateCode('testuser');
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });
});
```

---

## Common Tasks

### Adding a New API Endpoint

1. Add route handler in `server/routes.ts` (or create new file in `server/routes/`)
2. Add business logic in appropriate service file
3. Add TypeScript types in `shared/schema.ts`
4. Apply auth middleware: `requireAuth` or `requireVSCodeAuth`
5. Add CSRF protection for POST/PUT/DELETE

```typescript
// In routes.ts
app.post('/api/my-endpoint', requireAuth, csrfProtection, async (req, res) => {
  try {
    const result = await myService.doSomething(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});
```

### Adding a New Frontend Page

1. Create page in `client/src/pages/my-page.tsx`
2. Add route in `client/src/App.tsx`
3. Add navigation link in `client/src/components/navigation-bar.tsx` (if needed)
4. Use existing hooks: `useAuth()`, `useWallet()`, `useToast()`

```typescript
// client/src/pages/my-page.tsx
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MyPage() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Redirect to="/auth" />;

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>My Page</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Content */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Modifying Database Schema

1. Update schema in `shared/schema.ts`
2. Create migration file in `migrations/`
3. Run migration: `npm run db:push`
4. Update relevant services and types

### Adding a Smart Contract Function

1. Add function to contract in `contracts/`
2. Compile: `npx hardhat compile`
3. Update `server/blockchain.ts` with new method
4. Test on Apothem testnet first
5. Deploy and verify on mainnet

---

## Getting Help

- **Discord**: [Join our community](https://discord.gg/roxonn)
- **GitHub Discussions**: Ask questions in repo discussions
- **Issues**: Comment on relevant issue for clarification

## Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/). Be respectful, inclusive, and constructive.

---

Thank you for contributing to Roxonn Platform! Together we're building the future of decentralized software development.

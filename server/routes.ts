import type { Express, Request, Response, NextFunction } from "express";
import express from 'express';
import jwt, { SignOptions } from 'jsonwebtoken'; // Added SignOptions
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { setupAuth, requireAuth, requireVSCodeAuth, csrfProtection } from "./auth";
import { handleVSCodeAIChatCompletions } from './vscode-ai-handler';
import crypto from 'crypto'; // Fixing the crypto.createHmac issue by using the correct import
import { storage } from "./storage";
import {
  updateProfileSchema,
  type BlockchainError,
  fundRoxnRepoSchema, // Corrected name
  fundUsdcRepoSchema, // For USDC funding
  allocateUnifiedBountySchema, // Corrected name
  submitAssignmentSchema
} from "@shared/schema";
import { registeredRepositories, courseAssignments } from "../shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { handleOpenAIStream } from './openai-stream';
import { getOrgRepos, getRepoDetails, verifyRepoExists, verifyUserIsRepoAdmin, verifyUserIsOrgAdmin, getUserAdminOrgs, getOrgReposForRegistration, getUserAdminRepos, handlePullRequestMerged, handleIssueClosed, getInstallationAccessToken, getGitHubApiHeaders, GITHUB_API_BASE, findAppInstallationByName, isValidGitHubOwner, isValidGitHubRepo, buildSafeGitHubUrl, handleBountyCommand, parseBountyCommand } from "./github";
import { blockchain } from "./blockchain";
import { ethers } from "ethers";
import { log } from "./utils";
import passport from "passport";
import { IncomingMessage } from 'http';
import { config } from './config';
import { Webhooks } from "@octokit/webhooks";
import axios from 'axios';
// import rawBody from 'raw-body'; // Not needed as we use express.json with verify
import { exchangeCodeForRefreshToken, getZohoAuthUrl, isZohoConfigured } from './zoho';
import { onrampService } from './onrampService';
import { TransactionStatus } from '../shared/schema';
import { WalletService } from './walletService';
import { checkRepositoryFundingLimit, recordRepositoryFunding, getRepositoryFundingStatus, REPOSITORY_FUNDING_DAILY_LIMIT } from './funding-limits';
import { transferLimits, DAILY_TRANSFER_LIMIT } from './transfer-limits';
import { encryptWithSharedSecret, deriveSharedSecret, SERVER_PUBLIC_KEY_BASE64 } from './ecdh';
import { sendOtpEmail } from './email';
import aiScopingAgentRouter from './routes/aiScopingAgent';
import multiCurrencyWalletRoutes from './routes/multiCurrencyWallet';
import referralRoutes from './routes/referralRoutes';
import promotionalBountiesRoutes from './routes/promotionalBounties';
import { registerModularRoutes } from './routes/index';
import { referralService } from './services/referralService';
import { activityService } from './services/activityService';
import { dispatchTask } from './services/proofOfComputeService';
import { handleHeartbeat, getNodeStatus, getAllNodeStatuses } from './services/exoNodeService';
import { securityMiddlewares } from './security/middlewares';
import { getCourseVideoUrls, isCourseValid } from './azure-media';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Extend IncomingMessage to include body property
interface ExtendedIncomingMessage extends IncomingMessage {
  body?: any;
}

// Sanitize user data to remove sensitive information
function sanitizeUserData(user: any) {
  if (!user) return null;

  // Create a copy of the user object without sensitive fields
  const { xdcWalletMnemonic, xdcPrivateKey, encryptedPrivateKey, encryptedMnemonic, githubAccessToken, ...sanitizedUser } = user;

  return sanitizedUser;
}

// --- Webhook Middleware (Keep existing one for now, maybe rename later?) ---
const webhookMiddleware = express.raw({
  type: ['application/json', 'application/x-www-form-urlencoded'],
  verify: (req: ExtendedIncomingMessage, _res, buf) => {
    // Store raw body for signature verification
    if (buf && buf.length) {
      req.body = buf;
    }
  }
});


export async function registerRoutes(app: Express) {
  // Authentication is already initialized in index.ts
  // Don't call setupAuth(app) again to avoid double registration


  // Register all modular routes (blockchain, subscription, wallet, etc.)
  registerModularRoutes(app);

  // Debug middleware to log only blockchain operations
  app.use("/api/blockchain", (req: Request, res: Response, next: NextFunction) => {
    log(`${req.method} ${req.path}`, 'blockchain');
    next();
  });

  // Repository and GitHub routes are now in server/routes/repositoryRoutes.ts

  // Profile routes are now in server/routes/miscRoutes.ts
  // Registered via registerModularRoutes() above

  // Wallet routes are now in server/routes/walletRoutes.ts and server/routes/multiCurrencyWallet.ts
  // Registered via registerModularRoutes() above

  // Subscription routes are now in server/routes/subscriptionRoutes.ts
  // Registered via registerModularRoutes() above


  // Social Engagement feature has been removed


  // Catch-all route for client-side routing
  // Promotional Bounties API routes
  app.use('/api/promotional', promotionalBountiesRoutes);


  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return next();
    }

    // In development, let Vite handle it
    if (config.nodeEnv !== "production") {
      return next();
    }

    // In production, serve the index.html
    res.sendFile(resolve(__dirname, "../dist/public/index.html"));
  });
}

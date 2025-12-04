import type { Express, Request, Response, NextFunction } from "express";
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { log } from "./utils";
import { IncomingMessage } from 'http';
import { config } from './config';
import { registerModularRoutes } from './routes/index';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



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

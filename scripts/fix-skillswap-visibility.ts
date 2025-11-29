/**
 * One-time script to fix skillswap repository visibility
 * Run with: npx tsx scripts/fix-skillswap-visibility.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { registeredRepositories } from '../shared/schema';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server/.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

const client = postgres(connectionString, {
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(client);

async function fixSkillswapVisibility() {
  const SKILLSWAP_REPO_ID = '941844929';

  console.log(`Updating skillswap (ID: ${SKILLSWAP_REPO_ID}) to private...`);

  const result = await db.update(registeredRepositories)
    .set({ isPrivate: true })
    .where(eq(registeredRepositories.githubRepoId, SKILLSWAP_REPO_ID))
    .returning({ id: registeredRepositories.id, name: registeredRepositories.githubRepoFullName });

  if (result.length > 0) {
    console.log(`Updated repository: ${result[0].name} (ID: ${result[0].id})`);
  } else {
    console.log('Repository not found in registered_repositories');
  }

  await client.end();
}

fixSkillswapVisibility()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

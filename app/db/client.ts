import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import * as relations from "./relations";
import * as schema from "./schema";

// On Vercel serverless functions, use Neon's WebSocket-pooled driver so we
// don't exhaust Postgres connection limits across cold starts. Locally and in
// tests, use node-postgres TCP so the same client works against a vanilla
// Docker Postgres instance.
const schemaWithRelations = { ...schema, ...relations };
const connectionString = process.env.DATABASE_URL;

export const db = process.env.VERCEL
  ? drizzleNeon(new NeonPool({ connectionString }), { schema: schemaWithRelations })
  : drizzlePg(new PgPool({ connectionString }), { schema: schemaWithRelations });

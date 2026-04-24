import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as relations from "./relations";
import * as schema from "./schema";

// Using node-postgres (TCP) driver — works with both local Postgres and Neon cloud via TCP endpoint
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema: { ...schema, ...relations } });

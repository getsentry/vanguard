import { sql } from "drizzle-orm";
import { db } from "~/db/client";

const clearDatabase = async () => {
  const result = await db.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname='public'`,
  );
  const tableNames = result.rows
    .filter(
      ({ tablename }) => tablename !== "_prisma_migrations" && tablename !== "__drizzle_migrations",
    )
    .map(({ tablename }) => `"public"."${tablename}"`)
    .join(", ");
  if (tableNames) {
    try {
      await db.execute(sql.raw(`TRUNCATE TABLE ${tableNames} CASCADE`));
    } catch (error) {
      console.log({ error });
    }
  }
};

const createDefaultUser = async () => {
  const { users } = await import("~/db/schema");
  const rows = await db
    .insert(users)
    .values({
      id: "cl6vih0pm16012nklaetl2tvze",
      email: "test-iap-user@example.com",
      externalId: "test-iap-user",
    })
    .returning();
  return rows[0];
};

beforeEach(async () => {
  await clearDatabase();

  (global as any).DefaultFixtures = {};
  (global as any).DefaultFixtures.DEFAULT_USER = await createDefaultUser();
});

afterEach(async () => {
  vi.clearAllMocks();
});

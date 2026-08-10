import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://scalara:scalara_dev_password@localhost:5432/scalara_radar";

let _db: ReturnType<typeof drizzle> | null = null;

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop, receiver) {
    if (!_db) {
      const client = postgres(connectionString);
      _db = drizzle(client, { schema });
    }
    return Reflect.get(_db, prop, receiver);
  },
});

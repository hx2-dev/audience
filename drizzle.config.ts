import { type Config } from "drizzle-kit";

import { env } from "~/env";

export default {
  schema: "./src/adapters/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  tablesFilter: ["hx2-audience_*"],
} satisfies Config;

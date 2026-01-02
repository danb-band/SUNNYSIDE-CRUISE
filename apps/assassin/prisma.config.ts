import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.VERCEL === "1" ? env("DATABASE_URL") : env("DIRECT_URL"),
  },
});

// In your backend project: medusa-config.ts
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Redis is required for background tasks and events in production
    redisUrl: process.env.REDIS_URL,
    databaseDriverOptions: {
      connection: {
        ssl: { rejectUnauthorized: false }, // Mandatory for Neon
      },
    },
    http: {
      storeCors: process.env.STORE_CORS || "",
      adminCors: process.env.ADMIN_CORS || "",
      authCors: process.env.AUTH_CORS || "",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  // Add this section if it's missing to ensure Admin loads correctly
  admin: {
    disable: false,
    path: "/app",
    backendUrl: process.env.MEDUSA_BACKEND_URL || "https://thegoodstuff-backend.onrender.com"
  }
})
import z from "zod";
import { generateErrorMessage } from "zod-error";

export const serverEnvSchema = z.object({
  DATABASE_URL: z.string(),
  // CLERK_PUBLISHABLE_KEY: z.string(),
  // CLERK_SECRET_KEY: z.string(),
  SESSION_SECRET: z.string(),
  //SECURE_AUTH_COOKIE: z.enum(["true", "false"]).transform(Boolean),
  NODE_ENV: z.enum(["development", "test", "production"]),
  //SECRET_KEY_BASE: z.string(),
});

type ConfigSchema = z.infer<typeof serverEnvSchema>;

/** Zod will filter all the keys not specified on the schema */
function buildEnv(): ConfigSchema {
  try {
    return serverEnvSchema.parse(process.env);
  } catch (error: unknown) {
    console.error("Warning: invalid server env vars!");
    console.error(
      generateErrorMessage((error as z.ZodError).issues, {
        delimiter: { error: "\n" },
      })
    );

    return {} as ConfigSchema;
  }
}

export const SERVER_ENV = buildEnv();
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databasePath: process.env.DATABASE_PATH ?? './data/app.db',
  hookbinUrl: process.env.HOOKBIN_URL ?? '',
  schedulerIntervalMs: Number(process.env.SCHEDULER_INTERVAL_MS ?? 60_000),
  recoveryLookbackHours: Number(process.env.RECOVERY_LOOKBACK_HOURS ?? 30),
};

export function validateConfig(): void {
  if (!config.hookbinUrl) {
    throw new Error('HOOKBIN_URL is required');
  }
}


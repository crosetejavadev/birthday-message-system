import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config';
import { db, statements } from './db';
import { getUserLocalDate } from './time';
import { sendBirthdayMessage } from './sender';

function buildDedupeKey(userId: string, localDate: string): string {
  return `${userId}:${localDate}`;
}

export function generateDeliveriesForDate(now: Date): void {
  const users = statements.listUsers.all() as Array<{ id: string; birthday: string; timezone: string; firstName: string; lastName: string; createdAt: string; updatedAt: string }>;
  const tx = db.transaction((targetLocalDate: string) => {
    for (const u of users) {
      const birth = DateTime.fromISO(u.birthday);
      const local = DateTime.fromISO(targetLocalDate);
      if (birth.isValid && local.isValid && birth.month === local.month && birth.day === local.day) {
        const dedupeKey = buildDedupeKey(u.id, targetLocalDate);
        const delivery = {
          id: uuidv4(),
          userId: u.id,
          deliveryDate: targetLocalDate,
          deliveredAt: null as string | null,
          dedupeKey,
        };
        statements.upsertDelivery.run(delivery);
      }
    }
  });

  // determine target local date per user timezone
  const usersAll = statements.listUsers.all() as Array<{ id: string; timezone: string }>;
  const seenDates = new Map<string, string[]>();
  for (const u of usersAll) {
    const localDate = getUserLocalDate(now, u.timezone);
    const list = seenDates.get(localDate) ?? [];
    list.push(u.id);
    seenDates.set(localDate, list);
  }
  // For simplicity generate for each local date once (listUsers called inside tx again is cheap enough here)
  for (const [localDate] of seenDates) {
    tx(localDate);
  }
}

export async function processDueDeliveries(now: Date): Promise<void> {
  const pending = statements.getPendingDeliveriesWithUsers.all() as Array<{
    id: string; userId: string; deliveryDate: string; firstName: string; lastName: string; timezone: string;
  }>;
  for (const d of pending) {
    const nineUtc = DateTime.fromISO(`${d.deliveryDate}T09:00:00`, { zone: d.timezone }).toUTC();
    if (!nineUtc.isValid) continue;
    if (nineUtc.toJSDate() <= now) {
      const fullName = `${d.firstName} ${d.lastName}`;
      await sendBirthdayMessage(fullName);
      statements.markDelivered.run({ id: d.id, deliveredAt: new Date().toISOString() });
    }
  }
}

export function startScheduler(): NodeJS.Timer {
  const tick = async () => {
    const now = new Date();
    const lookbackHours = config.recoveryLookbackHours;
    // Recovery: ensure deliveries exist for lookback window
    for (let i = 0; i <= lookbackHours; i += 24) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      generateDeliveriesForDate(time);
    }
    await processDueDeliveries(now);
  };
  // initial run fast
  tick().catch(() => {});
  return setInterval(() => { void tick(); }, config.schedulerIntervalMs);
}


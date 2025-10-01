import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { statements, UserRecord } from './db';

export const userInputSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1),
});

export type UserInput = z.infer<typeof userInputSchema>;

export function createUser(input: UserInput): UserRecord {
  const parsed = userInputSchema.parse(input);
  const nowIso = new Date().toISOString();
  const user: UserRecord = {
    id: parsed.id ?? uuidv4(),
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    birthday: parsed.birthday,
    timezone: parsed.timezone,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  statements.insertUser.run(user);
  return user;
}

export function updateUser(input: UserInput & { id: string }): UserRecord {
  const parsed = userInputSchema.extend({ id: z.string().uuid() }).parse(input);
  const user = statements.getUser.get(parsed.id) as UserRecord | undefined;
  if (!user) {
    throw new Error('User not found');
  }
  const updated: UserRecord = {
    ...user,
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    birthday: parsed.birthday,
    timezone: parsed.timezone,
    updatedAt: new Date().toISOString(),
  };
  statements.updateUser.run(updated);
  return updated;
}

export function deleteUser(id: string): void {
  statements.deleteUser.run(id);
}

export function getUser(id: string): UserRecord | undefined {
  return statements.getUser.get(id) as UserRecord | undefined;
}

export function listUsers(): UserRecord[] {
  return statements.listUsers.all() as UserRecord[];
}


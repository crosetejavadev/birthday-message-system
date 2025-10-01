import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/server';
import { migrate } from '../src/db';

describe('API', () => {
  let app: ReturnType<typeof buildApp>;
  beforeAll(() => {
    migrate();
    app = buildApp();
  });
  afterAll(() => {
    // no-op for sqlite file
  });

  it('creates and deletes a user', async () => {
    const create = await request(app).post('/user').send({
      firstName: 'Alice',
      lastName: 'Doe',
      birthday: '1990-10-02',
      timezone: 'America/New_York',
    });
    expect(create.status).toBe(201);
    const id = create.body.id as string;
    expect(id).toBeTruthy();

    const del = await request(app).delete('/user').send({ id });
    expect(del.status).toBe(204);
  });
});


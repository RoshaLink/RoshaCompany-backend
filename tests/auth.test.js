import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { INITIAL_ADMINS } from '../src/services/auth.service.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('INITIAL_ADMINS contains the 5 required accounts with password letsdoit', () => {
  const usernames = INITIAL_ADMINS.map((a) => a.username);
  assert.ok(usernames.includes('bella'));
  assert.ok(usernames.includes('milad'));
  assert.ok(usernames.includes('morteza'));
  assert.ok(usernames.includes('sohrab'));
  assert.ok(usernames.includes('mina'));
  INITIAL_ADMINS.forEach((admin) => {
    assert.strictEqual(admin.password, 'letsdoit');
  });
});

test('POST /api/auth/login returns 400 when body is empty or missing fields', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '' }),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
});

test('GET /api/leads returns 401 Unauthorized when no Bearer token is provided', async () => {
  const res = await fetch(`${baseUrl}/api/leads`);
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.ok(data.message.includes('Authentication required'));
});

test('GET /api/auth/me returns 401 Unauthorized when invalid token is provided', async () => {
  const res = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: 'Bearer invalid_token_123' },
  });
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.strictEqual(data.success, false);
});

test('Public POST /api/lead is accessible without token', async () => {
  const res = await fetch(`${baseUrl}/api/lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '' }), // Invalid data returns 400, NOT 401!
  });
  assert.strictEqual(res.status, 400); // Proves route is open to public, validation caught empty name
});

test('PATCH /api/auth/change-password returns 401 Unauthorized when no Bearer token is provided', async () => {
  const res = await fetch(`${baseUrl}/api/auth/change-password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: 'test', newPassword: 'newpassword123' }),
  });
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.strictEqual(data.success, false);
});

test('PATCH /api/auth/change-password returns 401 Unauthorized with invalid token', async () => {
  const res = await fetch(`${baseUrl}/api/auth/change-password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer invalid_token_xyz',
    },
    body: JSON.stringify({ currentPassword: 'test', newPassword: 'newpassword123' }),
  });
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.strictEqual(data.success, false);
});


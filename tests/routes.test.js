import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

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

test('GET /api/health returns 200 and health object', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.status, 'ok');
});

test('POST /api/lead returns 400 for invalid body', async () => {
  const res = await fetch(`${baseUrl}/api/lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '' }),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.ok(data.errors.length > 0);
});

test('GET /unknown-route returns 404', async () => {
  const res = await fetch(`${baseUrl}/unknown-route`);
  assert.strictEqual(res.status, 404);
  const data = await res.json();
  assert.strictEqual(data.success, false);
});

test('PATCH /api/lead/123/status returns 401 when unauthorized', async () => {
  const res = await fetch(`${baseUrl}/api/lead/123/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.strictEqual(data.success, false);
});

test('PUT /api/leads/123 returns 401 when unauthorized', async () => {
  const res = await fetch(`${baseUrl}/api/leads/123`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Updated Name' }),
  });
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.strictEqual(data.success, false);
});


import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { validateNewsletterInput } from '../src/validations/newsletter.validation.js';

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

test('Newsletter validation accepts valid email', () => {
  const result = validateNewsletterInput({ email: 'User.Test+news@domain.co.uk', lang: 'fa' });
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.sanitizedData.email, 'user.test+news@domain.co.uk');
  assert.strictEqual(result.sanitizedData.lang, 'fa');
});

test('Newsletter validation rejects invalid email', () => {
  const result = validateNewsletterInput({ email: 'not-an-email' });
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.length > 0);
});

test('Newsletter validation catches bot honeypot submission', () => {
  const result = validateNewsletterInput({
    email: 'spammer@bot.com',
    hp_field: 'http://spam-link.ru',
  });
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.isBot, true);
});

test('Public POST /api/newsletter validates request body and rejects invalid email with 400', async () => {
  const res = await fetch(`${baseUrl}/api/newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'invalid-email' }),
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.success, false);
  assert.ok(data.errors.length > 0);
});

test('GET /api/newsletter returns 401 Unauthorized when no token is provided', async () => {
  const res = await fetch(`${baseUrl}/api/newsletter`);
  assert.strictEqual(res.status, 401);
});

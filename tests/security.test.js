import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeRegex,
  cleanString,
  isValidObjectId,
  isSafeString,
} from '../src/utils/sanitize.js';
import { validateObjectId } from '../src/middlewares/validate.middleware.js';
import { errorHandler } from '../src/middlewares/error.middleware.js';

test('escapeRegex properly escapes special characters to prevent ReDoS and regex crashes', () => {
  const dangerousInputs = [
    'test(group)',
    'user[a-z]',
    'wildcard.*+?',
    'dollar$and^caret',
    '{curly|braces}',
    'back\\slash',
  ];

  for (const input of dangerousInputs) {
    const escaped = escapeRegex(input);
    // Ensure new RegExp does not throw a syntax error
    assert.doesNotThrow(() => {
      new RegExp(escaped, 'i');
    });
  }

  // Non-strings return empty string safely
  assert.strictEqual(escapeRegex(null), '');
  assert.strictEqual(escapeRegex(undefined), '');
  assert.strictEqual(escapeRegex({}), '');
});

test('cleanString strips dangerous control characters and enforces length limits', () => {
  const dirty = 'Hello\u0000\u0008\u001F World \t\n ';
  const cleaned = cleanString(dirty, 20);
  assert.ok(!cleaned.includes('\u0000'));
  assert.ok(!cleaned.includes('\u0008'));
  assert.ok(!cleaned.includes('\u001F'));

  const longText = 'a'.repeat(300);
  const truncated = cleanString(longText, 100);
  assert.strictEqual(truncated.length, 100);

  assert.strictEqual(cleanString(12345), '');
});

test('isValidObjectId accepts only valid 24-character hexadecimal MongoDB IDs', () => {
  assert.strictEqual(isValidObjectId('507f1f77bcf86cd799439011'), true);
  assert.strictEqual(isValidObjectId('64c9f1a2e4b0a123456789ab'), true);

  // Invalid formats
  assert.strictEqual(isValidObjectId('123'), false);
  assert.strictEqual(isValidObjectId('not-an-object-id'), false);
  assert.strictEqual(isValidObjectId('507f1f77bcf86cd79943901z'), false); // 'z' is not hex
  assert.strictEqual(isValidObjectId('507f1f77bcf86cd79943901122'), false); // too long
  assert.strictEqual(isValidObjectId(null), false);
  assert.strictEqual(isValidObjectId(undefined), false);
  assert.strictEqual(isValidObjectId({}), false);
});

test('isSafeString detects primitive strings and flags potential NoSQL object injections', () => {
  assert.strictEqual(isSafeString('normal string'), true);
  assert.strictEqual(isSafeString(''), true);

  // Injected objects must be detected
  assert.strictEqual(isSafeString({ $ne: null }), false);
  assert.strictEqual(isSafeString({ $gt: '' }), false);
  assert.strictEqual(isSafeString(['admin']), false);
  assert.strictEqual(isSafeString(null), false);
  assert.strictEqual(isSafeString(undefined), false);
});

test('validateObjectId middleware permits valid IDs and blocks malformed IDs with 400', () => {
  const middleware = validateObjectId('id');

  // Case 1: Valid ObjectId calls next() without error
  let nextCalled = false;
  const validReq = { params: { id: '507f1f77bcf86cd799439011' } };
  const mockRes = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  middleware(validReq, mockRes, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true);

  // Case 2: Invalid ObjectId returns 400 Bad Request
  let nextCalledInvalid = false;
  const invalidReq = { params: { id: 'invalid-id' } };
  const mockResInvalid = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  middleware(invalidReq, mockResInvalid, () => {
    nextCalledInvalid = true;
  });
  assert.strictEqual(nextCalledInvalid, false);
  assert.strictEqual(mockResInvalid.statusCode, 400);
  assert.strictEqual(mockResInvalid.body.success, false);
});

test('errorHandler middleware correctly maps Mongoose CastError to 400 Bad Request', () => {
  const castErr = new Error('Cast to ObjectId failed');
  castErr.name = 'CastError';
  castErr.path = '_id';

  const mockRes = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  errorHandler(castErr, { method: 'GET', originalUrl: '/api/leads/bad' }, mockRes, () => {});

  assert.strictEqual(mockRes.statusCode, 400);
  assert.strictEqual(mockRes.body.success, false);
  assert.ok(mockRes.body.message.includes('Invalid format for field "_id"'));
});

test('errorHandler middleware correctly maps MongoDB duplicate key (11000) to 409 Conflict', () => {
  const dupErr = new Error('E11000 duplicate key error');
  dupErr.code = 11000;
  dupErr.keyValue = { email: 'duplicate@test.com' };

  const mockRes = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  errorHandler(dupErr, { method: 'POST', originalUrl: '/api/newsletter' }, mockRes, () => {});

  assert.strictEqual(mockRes.statusCode, 409);
  assert.strictEqual(mockRes.body.success, false);
  assert.ok(mockRes.body.message.includes('email already exists'));
});

test('errorHandler middleware correctly maps JWT errors to 401 Unauthorized', () => {
  const jwtErr = new Error('jwt malformed');
  jwtErr.name = 'JsonWebTokenError';

  const mockRes = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  errorHandler(jwtErr, { method: 'GET', originalUrl: '/api/leads' }, mockRes, () => {});

  assert.strictEqual(mockRes.statusCode, 401);
  assert.strictEqual(mockRes.body.success, false);
  assert.ok(mockRes.body.message.includes('Invalid authentication token'));
});

test('errorHandler middleware maps CORS policy rejections to 403 Forbidden', () => {
  const corsErr = new Error('Origin http://evil.com not allowed by CORS');
  corsErr.isCors = true;

  const mockRes = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  errorHandler(corsErr, { method: 'GET', originalUrl: '/api/leads' }, mockRes, () => {});

  assert.strictEqual(mockRes.statusCode, 403);
  assert.strictEqual(mockRes.body.success, false);
});

test('config provides separate local and production database URIs with accurate defaults', async () => {
  const { config } = await import('../src/config/env.js');

  assert.ok(config.mongodbUriLocal.includes('127.0.0.1:27017') || config.mongodbUriLocal.includes('localhost'));
  assert.ok(config.mongodbUriProd.includes('mongodb.net'));
  assert.strictEqual(typeof config.useProdDb, 'boolean');

  // In standard development, config.mongodbUri matches local URI
  if (!config.useProdDb) {
    assert.strictEqual(config.mongodbUri, config.mongodbUriLocal);
  } else {
    assert.strictEqual(config.mongodbUri, config.mongodbUriProd);
  }
});


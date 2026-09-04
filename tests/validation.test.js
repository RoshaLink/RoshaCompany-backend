import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLeadInput } from '../src/validations/lead.validation.js';

test('Lead validation accepts valid lead with email', () => {
  const input = {
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    company: 'Cyberdyne Resistance',
    service: 'Security Analysis',
    budget: '$10k+',
    message: 'Protect the future',
    lang: 'en',
    source: 'connect-with-us',
  };

  const result = validateLeadInput(input);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.sanitizedData.name, 'Sarah Connor');
  assert.strictEqual(result.sanitizedData.email, 'sarah@example.com');
});

test('Lead validation accepts valid lead with phone number', () => {
  const input = {
    name: 'John Doe',
    contact: '+46 70 123 4567',
    details: 'Need a quote',
  };

  const result = validateLeadInput(input);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.sanitizedData.name, 'John Doe');
  assert.strictEqual(result.sanitizedData.email, '+46 70 123 4567');
  assert.strictEqual(result.sanitizedData.message, 'Need a quote');
});

test('Lead validation rejects missing name and invalid contact', () => {
  const input = {
    name: ' ',
    email: 'invalid-email',
  };

  const result = validateLeadInput(input);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.length >= 2);
});

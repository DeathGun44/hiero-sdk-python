/**
 * Unit tests for the shared labels module.
 *
 * Run with: node --test .github/scripts/shared/labels.test.js
 * Requires Node >= 18 (built-in test runner, no framework dependencies).
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Helper: force a fresh require() by clearing the module cache.
// labels.js reads process.env at load time, so we must reload to test overrides.
function freshRequire() {
  const modulePath = require.resolve('./labels.js');
  delete require.cache[modulePath];
  return require('./labels.js');
}

describe('labels.js — default exports', () => {
  let labels;

  beforeEach(() => {
    // Clear any env overrides from previous tests
    delete process.env.BEGINNER_LABEL;
    delete process.env.INTERMEDIATE_LABEL;
    delete process.env.ADVANCED_LABEL;
    labels = freshRequire();
  });

  it('exports correct default BEGINNER_LABEL', () => {
    assert.equal(labels.BEGINNER_LABEL, 'skill: beginner');
  });

  it('exports correct default INTERMEDIATE_LABEL', () => {
    assert.equal(labels.INTERMEDIATE_LABEL, 'skill: intermediate');
  });

  it('exports correct default ADVANCED_LABEL', () => {
    assert.equal(labels.ADVANCED_LABEL, 'skill: advanced');
  });

  it('exports DIFFICULTY_LABELS array with all three', () => {
    assert.equal(labels.DIFFICULTY_LABELS.length, 3);
    assert.ok(labels.DIFFICULTY_LABELS.includes('skill: beginner'));
    assert.ok(labels.DIFFICULTY_LABELS.includes('skill: intermediate'));
    assert.ok(labels.DIFFICULTY_LABELS.includes('skill: advanced'));
  });
});

describe('labels.js — isSafeLabel', () => {
  let isSafeLabel;

  beforeEach(() => {
    delete process.env.BEGINNER_LABEL;
    delete process.env.INTERMEDIATE_LABEL;
    delete process.env.ADVANCED_LABEL;
    isSafeLabel = freshRequire().isSafeLabel;
  });

  it('accepts "skill: beginner"', () => {
    assert.ok(isSafeLabel('skill: beginner'));
  });

  it('accepts "skill: intermediate"', () => {
    assert.ok(isSafeLabel('skill: intermediate'));
  });

  it('accepts "skill: advanced"', () => {
    assert.ok(isSafeLabel('skill: advanced'));
  });

  it('accepts "Good First Issue"', () => {
    assert.ok(isSafeLabel('Good First Issue'));
  });

  it('accepts simple alphanumeric labels', () => {
    assert.ok(isSafeLabel('beginner'));
    assert.ok(isSafeLabel('scope/CI'));
  });

  it('rejects empty string', () => {
    assert.equal(isSafeLabel(''), false);
  });

  it('rejects string with semicolon (injection)', () => {
    assert.equal(isSafeLabel('label; DROP TABLE'), false);
  });

  it('rejects string with double quotes', () => {
    assert.equal(isSafeLabel('label"injection'), false);
  });

  it('rejects string with newline', () => {
    assert.equal(isSafeLabel('label\ninjection'), false);
  });

  it('rejects non-string input', () => {
    assert.equal(isSafeLabel(null), false);
    assert.equal(isSafeLabel(undefined), false);
    assert.equal(isSafeLabel(42), false);
  });
});

describe('labels.js — environment variable overrides', () => {
  it('overrides BEGINNER_LABEL from env', () => {
    process.env.BEGINNER_LABEL = 'custom: beginner';
    const labels = freshRequire();
    assert.equal(labels.BEGINNER_LABEL, 'custom: beginner');
    assert.ok(labels.DIFFICULTY_LABELS.includes('custom: beginner'));
    delete process.env.BEGINNER_LABEL;
  });

  it('overrides INTERMEDIATE_LABEL from env', () => {
    process.env.INTERMEDIATE_LABEL = 'custom: intermediate';
    const labels = freshRequire();
    assert.equal(labels.INTERMEDIATE_LABEL, 'custom: intermediate');
    delete process.env.INTERMEDIATE_LABEL;
  });

  it('overrides ADVANCED_LABEL from env', () => {
    process.env.ADVANCED_LABEL = 'custom: advanced';
    const labels = freshRequire();
    assert.equal(labels.ADVANCED_LABEL, 'custom: advanced');
    delete process.env.ADVANCED_LABEL;
  });

  it('trims whitespace from env values', () => {
    process.env.BEGINNER_LABEL = '  padded label  ';
    const labels = freshRequire();
    assert.equal(labels.BEGINNER_LABEL, 'padded label');
    delete process.env.BEGINNER_LABEL;
  });
});

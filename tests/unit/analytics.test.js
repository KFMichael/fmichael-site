const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldTrack } = require('../../js/analytics.js');

const ok = { hostname: 'fmichael.cloud', doNotTrack: false, optedOut: false };

test('analytics : actif sur fmichael.cloud et www', () => {
  assert.equal(shouldTrack(ok), true);
  assert.equal(shouldTrack({ ...ok, hostname: 'www.fmichael.cloud' }), true);
});

test('analytics : jamais en local, ni sur une autre adresse', () => {
  assert.equal(shouldTrack({ ...ok, hostname: 'localhost' }), false);
  assert.equal(shouldTrack({ ...ok, hostname: 'kfmichael.github.io' }), false);
  assert.equal(shouldTrack({ ...ok, hostname: 'evil-fmichael.cloud' }), false);
});

test('analytics : jamais avec « Do Not Track » ni pour un navigateur exclu', () => {
  assert.equal(shouldTrack({ ...ok, doNotTrack: true }), false);
  assert.equal(shouldTrack({ ...ok, optedOut: true }), false);
});

const assert = require('node:assert/strict');
const xcode = require('xcode');
// xcode uses the CommonJS uuid.v4 API to produce 24-character PBX identifiers.
const project = xcode.project('compatibility.pbxproj');
project.hash = { project: { objects: {} } };
const ids = Array.from({ length: 1000 }, () => project.generateUuid());
assert.ok(ids.every(id => /^[A-F0-9]{24}$/.test(id)));
assert.equal(new Set(ids).size, ids.length);
console.log('Build dependency UUID compatibility passed.');

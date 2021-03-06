/*<replacement>*/
var bufferShim = require('safe-buffer').Buffer;
/*</replacement>*/

var common = require('../common');
var assert = require('assert/');
var stream = require('../../');

var writable = new stream.Writable();

writable._writev = common.mustCall(function (chunks, cb) {
  assert.strictEqual(chunks.length, 2, 'two chunks to write');
  cb();
}, 1);

writable._write = common.mustCall(function (chunk, encoding, cb) {
  cb();
}, 1);

// first cork
writable.cork();
assert.strictEqual(writable._writableState.corked, 1);
assert.strictEqual(writable._writableState.bufferedRequestCount, 0);

// cork again
writable.cork();
assert.strictEqual(writable._writableState.corked, 2);

// the first chunk is buffered
writable.write('first chunk');
assert.strictEqual(writable._writableState.bufferedRequestCount, 1);

// first uncork does nothing
writable.uncork();
assert.strictEqual(writable._writableState.corked, 1);
assert.strictEqual(writable._writableState.bufferedRequestCount, 1);

process.nextTick(uncork);

// the second chunk is buffered, because we uncork at the end of tick
writable.write('second chunk');
assert.strictEqual(writable._writableState.corked, 1);
assert.strictEqual(writable._writableState.bufferedRequestCount, 2);

function uncork() {
  // second uncork flushes the buffer
  writable.uncork();
  assert.strictEqual(writable._writableState.corked, 0);
  assert.strictEqual(writable._writableState.bufferedRequestCount, 0);

  // verify that end() uncorks correctly
  writable.cork();
  writable.write('third chunk');
  writable.end();

  // end causes an uncork() as well
  assert.strictEqual(writable._writableState.corked, 0);
  assert.strictEqual(writable._writableState.bufferedRequestCount, 0);
}
import assert from 'node:assert/strict';
import { setup, native, grammarNative, functionCase, parseDeep, disposeTrees } from './load.mjs';
import { records } from '../../../../../packages/rust/src/records.ts';
import { TSKindId } from '../../../../../packages/rust/src/kinds.ts';

assert.equal(typeof native.registerArena, 'function');
assert.equal(native.heldArenaReferences(), 0);

function registeredFixture(retainArrays = false) {
  const { store, build } = setup('arena');
  const root = functionCase(build, 'held');
  const at = store.identity(root);
  const packet = store.packet();
  const expected = native.renderBuilt(packet.chunks, packet.strings, at).text;
  return {
    owner: native.registerArena(packet.chunks, packet.strings),
    at,
    expected,
    count: packet.chunks.length + packet.strings.length,
    weak: new WeakRef(packet.chunks[0]),
    arrays: retainArrays ? packet : undefined
  };
}

async function settle() {
  await new Promise(setImmediate);
  global.gc?.();
  await new Promise(setImmediate);
}

const held = registeredFixture();
await settle();
assert(held.weak.deref());
assert.equal(held.owner.render(held.at).text, held.expected);
assert.equal(native.heldArenaReferences(), held.count);
held.owner.dispose();
held.owner.dispose();
assert.equal(native.heldArenaReferences(), 0);
assert.throws(() => held.owner.render(held.at), /released/);

registeredFixture();
for (let attempt = 0; attempt < 20 && native.heldArenaReferences() !== 0; attempt++) await settle();
assert.equal(native.heldArenaReferences(), 0, 'GC releases registration references');

const mutable = registeredFixture(true);
const firstChunk = mutable.arrays!.chunks[0];
const word = mutable.at % 2 ** grammarNative.ARENA_CHUNK_SHIFT;
const kind = firstChunk[word];
firstChunk[word] = 65535;
assert.throws(() => mutable.owner.render(mutable.at));
firstChunk[word] = kind;
assert.equal(mutable.owner.render(mutable.at).text, mutable.expected);
mutable.owner.dispose();

const detached = registeredFixture(true);
structuredClone(detached.arrays!.chunks[0].buffer, { transfer: [detached.arrays!.chunks[0].buffer] });
assert.throws(() => detached.owner.render(detached.at));
detached.owner.dispose();
assert.equal(native.heldArenaReferences(), 0);
assert.throws(() => native.registerArena([new Uint32Array(new SharedArrayBuffer(16))], []), /ordinary/);
assert.throws(
  () => native.registerArena([new Uint32Array(2)], [new Uint8Array(new SharedArrayBuffer(16))]),
  /ordinary/
);
assert.equal(native.heldArenaReferences(), 0, 'failed registration retains no buffers');

const packetSource = registeredFixture(true);
packetSource.owner.dispose();
const sourcePacket = packetSource.arrays!;
const shiftedWords = sourcePacket.chunks.map((chunk) => {
  const padded = new Uint32Array(chunk.length + 2);
  padded.set(chunk, 1);
  return padded.subarray(1, chunk.length + 1);
});
const shiftedStrings = sourcePacket.strings.map((chunk) => {
  const padded = new Uint8Array(chunk.length + 4);
  padded.set(chunk, 3);
  return padded.subarray(3, chunk.length + 3);
});
const shiftedOwner = native.registerArena(shiftedWords, shiftedStrings);
assert.equal(shiftedOwner.render(packetSource.at).text, packetSource.expected);
shiftedOwner.dispose();
const resizable = new ArrayBuffer(sourcePacket.chunks[0].byteLength, {
  maxByteLength: sourcePacket.chunks[0].byteLength + 16
});
new Uint32Array(resizable).set(sourcePacket.chunks[0]);
const resizedOwner = native.registerArena([new Uint32Array(resizable)], sourcePacket.strings);
assert.equal(resizedOwner.render(packetSource.at).text, packetSource.expected);
resizable.resize(0);
assert.throws(() => resizedOwner.render(packetSource.at));
resizedOwner.dispose();
assert.equal(native.heldArenaReferences(), 0);

for (const open of [-1, 0.5, sourcePacket.chunks.length, Infinity]) {
  assert.throws(() => native.registerArena(sourcePacket.chunks, sourcePacket.strings, open));
}
assert.equal(native.heldArenaReferences(), 0, 'invalid open indices retain no buffers');
const growing = native.registerArena(sourcePacket.chunks, sourcePacket.strings, 0, 0);
const renderPrefix = (words = sourcePacket.chunks[0].length, bytes = sourcePacket.strings[0].length) =>
  growing.render(packetSource.at, undefined, undefined, words, bytes);
assert.equal(renderPrefix().text, packetSource.expected);
assert.equal(
  growing.renderRecord(packetSource.at, sourcePacket.chunks[0].length, sourcePacket.strings[0].length).text,
  packetSource.expected
);
assert.throws(() => growing.renderRecord(packetSource.at, 0.5, sourcePacket.strings[0].length), /exact u32/);
assert.throws(() => growing.render(packetSource.at), /written length/);
assert.throws(() => renderPrefix(0));
assert.throws(() => renderPrefix(undefined, 0));
assert.throws(() => renderPrefix(sourcePacket.chunks[0].length + 1), /written prefix/);
assert.throws(() => renderPrefix(0.5), /exact u32/);
growing.dispose();

const sparseOwner = native.registerArena(
  [...sourcePacket.chunks, ...Array.from({ length: 63 }, () => new Uint32Array(1))],
  [...sourcePacket.strings, ...Array.from({ length: 63 }, () => new Uint8Array(0))]
);
const compactOwner = native.registerArena(sourcePacket.chunks, sourcePacket.strings);
const compactRender = compactOwner.render(packetSource.at);
compactOwner.dispose();
const chunkReads = native.arenaChunkReadCount();
const sparseRender = sparseOwner.render(packetSource.at);
assert.equal(sparseRender.text, packetSource.expected);
assert.equal(native.arenaChunkReadCount() - chunkReads, 2, 'render acquires only the referenced word and UTF-8 chunks');
assert.equal(sparseRender.allocatedBytes, compactRender.allocatedBytes, 'unused chunks add no per-render allocation');
sparseOwner.dispose();

const registrationCount = native.arenaRegistrationCount();
(() => {
  const { build } = setup('arena', 16_384);
  let first;
  for (let index = 0; index < 100; index++) {
    const root = functionCase(build, `interleaved${index}`);
    first ??= root;
    assert.match(root.render().text, new RegExp(`interleaved${index}\\(`));
  }
  assert.match(first.render().text, /interleaved0\(/);
})();
assert.equal(native.arenaRegistrationCount() - registrationCount, 1, 'appending within chunks reuses registration');
await settle();
assert.equal(native.heldArenaReferences(), 0);

const output: Record<string, string[]> = {};
const allocationCalls: Record<string, number> = {};
for (const mode of ['object', 'arena']) {
  const allocationRoot = functionCase(setup(mode).build, 'alloc');
  allocationRoot.render();
  allocationCalls[mode] = allocationRoot.render().allocationCalls;
  const { store, build } = setup(mode, 16);
  const name = build.identifier('shared');
  const parameters = build.parameters();
  const body = build.block({ trailing_expression: build.identifier('x') });
  const first = build.function_item({ name, parameters, body });
  const second = build.function_item({ name, parameters, body });
  const original = first.render().text;
  const renamed = name.$with.text('renamed');
  assert.notEqual(store.identity(name), store.identity(renamed));
  assert.equal(first.name().text(), 'shared');
  assert.equal(second.name().text(), 'shared');
  const replaced = first.$with.name(renamed);
  assert.notEqual(store.identity(first), store.identity(replaced));
  assert.equal(store.identity(replaced.parameters()), store.identity(parameters));
  assert.equal(store.identity(replaced.body()), store.identity(body));
  assert.equal(first.render().text, original);
  assert.equal(second.render().text, original);
  assert.match(replaced.render().text, /renamed/);
  const changedBody = body.$with.trailing_expression(build.identifier('y'));
  assert.equal(first.body().trailing_expression().text(), 'x');
  assert.equal(second.body().trailing_expression().text(), 'x');
  const changedParent = first.$with.body(changedBody);
  assert.equal(changedParent.body().trailing_expression().text(), 'y');
  assert.equal(store.identity(changedParent.name()), store.identity(name));

  const beforeRefusal = store.records;
  assert.throws(() => first.$with.body(name), /not admitted/);
  assert.throws(() => build.function_item({ parameters, body }), /required/);
  assert.equal(store.records, beforeRefusal);
  assert.throws(() => first.$with.name(setup(mode).build.identifier('foreign')), /another storage owner/);

  const unicode = functionCase(build, 'café');
  assert.equal(unicode.name().text(), 'café');
  const modifiers = build.function_modifiers({ modifier: [TSKindId.AsyncKeyword] });
  const modified = unicode.$with.function_modifiers(modifiers);
  assert.deepEqual(modified.function_modifiers().modifier(), [TSKindId.AsyncKeyword]);
  const type = build.type_identifier({ content: build.identifier('T') });
  const parameter = build.parameter({ mutable: true, name: build.identifier('x'), type });
  assert.equal(parameter.mutable(), true);

  assert.equal(name.render().text, 'shared');
  for (const node of [first, second, replaced, changedParent, unicode, modified])
    disposeTrees([parseDeep(node.render().text)]);
  disposeTrees([parseDeep(`fn parameter_test(${parameter.render().text}) {}`)]);
  assert.equal(parameter.$with.mutable(false).mutable(), false);
  const cleared = parameter.$with.mutable(undefined);
  assert.equal(cleared.mutable(), false);
  assert.equal(cleared.render().text, parameter.$with.mutable(false).render().text);
  disposeTrees([parseDeep(`fn parameter_test(${cleared.render().text}) {}`)]);
  assert.equal(parameter.mutable(), true);

  output[mode] = [first, second, replaced, changedParent, unicode, modified, parameter, cleared].map(
    (node) => node.render().text
  );
  const beforeGrowth = mode === 'arena' ? store.packet() : undefined;
  const retainedWords = beforeGrowth?.chunks.map((chunk) => Uint32Array.from(chunk));
  for (let i = 0; i < 10_000; i++) functionCase(build, `f${i}`);
  assert.equal(first.render().text, original);
  if (mode === 'arena' && beforeGrowth !== undefined && retainedWords !== undefined) {
    const afterGrowth = store.packet();
    assert(afterGrowth.chunks.length > beforeGrowth.chunks.length);
    for (let n = 0; n < beforeGrowth.chunks.length; n++) {
      assert.equal(afterGrowth.chunks[n].buffer, beforeGrowth.chunks[n].buffer);
      assert.deepEqual(beforeGrowth.chunks[n], retainedWords[n]);
    }
    const copy = afterGrowth.chunks.map((chunk) => Uint32Array.from(chunk));
    const at = store.identity(first);
    const shift = grammarNative.ARENA_CHUNK_SHIFT;
    const chunk = Math.floor(at / 2 ** shift);
    const word = at % 2 ** shift;
    copy[chunk][word + records.FunctionItemNode.body.word] = 0xffffffff;
    assert.throws(() => native.renderBuilt(copy, afterGrowth.strings, at), /tag|record|cell/);
    const shared = afterGrowth.chunks.map((chunk) => new Uint32Array(new SharedArrayBuffer(chunk.byteLength)));
    shared.forEach((chunk, index) => chunk.set(afterGrowth.chunks[index]));
    assert.throws(() => native.renderBuilt(shared, afterGrowth.strings, at), /ordinary ArrayBuffer/);
    assert.throws(() => native.renderBuilt(afterGrowth.chunks, afterGrowth.strings, 0), /root/);
    for (const invalid of [-1, 0.5, 2 ** 32 + at, NaN, Infinity])
      assert.throws(() => native.renderBuilt(afterGrowth.chunks, afterGrowth.strings, invalid), /exact u32/);
    const offsetChunks = afterGrowth.chunks.map((chunk) => {
      const value = new Uint32Array(new ArrayBuffer(chunk.byteLength + 8), 4, chunk.length);
      value.set(chunk);
      return value;
    });
    assert.equal(native.renderBuilt(offsetChunks, afterGrowth.strings, at).text, original);
    assert.throws(
      () =>
        native.renderBuilt(
          afterGrowth.chunks.map((chunk) => new Uint8Array(chunk.buffer)),
          afterGrowth.strings,
          at
        ),
      /expected typed array/
    );
  }
  console.log(JSON.stringify({ mode, memory: store.memory() }));
}
assert.deepEqual(output.arena, output.object);
assert(
  allocationCalls.arena <= allocationCalls.object,
  `empty-function arena render allocates ${allocationCalls.arena} times versus ${allocationCalls.object} for objects`
);
const width = 2 ** grammarNative.ARENA_CHUNK_SHIFT;
const { build: boundary } = setup('arena', width);
boundary.identifier('x');
const full = boundary.identifier('世'.repeat((width - 1) / 3));
assert.equal(full.text().length, (width - 1) / 3);
const empty = boundary.identifier('');
assert.equal(empty.text(), '');
assert.equal(empty.render().text, '');
const { build: runs } = setup('arena');
const unitCount = Math.floor(width / 5) + 2;
const long = runs.function_modifiers({ modifier: Array(unitCount).fill(TSKindId.AsyncKeyword) });
assert.equal(long.modifier().length, unitCount);
assert.equal(long.render().text.split('async').length - 1, unitCount);
console.log(
  JSON.stringify({
    verified: true,
    pairedRenders: output.arena.length,
    receiverAndAncestorSemantics: true,
    retainedAcrossBuilds: 10_000
  })
);

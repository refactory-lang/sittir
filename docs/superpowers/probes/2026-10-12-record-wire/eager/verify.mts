import assert from 'node:assert/strict';
import { setup, native, grammarNative, functionCase, parseDeep, disposeTrees } from './load.mjs';
import { records } from '../../../../../packages/rust/src/records.ts';
import { TSKindId } from '../../../../../packages/rust/src/kinds.ts';

const output: Record<string, string[]> = {};
for (const mode of ['object', 'arena']) {
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

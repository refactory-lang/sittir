// What a built three-slot node costs to construct under three representations.
// Plain node, no transpiler, so no per-closure name helper.
import { performance } from 'node:perf_hooks';

// (A) today's shape: storage object, then methods bound per node as non-enumerable closures.
function buildClosures(left, operator, right, engine) {
  const node = { $type: 311, _left: left, _operator: operator, _right: right };
  const def = (key, value) => Object.defineProperty(node, key, { value, enumerable: false, writable: true, configurable: true });
  def('left', () => node._left);
  def('operator', () => node._operator);
  def('right', () => node._right);
  def('$with', {
    left: (v) => buildClosures(v, node._operator, node._right, engine),
    operator: (v) => buildClosures(node._left, v, node._right, engine),
    right: (v) => buildClosures(node._left, node._operator, v, engine)
  });
  def('$render', () => engine.render(node));
  def('$toEdit', (range) => engine.toEdit(node, range));
  def('$replace', (target) => engine.replace(node, target));
  Object.defineProperty(node, '$trivia', { get: () => engine.trivia(node), enumerable: false, configurable: true });
  def('$engine', () => engine);
  return node;
}

// (B) storage fields on the object, methods on a per-kind prototype.
class BinaryExpression {
  constructor(left, operator, right, engine) {
    this.$type = 311; this._left = left; this._operator = operator; this._right = right; this.$e = engine;
  }
  left() { return this._left; }
  operator() { return this._operator; }
  right() { return this._right; }
  get $with() { return new BinaryWith(this); }
  $render() { return this.$e.render(this); }
  $engine() { return this.$e; }
}
class BinaryWith {
  constructor(node) { this.node = node; }
  left(v) { const n = this.node; return new BinaryExpression(v, n._operator, n._right, n.$e); }
}

// (C) record in a chunk of shared memory, node is a view of (chunk, offset).
const TAG_NODE = 1 << 29, TAG_KIND = 5 << 29;
class Chunk {
  constructor(words) { this.words = new Uint32Array(words); this.next = 1; this.deps = []; }
}
class Arena {
  constructor(engine) { this.engine = engine; this.chunk = new Chunk(1 << 16); }
  bump(n) {
    let chunk = this.chunk;
    if (chunk.next + n > chunk.words.length) chunk = this.chunk = new Chunk(1 << 16);
    const at = chunk.next; chunk.next = at + n; return at;
  }
  ref(view) {
    const chunk = this.chunk;
    if (view.chunk === chunk) return TAG_NODE | view.at;
    let dep = chunk.deps.indexOf(view.chunk);
    if (dep < 0) dep = chunk.deps.push(view.chunk) - 1;
    return TAG_NODE | ((dep + 1) << 20) | view.at;
  }
}
class BinaryView {
  constructor(arena, chunk, at) { this.arena = arena; this.chunk = chunk; this.at = at; }
  left() { return deref(this, this.chunk.words[this.at + 4]); }
  right() { return deref(this, this.chunk.words[this.at + 6]); }
  $engine() { return this.arena.engine; }
}
function deref(owner, word) {
  const dep = (word >>> 20) & 0x1ff;
  const chunk = dep === 0 ? owner.chunk : owner.chunk.deps[dep - 1];
  return new BinaryView(owner.arena, chunk, word & 0xfffff);
}
function buildRecord(arena, left, operatorKind, right) {
  const at = arena.bump(7); // kind, trivia, edge before, edge after, 3 slots
  const chunk = arena.chunk; const w = chunk.words;
  w[at] = 311; w[at + 1] = 0; w[at + 2] = 0; w[at + 3] = 0;
  w[at + 4] = arena.ref(left); w[at + 5] = TAG_KIND | operatorKind; w[at + 6] = arena.ref(right);
  return new BinaryView(arena, chunk, at);
}

function perCall(n, fn) {
  for (let i = 0; i < 200000; i++) fn();
  const t0 = performance.now(); let keep;
  for (let i = 0; i < n; i++) keep = fn();
  void keep;
  return ((performance.now() - t0) / n) * 1e6;
}
const engine = { render() {}, toEdit() {}, replace() {}, trivia() {} };
const N = 3_000_000;
const la = buildClosures(1, 2, 3, engine), lb = new BinaryExpression(1, 2, 3, engine);
const arena = new Arena(engine);
const lc = buildRecord(arena, { chunk: arena.chunk, at: 0 }, 2, { chunk: arena.chunk, at: 0 });
console.log(`(A) storage object + per-node closures: ${perCall(N, () => buildClosures(la, 80, la, engine)).toFixed(0)} ns per node`);
console.log(`(B) object fields + per-kind prototype: ${perCall(N, () => new BinaryExpression(lb, 80, lb, engine)).toFixed(0)} ns per node`);
console.log(`(C) record in shared memory + view:     ${perCall(N, () => buildRecord(arena, lc, 80, lc)).toFixed(0)} ns per node`);
console.log(`    reading a child back through a view: ${perCall(N, () => lc.left()).toFixed(0)} ns`);
console.log(`    $with on (B): ${perCall(N, () => lb.$with.left(lb)).toFixed(0)} ns`);

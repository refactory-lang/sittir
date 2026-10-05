// How a per-kind prototype is attached, and what each way costs to build and to call.
// Plain node. Every built object escapes into a ring buffer so nothing is optimized away.
import { performance } from 'node:perf_hooks';

const sink = new Array(1024);
function perCall(n, fn) {
  for (let i = 0; i < 300000; i++) sink[i & 1023] = fn(i);
  const t0 = performance.now();
  for (let i = 0; i < n; i++) sink[i & 1023] = fn(i);
  return ((performance.now() - t0) / n) * 1e6;
}
const engine = { render() {}, toEdit() {}, replace() {}, trivia() {} };
const handle = { current: engine };

// today: methods bound per node
function closures(left, operator, right) {
  const node = { $type: 311, _left: left, _operator: operator, _right: right };
  const def = (key, value) => Object.defineProperty(node, key, { value, enumerable: false, writable: true, configurable: true });
  def('left', () => node._left); def('operator', () => node._operator); def('right', () => node._right);
  def('$with', { left: (v) => closures(v, node._operator, node._right), operator: (v) => closures(node._left, v, node._right), right: (v) => closures(node._left, node._operator, v) });
  def('$render', () => engine.render(node)); def('$toEdit', (r) => engine.toEdit(node, r)); def('$replace', (t) => engine.replace(node, t));
  Object.defineProperty(node, '$trivia', { get: () => engine.trivia(node), enumerable: false, configurable: true });
  def('$engine', () => handle.current);
  return node;
}

// a class
class Binary {
  #handle;
  constructor(left, operator, right, h) { this.$type = 311; this._left = left; this._operator = operator; this._right = right; this.#handle = h; }
  left() { return this._left; } operator() { return this._operator; } right() { return this._right; }
  $engine() { return this.#handle.current; }
}

// a plain prototype object, shared by every node of the kind
const binaryProto = {
  left() { return this._left; }, operator() { return this._operator; }, right() { return this._right; },
  $engine() { return this.$handle.current; }
};
// one small prototype per kind per engine: the engine handle rides the chain, no per-node field
const enginedProto = Object.create(binaryProto, { $handle: { value: handle, enumerable: false } });

const viaLiteral = (l, o, r) => ({ __proto__: enginedProto, $type: 311, _left: l, _operator: o, _right: r });
const viaCreate = (l, o, r) => { const n = Object.create(enginedProto); n.$type = 311; n._left = l; n._operator = o; n._right = r; return n; };
const viaSetProto = (l, o, r) => Object.setPrototypeOf({ $type: 311, _left: l, _operator: o, _right: r }, enginedProto);
function BinaryFn(l, o, r) { this.$type = 311; this._left = l; this._operator = o; this._right = r; }
BinaryFn.prototype = enginedProto;
const viaSpread = (node, v) => ({ __proto__: enginedProto, ...node, _left: v });

const N = 5_000_000;
const leaf = viaLiteral(1, 2, 3);
const rows = [
  ['today: storage object, methods bound per node', (i) => closures(leaf, i, leaf)],
  ['class with a private handle field', (i) => new Binary(leaf, i, leaf, handle)],
  ['literal with __proto__', (i) => viaLiteral(leaf, i, leaf)],
  ['Object.create(proto) then assign', (i) => viaCreate(leaf, i, leaf)],
  ['literal then Object.setPrototypeOf', (i) => viaSetProto(leaf, i, leaf)],
  ['constructor function with .prototype = proto', (i) => new BinaryFn(leaf, i, leaf)],
  ['$with as a spread literal with __proto__', (i) => viaSpread(leaf, i)]
];
console.log('build one three-slot node:');
for (const [label, fn] of rows) console.log(`  ${perCall(N, fn).toFixed(0).padStart(5)} ns  ${label}`);

// calling a method
const a = closures(leaf, 2, leaf), b = new Binary(leaf, 2, leaf, handle), c = viaLiteral(leaf, 2, leaf);
let acc = 0;
const call = (label, fn) => { for (let i = 0; i < 300000; i++) acc += fn(); const t0 = performance.now(); for (let i = 0; i < N; i++) acc += fn(); console.log(`  ${(((performance.now() - t0) / N) * 1e6).toFixed(1).padStart(5)} ns  ${label}`); };
console.log('call an accessor (same kind at the call site):');
call('per-node closure', () => a.operator());
call('class method', () => b.operator());
call('prototype method', () => c.operator());
call('engine through the prototype chain', () => (c.$engine() === engine ? 1 : 0));

// one generic accessor shared by every kind and slot, built in a loop from a slot table
const KINDS = 60;
const protos = [];
const make = (key) => function () { return this[key]; };
for (let k = 0; k < KINDS; k++) {
  const proto = {};
  for (const slot of ['left', 'operator', 'right']) proto[slot] = make(`_${slot}`);
  protos.push(proto);
}
const many = protos.map((proto, k) => { const n = Object.create(proto); for (let j = 0; j <= k % 7; j++) n[`$pad${j}`] = j; n.$type = k; n._left = 1; n._operator = 2; n._right = 3; return n; });
call(`one loop-built accessor shared across ${KINDS} kinds`, () => many[(acc & 0xffff) % KINDS].operator());
// the same kinds, each with its own written-out method
const written = many.map((n, k) => { const proto = { operator: new Function('return this._operator;') }; const m = Object.create(proto); Object.assign(m, n); return m; });
call(`a written-out method per kind, ${KINDS} kinds at one site`, () => written[(acc & 0xffff) % KINDS].operator());

// Where the saving comes from: creating the functions once (consts), and not attaching them per node (prototype).
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
const CONFIG = Symbol('config');

// 1. today: functions created per node, attached per node
function today(config) {
  const _left = config.left, _operator = config.operator, _right = config.right;
  const node = { $type: 311, _left, _operator, _right,
    $with: { left: (v) => today({ ...config, left: v }), operator: (v) => today({ ...config, operator: v }), right: (v) => today({ ...config, right: v }) } };
  const def = (key, value) => Object.defineProperty(node, key, { value, enumerable: false, writable: true, configurable: true });
  def('left', () => _left); def('operator', () => _operator); def('right', () => _right);
  def('$render', () => engine.render(node)); def('$toEdit', (r) => engine.toEdit(node, r)); def('$replace', (t) => engine.replace(node, t));
  Object.defineProperty(node, '$trivia', { get: () => engine.trivia(node), enumerable: false, configurable: true });
  def('$engine', () => handle.current);
  return node;
}

// the functions, written once
function left() { return this._left; }
function operator() { return this._operator; }
function right() { return this._right; }
function $render() { return this.$handle.current.render(this); }
function $toEdit(r) { return this.$handle.current.toEdit(this, r); }
function $replace(t) { return this.$handle.current.replace(this, t); }
function $engine() { return this.$handle.current; }
const setters = {
  left(v) { return viaProto({ ...this.node[CONFIG], left: v }); },
  operator(v) { return viaProto({ ...this.node[CONFIG], operator: v }); },
  right(v) { return viaProto({ ...this.node[CONFIG], right: v }); }
};
function $with() { const w = Object.create(setters); w.node = this; return w; }
function $trivia() { return this.$handle.current.trivia(this); }

// 2. consts only: the same functions, still attached to every node as non-enumerable own properties
const hidden = (value) => ({ value, enumerable: false, writable: true, configurable: true });
const DESCRIPTORS = {
  left: hidden(left), operator: hidden(operator), right: hidden(right),
  $render: hidden($render), $toEdit: hidden($toEdit), $replace: hidden($replace), $engine: hidden($engine),
  $with: { get: $with, enumerable: false, configurable: true }, $trivia: { get: $trivia, enumerable: false, configurable: true },
  $handle: hidden(handle)
};
function constsAttached(config) {
  const node = { $type: 311, _left: config.left, _operator: config.operator, _right: config.right };
  node[CONFIG] = config;
  return Object.defineProperties(node, DESCRIPTORS);
}

// 3. consts on a prototype: nothing attached per node
const proto = Object.create(null, DESCRIPTORS);
function viaProto(config) {
  const node = Object.create(proto);
  node.$type = 311; node._left = config.left; node._operator = config.operator; node._right = config.right;
  node[CONFIG] = config;
  return node;
}

const N = 4_000_000;
const leaf = viaProto({ left: 1, operator: 2, right: 3 });
const cfg = (i) => ({ left: leaf, operator: i, right: leaf });
console.log('build one three-slot node (the config object is allocated in every row):');
console.log(`  ${perCall(N, (i) => today(cfg(i))).toFixed(0).padStart(5)} ns  today: functions created and attached per node`);
console.log(`  ${perCall(N, (i) => constsAttached(cfg(i))).toFixed(0).padStart(5)} ns  functions written once, still attached to each node`);
console.log(`  ${perCall(N, (i) => viaProto(cfg(i))).toFixed(0).padStart(5)} ns  functions written once, on a prototype`);
const built = viaProto(cfg(7));
console.log(`  ${perCall(N, (i) => built.$with.left(leaf)).toFixed(0).padStart(5)} ns  $with.left on the prototype version (rebuild from the kept config)`);
const old = today(cfg(7));
console.log(`  ${perCall(N, (i) => old.$with.left(leaf)).toFixed(0).padStart(5)} ns  $with.left today`);
console.log('keys seen by Object.keys / JSON:', Object.keys(built).join(','), JSON.stringify(built).length > 0);

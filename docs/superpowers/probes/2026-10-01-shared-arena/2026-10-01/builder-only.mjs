// The builder's own part, withMethods set aside: literal + withAccessors today,
// against the same node with only its getters moved to a per-kind prototype.
import { performance } from 'node:perf_hooks';
const sink = new Array(1024);
function perCall(n, fn) {
  for (let i = 0; i < 300000; i++) sink[i & 1023] = fn(i);
  const t0 = performance.now();
  for (let i = 0; i < n; i++) sink[i & 1023] = fn(i);
  return ((performance.now() - t0) / n) * 1e6;
}
function withAccessors(node, accessors) {
  for (const key of Object.keys(accessors)) {
    Object.defineProperty(node, key, { value: accessors[key], enumerable: false, writable: true, configurable: true });
  }
  return node;
}
function today(config) {
  const _left = config.left, _operator = config.operator, _right = config.right;
  return withAccessors(
    {
      $type: 311, $source: 2, $named: true, _left, _operator, _right,
      $with: {
        left: (value) => today({ ...config, left: value }),
        operator: (value) => today({ ...config, operator: value }),
        right: (value) => today({ ...config, right: value })
      }
    },
    { left: () => _left, operator: () => _operator, right: () => _right }
  );
}
const BinaryExpressionAccessors = {
  left() { return this._left; },
  operator() { return this._operator; },
  right() { return this._right; }
};
function gettersOnPrototype(config) {
  const node = Object.create(BinaryExpressionAccessors);
  node.$type = 311; node.$source = 2; node.$named = true;
  node._left = config.left; node._operator = config.operator; node._right = config.right;
  node.$with = {
    left: (value) => gettersOnPrototype({ ...config, left: value }),
    operator: (value) => gettersOnPrototype({ ...config, operator: value }),
    right: (value) => gettersOnPrototype({ ...config, right: value })
  };
  return node;
}
const N = 5_000_000;
const leaf = gettersOnPrototype({ left: 1, operator: 2, right: 3 });
const cfg = (i) => ({ left: leaf, operator: i, right: leaf });
console.log(`${perCall(N, (i) => today(cfg(i))).toFixed(0).padStart(5)} ns  today: literal, then withAccessors defines 3 getters on it`);
console.log(`${perCall(N, (i) => gettersOnPrototype(cfg(i))).toFixed(0).padStart(5)} ns  getters on a per-kind prototype, $with closures unchanged`);
const a = today(cfg(1)), b = gettersOnPrototype(cfg(1));
console.log(`${perCall(N, () => a.$with.left(leaf)).toFixed(0).padStart(5)} ns  $with.left today`);
console.log(`${perCall(N, () => b.$with.left(leaf)).toFixed(0).padStart(5)} ns  $with.left with getters on the prototype`);
console.log('own keys today:    ', Object.keys(a).join(','));
console.log('own keys prototype:', Object.keys(b).join(','));

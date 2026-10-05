// The builder alone (no withMethods), three ways to give the node its getters. $with is the same in all three.
import { performance } from 'node:perf_hooks';
const sink = new Array(1024);
function perCall(n, fn) {
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
function inLiteral(config) {
  const _left = config.left, _operator = config.operator, _right = config.right;
  return {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: {
      left: (value) => inLiteral({ ...config, left: value }),
      operator: (value) => inLiteral({ ...config, operator: value }),
      right: (value) => inLiteral({ ...config, right: value })
    },
    left: () => _left, operator: () => _operator, right: () => _right
  };
}
const Accessors = { left() { return this._left; }, operator() { return this._operator; }, right() { return this._right; } };
function onPrototype(config) {
  const node = Object.create(Accessors);
  node.$type = 311; node.$source = 2; node.$named = true;
  node._left = config.left; node._operator = config.operator; node._right = config.right;
  node.$with = {
    left: (value) => onPrototype({ ...config, left: value }),
    operator: (value) => onPrototype({ ...config, operator: value }),
    right: (value) => onPrototype({ ...config, right: value })
  };
  return node;
}
const leaf = inLiteral({ left: 1, operator: 2, right: 3 });
const cfg = (i) => ({ left: leaf, operator: i, right: leaf });
const cases = [['today: literal, then withAccessors', today], ['getters in the literal', inLiteral], ['getters on a prototype', onPrototype]];
for (const [, fn] of cases) perCall(400000, (i) => fn(cfg(i)));
const N = 4_000_000;
for (let round = 1; round <= 3; round++) {
  console.log(`round ${round}: ` + cases.map(([label, fn]) => `${perCall(N, (i) => fn(cfg(i))).toFixed(0)} ns ${label}`).join(' | '));
}
const read = (label, node) => { let acc = 0; const t0 = performance.now(); for (let i = 0; i < N; i++) acc += node.operator(); console.log(`  read ${label}: ${(((performance.now() - t0) / N) * 1e6).toFixed(1)} ns`, acc > 0); };
read('today', today(cfg(5))); read('in literal', inLiteral(cfg(5))); read('prototype', onPrototype(cfg(5)));
console.log('own keys, getters in the literal:', Object.keys(inLiteral(cfg(1))).join(','));

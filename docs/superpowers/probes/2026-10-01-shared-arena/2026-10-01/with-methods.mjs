// The pasted builder (getters in the literal) with today's withMethods, then cheaper ways to do what withMethods does.
// Helpers copied from packages/common/src/utils.ts. Plain node, three rounds.
import { performance } from 'node:perf_hooks';
const sink = new Array(1024);
function perCall(n, fn) {
  const t0 = performance.now();
  for (let i = 0; i < n; i++) sink[i & 1023] = fn(i);
  return ((performance.now() - t0) / n) * 1e6;
}
const engine = { render: () => ({ toString: () => '' }), trivia: {} };
const handle = { current: engine };
const inEngine = (h, fn) => fn();
const isNode = (v) => v !== null && typeof v === 'object' && typeof v.$type === 'number';

// ---- today's helpers ------------------------------------------------------------------------
function withAccessors(node, accessors) {
  for (const key of Object.keys(accessors)) Object.defineProperty(node, key, { value: accessors[key], enumerable: false, writable: true, configurable: true });
  return node;
}
function carryTriviaThroughWith(node, handle, scoped) {
  const setters = node.$with;
  if (setters === undefined) return;
  for (const key of Object.keys(setters)) {
    const rebuild = setters[key];
    if (typeof rebuild !== 'function') continue;
    setters[key] = (...args) => {
      const rebuilt = scoped(() => rebuild(...args));
      const trivia = node.$_trivia;
      if (trivia === undefined || !isNode(rebuilt)) return rebuilt;
      rebuilt.$_trivia = trivia;
      return rebuilt;
    };
  }
}
function withMethods(node) {
  const scoped = (fn) => inEngine(handle, fn);
  const facts = () => handle.current.trivia;
  const renderText = (self) => handle.current.render(self).toString();
  carryTriviaThroughWith(node, handle, scoped);
  Object.assign(node, {
    $render() { return renderText(this); },
    $toEdit(a, b) { return [renderText(this), a, b]; },
    $replace(t) { return [renderText(this), t]; }
  });
  Object.defineProperty(node, '$trivia', { get() { return [this, facts(), scoped]; }, enumerable: false, configurable: true });
  Object.defineProperty(node, '$engine', { value: () => handle.current, enumerable: false, writable: false, configurable: true });
  return node;
}

// ---- the five engine-bound members, written once, on one object per engine ---------------------
const engineMembers = {
  $render() { return this.$handle.current.render(this).toString(); },
  $toEdit(a, b) { return [this.$render(), a, b]; },
  $replace(t) { return [this.$render(), t]; },
  get $trivia() { return [this, this.$handle.current.trivia]; },
  $engine() { return this.$handle.current; },
  $handle: handle
};
// trivia carried when a setter is called, not by wrapping each setter when the node is built
const carry = (node, rebuilt) => { const trivia = node.$_trivia; if (trivia !== undefined && isNode(rebuilt)) rebuilt.$_trivia = trivia; return rebuilt; };

const parts = (config) => [config.left, config.operator, config.right];

function A_today(config) {
  const [_left, _operator, _right] = parts(config);
  return withMethods(withAccessors(
    { $type: 311, $source: 2, $named: true, _left, _operator, _right,
      $with: { left: (v) => A_today({ ...config, left: v }), operator: (v) => A_today({ ...config, operator: v }), right: (v) => A_today({ ...config, right: v }) } },
    { left: () => _left, operator: () => _operator, right: () => _right }));
}
function B_pasted(config) {
  const [_left, _operator, _right] = parts(config);
  return withMethods({
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => B_pasted({ ...config, left: v }), operator: (v) => B_pasted({ ...config, operator: v }), right: (v) => B_pasted({ ...config, right: v }) },
    left: () => _left, operator: () => _operator, right: () => _right
  });
}
function C_setPrototype(config) {
  const [_left, _operator, _right] = parts(config);
  const node = {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => carry(node, C_setPrototype({ ...config, left: v })), operator: (v) => carry(node, C_setPrototype({ ...config, operator: v })), right: (v) => carry(node, C_setPrototype({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right
  };
  return Object.setPrototypeOf(node, engineMembers);
}
function D_protoInLiteral(config) {
  const [_left, _operator, _right] = parts(config);
  const node = {
    __proto__: engineMembers,
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => carry(node, D_protoInLiteral({ ...config, left: v })), operator: (v) => carry(node, D_protoInLiteral({ ...config, operator: v })), right: (v) => carry(node, D_protoInLiteral({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right
  };
  return node;
}
function E_create(config) {
  const [_left, _operator, _right] = parts(config);
  const node = Object.create(engineMembers);
  node.$type = 311; node.$source = 2; node.$named = true; node._left = _left; node._operator = _operator; node._right = _right;
  node.$with = { left: (v) => carry(node, E_create({ ...config, left: v })), operator: (v) => carry(node, E_create({ ...config, operator: v })), right: (v) => carry(node, E_create({ ...config, right: v })) };
  node.left = () => _left; node.operator = () => _operator; node.right = () => _right;
  return node;
}
// a tiny constructor whose prototype is the engine's member object: `new` gives the prototype for free
function Node() {}
Node.prototype = engineMembers;
function F_newThenAssign(config) {
  const [_left, _operator, _right] = parts(config);
  const node = new Node();
  node.$type = 311; node.$source = 2; node.$named = true; node._left = _left; node._operator = _operator; node._right = _right;
  node.$with = { left: (v) => carry(node, F_newThenAssign({ ...config, left: v })), operator: (v) => carry(node, F_newThenAssign({ ...config, operator: v })), right: (v) => carry(node, F_newThenAssign({ ...config, right: v })) };
  node.left = () => _left; node.operator = () => _operator; node.right = () => _right;
  return node;
}

const leaf = E_create({ left: 1, operator: 2, right: 3 });
const cfg = (i) => ({ left: leaf, operator: i, right: leaf });
const cases = [
  ['A today: literal, withAccessors, withMethods', A_today],
  ['B pasted: getters in the literal, withMethods as it is', B_pasted],
  ['C literal, then Object.setPrototypeOf(node, engineMembers)', C_setPrototype],
  ['D literal with __proto__: engineMembers', D_protoInLiteral],
  ['E Object.create(engineMembers), then assign', E_create],
  ['F new Node(), then assign', F_newThenAssign]
];
for (const [, fn] of cases) perCall(300000, (i) => fn(cfg(i)));
const N = 3_000_000;
const rounds = cases.map(() => []);
for (let r = 0; r < 3; r++) cases.forEach(([, fn], k) => rounds[k].push(perCall(N, (i) => fn(cfg(i)))));
cases.forEach(([label], k) => console.log(`${rounds[k].map((t) => t.toFixed(0).padStart(4)).join(' ')} ns  ${label}`));
// behaviour check: the members work and a setter carries trivia
for (const [label, fn] of cases.slice(2)) {
  const n = fn(cfg(1)); n.$_trivia = { leading: ['c'] };
  const m = n.$with.left(leaf);
  console.log(`  ${label.slice(0, 1)}: $render ${typeof n.$render()}, $engine ok ${n.$engine() === engine}, trivia carried ${m.$_trivia === n.$_trivia}, left() ${m.left() === leaf}`);
}

// The generated builder's own steps, with the helpers copied from packages/common/src/utils.ts,
// timed cumulatively in plain node. Then two other ways to give the node its methods.
import { performance } from 'node:perf_hooks';
const sink = new Array(1024);
function perCall(n, fn) {
  for (let i = 0; i < 300000; i++) sink[i & 1023] = fn(i);
  const t0 = performance.now();
  for (let i = 0; i < n; i++) sink[i & 1023] = fn(i);
  return ((performance.now() - t0) / n) * 1e6;
}
const engine = { render: () => ({ toString: () => '' }), trivia: {} };
const handle = { current: engine };
const inEngine = (h, fn) => fn();
const isNode = (v) => v !== null && typeof v === 'object' && typeof v.$type === 'number';

// --- copied helpers -------------------------------------------------------------------------
function withAccessors(node, accessors) {
  for (const key of Object.keys(accessors)) {
    Object.defineProperty(node, key, { value: accessors[key], enumerable: false, writable: true, configurable: true });
  }
  return node;
}
function carryTriviaThroughWith(node, handle, scoped) {
  const setters = node.$with;
  if (setters === undefined) return;
  for (const key of Object.keys(setters)) {
    const setter = setters[key];
    if (typeof setter !== 'function') continue;
    const rebuild = setter;
    setters[key] = (...args) => {
      const rebuilt = scoped(() => rebuild(...args));
      const trivia = node.$_trivia;
      if (trivia === undefined || !isNode(rebuilt)) return rebuilt;
      rebuilt.$_trivia = trivia;
      return rebuilt;
    };
  }
}
function bindEngine(node, handle) {
  Object.defineProperty(node, '$engine', { value: () => handle.current, enumerable: false, writable: false, configurable: true });
}
function withMethods(node) {
  const scoped = handle === undefined ? (fn) => fn() : (fn) => inEngine(handle, fn);
  const facts = () => handle.current.trivia;
  const renderText = (self) => handle.current.render(self).toString();
  carryTriviaThroughWith(node, handle, scoped);
  Object.assign(node, {
    $render() { return renderText(this); },
    $toEdit(startOrRange, endPos) { return [renderText(this), startOrRange, endPos]; },
    $replace(target) { return [renderText(this), target]; }
  });
  Object.defineProperty(node, '$trivia', { get() { return [this, facts(), scoped]; }, enumerable: false, configurable: true });
  if (handle !== undefined) bindEngine(node, handle);
  return node;
}

// --- the builder, step by step ----------------------------------------------------------------
const literal = (config) => {
  const _left = config.left, _operator = config.operator, _right = config.right;
  return [{
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: {
      left: (value) => asToday({ ...config, left: value }),
      operator: (value) => asToday({ ...config, operator: value }),
      right: (value) => asToday({ ...config, right: value })
    }
  }, { left: () => _left, operator: () => _operator, right: () => _right }];
};
const step0 = (config) => literal(config)[0];
const step1 = (config) => { const [node, acc] = literal(config); return withAccessors(node, acc); };
const asToday = (config) => { const [node, acc] = literal(config); return withMethods(withAccessors(node, acc)); };

// --- everything in the one literal: no helper touches the object afterwards -------------------
const oneLiteral = (config) => {
  const _left = config.left, _operator = config.operator, _right = config.right;
  const renderText = (self) => handle.current.render(self).toString();
  return {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: {
      left: (value) => oneLiteral({ ...config, left: value }),
      operator: (value) => oneLiteral({ ...config, operator: value }),
      right: (value) => oneLiteral({ ...config, right: value })
    },
    left: () => _left, operator: () => _operator, right: () => _right,
    $render() { return renderText(this); },
    $toEdit(a, b) { return [renderText(this), a, b]; },
    $replace(t) { return [renderText(this), t]; },
    get $trivia() { return [this, handle.current.trivia]; },
    $engine: () => handle.current
  };
};

// --- methods on a prototype -------------------------------------------------------------------
const CONFIG = Symbol('config');
const proto = {
  left() { return this._left; }, operator() { return this._operator; }, right() { return this._right; },
  $render() { return handle.current.render(this).toString(); },
  $engine() { return handle.current; }
};
const onPrototype = (config) => {
  const node = Object.create(proto);
  node.$type = 311; node.$source = 2; node.$named = true;
  node._left = config.left; node._operator = config.operator; node._right = config.right;
  node[CONFIG] = config;
  return node;
};

const N = 4_000_000;
const leaf = onPrototype({ left: 1, operator: 2, right: 3 });
const cfg = (i) => ({ left: leaf, operator: i, right: leaf });
const t0 = perCall(N, (i) => step0(cfg(i)));
const t1 = perCall(N, (i) => step1(cfg(i)));
const t2 = perCall(N, (i) => asToday(cfg(i)));
console.log('the generated builder, cumulative:');
console.log(`  ${t0.toFixed(0).padStart(5)} ns  the storage literal with $with, and the accessor object (9 objects and closures)`);
console.log(`  ${t1.toFixed(0).padStart(5)} ns  + withAccessors: 3 Object.defineProperty calls   (+${(t1 - t0).toFixed(0)})`);
console.log(`  ${t2.toFixed(0).padStart(5)} ns  + withMethods: Object.assign of 3, 2 defineProperty, 3 setter wrappers   (+${(t2 - t1).toFixed(0)})`);
console.log('other ways to give the node its methods:');
console.log(`  ${perCall(N, (i) => oneLiteral(cfg(i))).toFixed(0).padStart(5)} ns  everything in the one literal (methods become enumerable own keys)`);
console.log(`  ${perCall(N, (i) => onPrototype(cfg(i))).toFixed(0).padStart(5)} ns  methods on a prototype`);
console.log('own keys, one literal:', Object.keys(oneLiteral(cfg(1))).join(','));
console.log('own keys, today:      ', Object.keys(asToday(cfg(1))).join(','));
console.log('own keys, prototype:  ', Object.keys(onPrototype(cfg(1))).join(','));

// Members written in the builder's literal: which member costs, whether the node keeps fast properties,
// what it retains, and what reading it costs afterwards.
// node --expose-gc --allow-natives-syntax literal-members.mjs
import { performance } from 'node:perf_hooks';
const fast = new Function('o', 'return %HasFastProperties(o)');
const sink = new Array(1024);
function perCall(n, fn) {
  const t0 = performance.now();
  for (let i = 0; i < n; i++) sink[i & 1023] = fn(i);
  return ((performance.now() - t0) / n) * 1e6;
}
const engine = { render: () => ({ toString: () => '' }), trivia: {} };
const handle = { current: engine };
const currentHandle = () => handle;
const inEngine = (h, fn) => fn();
const isNode = (v) => v !== null && typeof v === 'object' && typeof v.$type === 'number';

// ---- today's helpers, copied from packages/common/src/utils.ts ---------------------------------
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
  const handle = currentHandle();
  const scoped = handle === undefined ? (fn) => fn() : (fn) => inEngine(handle, fn);
  const facts = () => handle.current.trivia;
  const renderText = (self) => handle.current.render(self).toString();
  carryTriviaThroughWith(node, handle, scoped);
  Object.assign(node, {
    $render() { return renderText(this); },
    $toEdit(a, b) { return [renderText(this), a, b]; },
    $replace(t) { return [renderText(this), t]; }
  });
  Object.defineProperty(node, '$trivia', { get() { return [this, facts(), scoped]; }, enumerable: false, configurable: true });
  if (handle !== undefined) Object.defineProperty(node, '$engine', { value: () => handle.current, enumerable: false, writable: false, configurable: true });
  return node;
}

// ---- members written once, as functions of `this`, for the literal to name ----------------------
function $render() { return this.$handle.current.render(this).toString(); }
function $toEdit(a, b) { return [this.$render(), a, b]; }
function $replace(t) { return [this.$render(), t]; }
function $engine() { return this.$handle.current; }
function triviaGetter() { return [this, this.$handle.current.trivia]; }
function $triviaCall(...items) { return [this, this.$handle.current.trivia, items]; }
const sharedMembers = { $render, $toEdit, $replace, $engine };
const carry = (node, rebuilt) => { const trivia = node.$_trivia; if (trivia !== undefined && isNode(rebuilt)) rebuilt.$_trivia = trivia; return rebuilt; };
const rebuildIn = (node, build) => carry(node, inEngine(node.$handle, build));

function today(config) {
  const _left = config.left, _operator = config.operator, _right = config.right;
  return withMethods(withAccessors(
    { $type: 311, $source: 2, $named: true, _left, _operator, _right,
      $with: { left: (v) => today({ ...config, left: v }), operator: (v) => today({ ...config, operator: v }), right: (v) => today({ ...config, right: v }) } },
    { left: () => _left, operator: () => _operator, right: () => _right }));
}
// per-node closures for every member, getter in the literal
function closuresWithGetter(config) {
  const handle = currentHandle();
  const _left = config.left, _operator = config.operator, _right = config.right;
  const node = {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => rebuildIn(node, () => closuresWithGetter({ ...config, left: v })), operator: (v) => rebuildIn(node, () => closuresWithGetter({ ...config, operator: v })), right: (v) => rebuildIn(node, () => closuresWithGetter({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right,
    $handle: handle,
    $render: () => handle.current.render(node).toString(),
    $toEdit: (a, b) => [node.$render(), a, b],
    $replace: (t) => [node.$render(), t],
    get $trivia() { return [node, handle.current.trivia]; },
    $engine: () => handle.current
  };
  return node;
}
// per-node closures for every member, $trivia left out
function closuresNoTrivia(config) {
  const handle = currentHandle();
  const _left = config.left, _operator = config.operator, _right = config.right;
  const node = {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => rebuildIn(node, () => closuresNoTrivia({ ...config, left: v })), operator: (v) => rebuildIn(node, () => closuresNoTrivia({ ...config, operator: v })), right: (v) => rebuildIn(node, () => closuresNoTrivia({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right,
    $handle: handle,
    $render: () => handle.current.render(node).toString(),
    $toEdit: (a, b) => [node.$render(), a, b],
    $replace: (t) => [node.$render(), t],
    $engine: () => handle.current
  };
  return node;
}
// the literal names functions written once; $trivia left out
function namedNoTrivia(config) {
  const _left = config.left, _operator = config.operator, _right = config.right;
  const node = {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => rebuildIn(node, () => namedNoTrivia({ ...config, left: v })), operator: (v) => rebuildIn(node, () => namedNoTrivia({ ...config, operator: v })), right: (v) => rebuildIn(node, () => namedNoTrivia({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right,
    $handle: currentHandle(), $render, $toEdit, $replace, $engine
  };
  return node;
}
// the same, with $trivia as one more named function (called, not read)
function namedTriviaCall(config) {
  const _left = config.left, _operator = config.operator, _right = config.right;
  const node = {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => rebuildIn(node, () => namedTriviaCall({ ...config, left: v })), operator: (v) => rebuildIn(node, () => namedTriviaCall({ ...config, operator: v })), right: (v) => rebuildIn(node, () => namedTriviaCall({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right,
    $handle: currentHandle(), $render, $toEdit, $replace, $engine, $trivia: $triviaCall
  };
  return node;
}
// the same, with $trivia kept a getter: the one getter function, defined on the node after the literal
const triviaDescriptor = { get: triviaGetter, enumerable: false, configurable: true };
function namedSharedGetter(config) {
  const _left = config.left, _operator = config.operator, _right = config.right;
  const node = {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => rebuildIn(node, () => namedSharedGetter({ ...config, left: v })), operator: (v) => rebuildIn(node, () => namedSharedGetter({ ...config, operator: v })), right: (v) => rebuildIn(node, () => namedSharedGetter({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right,
    $handle: currentHandle(), $render, $toEdit, $replace, $engine
  };
  return Object.defineProperty(node, '$trivia', triviaDescriptor);
}
// members spread into the literal from one object
function spreadMembers(config) {
  const _left = config.left, _operator = config.operator, _right = config.right;
  const node = {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => rebuildIn(node, () => spreadMembers({ ...config, left: v })), operator: (v) => rebuildIn(node, () => spreadMembers({ ...config, operator: v })), right: (v) => rebuildIn(node, () => spreadMembers({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right,
    $handle: currentHandle(), ...sharedMembers
  };
  return node;
}
// reference: members on one object the node inherits from
const inherited = { $render, $toEdit, $replace, $engine, get $trivia() { return triviaGetter.call(this); }, $handle: handle };
function inheritMembers(config) {
  const _left = config.left, _operator = config.operator, _right = config.right;
  const node = Object.create(inherited);
  node.$type = 311; node.$source = 2; node.$named = true; node._left = _left; node._operator = _operator; node._right = _right;
  node.$with = { left: (v) => rebuildIn(node, () => inheritMembers({ ...config, left: v })), operator: (v) => rebuildIn(node, () => inheritMembers({ ...config, operator: v })), right: (v) => rebuildIn(node, () => inheritMembers({ ...config, right: v })) };
  node.left = () => _left; node.operator = () => _operator; node.right = () => _right;
  return node;
}

// $trivia as a nested literal of closures, the way $with is: two positions, or four for a kind with inner gaps
const triviaSide = (node, handle, position, items) => [node, handle.current.trivia, position, items];
const triviaInnerAt = (node, handle, gap, items) => [node, handle.current.trivia, gap, items];
function triviaObjectTwo(config) {
  const handle = currentHandle();
  const _left = config.left, _operator = config.operator, _right = config.right;
  const node = {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => rebuildIn(node, () => triviaObjectTwo({ ...config, left: v })), operator: (v) => rebuildIn(node, () => triviaObjectTwo({ ...config, operator: v })), right: (v) => rebuildIn(node, () => triviaObjectTwo({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right,
    $handle: handle,
    $render: () => handle.current.render(node).toString(),
    $toEdit: (a, b) => [node.$render(), a, b],
    $replace: (t) => [node.$render(), t],
    $trivia: {
      leading: (...items) => triviaSide(node, handle, 'leading', items),
      trailing: (...items) => triviaSide(node, handle, 'trailing', items)
    },
    $engine: () => handle.current
  };
  return node;
}
function triviaObjectFour(config) {
  const handle = currentHandle();
  const _left = config.left, _operator = config.operator, _right = config.right;
  const node = {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => rebuildIn(node, () => triviaObjectFour({ ...config, left: v })), operator: (v) => rebuildIn(node, () => triviaObjectFour({ ...config, operator: v })), right: (v) => rebuildIn(node, () => triviaObjectFour({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right,
    $handle: handle,
    $render: () => handle.current.render(node).toString(),
    $toEdit: (a, b) => [node.$render(), a, b],
    $replace: (t) => [node.$render(), t],
    $trivia: {
      leading: (...items) => triviaSide(node, handle, 'leading', items),
      trailing: (...items) => triviaSide(node, handle, 'trailing', items),
      inner: (...items) => triviaInnerAt(node, handle, undefined, items),
      innerAt: (gap, ...items) => triviaInnerAt(node, handle, gap, items)
    },
    $engine: () => handle.current
  };
  return node;
}
// the same four positions as functions written once, on an object that points back at its node
function sideLeading(...items) { return triviaSide(this.node, this.node.$handle, 'leading', items); }
function sideTrailing(...items) { return triviaSide(this.node, this.node.$handle, 'trailing', items); }
function sideInner(...items) { return triviaInnerAt(this.node, this.node.$handle, undefined, items); }
function sideInnerAt(gap, ...items) { return triviaInnerAt(this.node, this.node.$handle, gap, items); }
function triviaObjectNamed(config) {
  const _left = config.left, _operator = config.operator, _right = config.right;
  const $trivia = { node: undefined, leading: sideLeading, trailing: sideTrailing, inner: sideInner, innerAt: sideInnerAt };
  const node = {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => rebuildIn(node, () => triviaObjectNamed({ ...config, left: v })), operator: (v) => rebuildIn(node, () => triviaObjectNamed({ ...config, operator: v })), right: (v) => rebuildIn(node, () => triviaObjectNamed({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right,
    $handle: currentHandle(), $render, $toEdit, $replace, $engine, $trivia
  };
  $trivia.node = node;
  return node;
}

const leaf = namedNoTrivia({ left: 1, operator: 2, right: 3 });
const cfg = (i) => ({ left: leaf, operator: i, right: leaf });
const cases = {
  today: ['today: literal, withAccessors, withMethods', today],
  closuresWithGetter: ['all in the literal, a closure per member, get $trivia()', closuresWithGetter],
  closuresNoTrivia: ['all in the literal, a closure per member, no $trivia', closuresNoTrivia],
  namedNoTrivia: ['literal names shared functions, no $trivia', namedNoTrivia],
  triviaObjectTwo: ['all in the literal, closures, $trivia: { leading, trailing }', triviaObjectTwo],
  triviaObjectFour: ['all in the literal, closures, $trivia: { leading, trailing, inner, innerAt }', triviaObjectFour],
  triviaObjectNamed: ['literal names shared functions, $trivia object of four shared functions', triviaObjectNamed],
  namedTriviaCall: ['literal names shared functions, $trivia a called function', namedTriviaCall],
  namedSharedGetter: ['literal names shared functions, then one shared getter defined', namedSharedGetter],
  spreadMembers: ['literal spreads one members object, no $trivia', spreadMembers],
  inheritMembers: ['members inherited from one object (reference)', inheritMembers]
};
// One form per process, so each form has its own inline caches and heap.
const which = process.argv[2];
if (which === undefined) { console.log(Object.keys(cases).join(' ')); process.exit(0); }
const [label, fn] = cases[which];
perCall(300000, (i) => fn(cfg(i)));
const builds = [];
for (let r = 0; r < 9; r++) builds.push(perCall(1_000_000, (i) => fn(cfg(i))));
builds.sort((a, b) => a - b);

function readAll(nodes, n) {
  let acc = 0;
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    const node = nodes[i & 1023];
    acc += node.$type + node._operator + (node._left === node._right ? 1 : 0);
  }
  const ns = ((performance.now() - t0) / n) * 1e6;
  if (acc === 0) throw new Error('unreachable');
  return ns;
}
function keysAll(nodes, n) {
  let acc = 0;
  const t0 = performance.now();
  for (let i = 0; i < n; i++) acc += Object.keys(nodes[i & 1023]).length;
  const ns = ((performance.now() - t0) / n) * 1e6;
  if (acc === 0) throw new Error('unreachable');
  return ns;
}
const COUNT = 200_000;
globalThis.gc(); const before = process.memoryUsage().heapUsed;
const keep = new Array(COUNT); for (let i = 0; i < COUNT; i++) keep[i] = fn({ left: leaf, operator: i, right: leaf });
globalThis.gc(); const bytes = (process.memoryUsage().heapUsed - before) / COUNT;
const nodes = keep.slice(1000, 2024);
readAll(nodes, 2_000_000); keysAll(nodes, 200_000);
const reads = [], keys = [];
for (let r = 0; r < 7; r++) { reads.push(readAll(nodes, 10_000_000)); keys.push(keysAll(nodes, 2_000_000)); }
const fastCount = nodes.filter((n) => fast(n)).length;
console.log(`${Math.min(...builds).toFixed(0).padStart(5)} ${builds[4].toFixed(0).padStart(5)}  ${bytes.toFixed(0).padStart(5)}  ${String(fastCount).padStart(4)}/1024  ${Math.min(...reads).toFixed(1).padStart(5)}  ${Math.min(...keys).toFixed(0).padStart(4)}   ${label}`);

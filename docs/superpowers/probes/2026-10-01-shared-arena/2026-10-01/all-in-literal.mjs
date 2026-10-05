// "No prototype, no const": every member written in the builder's literal. Time and retained memory.
// Plain node, run with --expose-gc. Three rounds.
import { performance } from 'node:perf_hooks';
const sink = new Array(1024);
function perCall(n, fn) {
  const t0 = performance.now();
  for (let i = 0; i < n; i++) sink[i & 1023] = fn(i);
  return ((performance.now() - t0) / n) * 1e6;
}
const engine = { render: () => ({ toString: () => '' }), trivia: {} };
let currentHandle = { current: engine };
const isNode = (v) => v !== null && typeof v === 'object' && typeof v.$type === 'number';
const carry = (node, rebuilt) => { const trivia = node.$_trivia; if (trivia !== undefined && isNode(rebuilt)) rebuilt.$_trivia = trivia; return rebuilt; };
const renderText = (handle, node) => handle.current.render(node).toString();
const triviaSetterOf = (node, handle) => [node, handle.current.trivia];

// 1. every member in the literal, $trivia as a getter
function getterInLiteral(config) {
  const handle = currentHandle;
  const _left = config.left, _operator = config.operator, _right = config.right;
  const node = {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => carry(node, getterInLiteral({ ...config, left: v })), operator: (v) => carry(node, getterInLiteral({ ...config, operator: v })), right: (v) => carry(node, getterInLiteral({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right,
    $render: () => renderText(handle, node),
    $toEdit: (a, b) => [renderText(handle, node), a, b],
    $replace: (t) => [renderText(handle, node), t],
    get $trivia() { return triviaSetterOf(node, handle); },
    $engine: () => handle.current
  };
  return node;
}
// 2. the same without $trivia at all, to see what the getter costs
function noTrivia(config) {
  const handle = currentHandle;
  const _left = config.left, _operator = config.operator, _right = config.right;
  const node = {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => carry(node, noTrivia({ ...config, left: v })), operator: (v) => carry(node, noTrivia({ ...config, operator: v })), right: (v) => carry(node, noTrivia({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right,
    $render: () => renderText(handle, node),
    $toEdit: (a, b) => [renderText(handle, node), a, b],
    $replace: (t) => [renderText(handle, node), t],
    $engine: () => handle.current
  };
  return node;
}
// 3. $trivia as an ordinary function property in the literal: called as node.$trivia(...), with the
//    positions reached as node.$trivia.leading(...) through one shared object the function inherits from
const triviaPositions = Object.setPrototypeOf({
  leading(...items) { return ['leading', this.node, items]; },
  trailing(...items) { return ['trailing', this.node, items]; },
  inner(...items) { return ['inner', this.node, items]; },
  innerAt(gap, ...items) { return ['innerAt', this.node, gap, items]; }
}, Function.prototype);
function triviaFunction(config) {
  const handle = currentHandle;
  const _left = config.left, _operator = config.operator, _right = config.right;
  const $trivia = (...args) => ['all', node, args];
  const node = {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => carry(node, triviaFunction({ ...config, left: v })), operator: (v) => carry(node, triviaFunction({ ...config, operator: v })), right: (v) => carry(node, triviaFunction({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right,
    $render: () => renderText(handle, node),
    $toEdit: (a, b) => [renderText(handle, node), a, b],
    $replace: (t) => [renderText(handle, node), t],
    $trivia,
    $engine: () => handle.current
  };
  return node;
}
// 4. $trivia built eagerly as a callable carrying its four positions as its own closures
function triviaEager(config) {
  const handle = currentHandle;
  const _left = config.left, _operator = config.operator, _right = config.right;
  const $trivia = (...args) => ['all', node, args];
  $trivia.leading = (...items) => ['leading', node, items];
  $trivia.trailing = (...items) => ['trailing', node, items];
  $trivia.inner = (...items) => ['inner', node, items];
  $trivia.innerAt = (gap, ...items) => ['innerAt', node, gap, items];
  const node = {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => carry(node, triviaEager({ ...config, left: v })), operator: (v) => carry(node, triviaEager({ ...config, operator: v })), right: (v) => carry(node, triviaEager({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right,
    $render: () => renderText(handle, node),
    $toEdit: (a, b) => [renderText(handle, node), a, b],
    $replace: (t) => [renderText(handle, node), t],
    $trivia,
    $engine: () => handle.current
  };
  return node;
}
// reference: members on one shared object per engine
const members = {
  $render() { return renderText(this.$handle, this); }, $toEdit(a, b) { return [this.$render(), a, b]; }, $replace(t) { return [this.$render(), t]; },
  get $trivia() { return triviaSetterOf(this, this.$handle); }, $engine() { return this.$handle.current; }, $handle: currentHandle
};
function shared(config) {
  const _left = config.left, _operator = config.operator, _right = config.right;
  const node = Object.create(members);
  node.$type = 311; node.$source = 2; node.$named = true; node._left = _left; node._operator = _operator; node._right = _right;
  node.$with = { left: (v) => carry(node, shared({ ...config, left: v })), operator: (v) => carry(node, shared({ ...config, operator: v })), right: (v) => carry(node, shared({ ...config, right: v })) };
  node.left = () => _left; node.operator = () => _operator; node.right = () => _right;
  return node;
}

const leaf = shared({ left: 1, operator: 2, right: 3 });
const cfg = (i) => ({ left: leaf, operator: i, right: leaf });
const cases = [
  ['every member in the literal, $trivia as a getter', getterInLiteral],
  ['every member in the literal, no $trivia', noTrivia],
  ['every member in the literal, $trivia a plain function (positions shared)', triviaFunction],
  ['every member in the literal, $trivia built eagerly with 4 own positions', triviaEager],
  ['members on one shared object per engine (Object.create)', shared]
];
for (const [, fn] of cases) perCall(300000, (i) => fn(cfg(i)));
const N = 3_000_000;
const rounds = cases.map(() => []);
for (let r = 0; r < 3; r++) cases.forEach(([, fn], k) => rounds[k].push(perCall(N, (i) => fn(cfg(i)))));
const COUNT = 200_000;
cases.forEach(([label, fn], k) => {
  globalThis.gc(); const before = process.memoryUsage().heapUsed;
  const keep = new Array(COUNT); for (let i = 0; i < COUNT; i++) keep[i] = fn({ left: leaf, operator: i, right: leaf });
  globalThis.gc(); const bytes = (process.memoryUsage().heapUsed - before) / COUNT;
  console.log(`${rounds[k].map((t) => t.toFixed(0).padStart(4)).join(' ')} ns  ${bytes.toFixed(0).padStart(4)} B/node  ${label}`);
  keep.length = 0;
});
const t = triviaFunction(cfg(1));
Object.setPrototypeOf(t.$trivia, triviaPositions);
console.log('plain-function $trivia callable:', t.$trivia('x')[0], '| a position needs the node bound:', typeof t.$trivia.leading);

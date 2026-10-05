// What the engine's scoped build table costs per builder call. scopedBuild, inEngine and hoist are copied
// from packages/common/src/{create-engine,engine-scope,runtime}.ts. One case per process:
//   node engine-wrap.mjs            (lists the cases)
//   node engine-wrap.mjs <case>
import { performance } from 'node:perf_hooks';

let active;
function inEngine(handle, fn) { const previous = active; active = handle; try { return fn(); } finally { active = previous; } }
const currentHandle = () => active;
function refuseWrite() { throw new Error('the build table of an engine is read-only'); }
function scopedBuild(build, handle) {
  const proxies = new WeakMap();
  const scope = (value) => {
    if (value === null || (typeof value !== 'function' && typeof value !== 'object')) return value;
    const known = proxies.get(value);
    if (known !== undefined) return known;
    const shell = typeof value === 'function' ? () => undefined : {};
    const proxy = new Proxy(shell, {
      get: (_, key, receiver) => { const member = Reflect.get(value, key, receiver); return Object.hasOwn(value, key) ? scope(member) : member; },
      has: (_, key) => Reflect.has(value, key),
      ownKeys: () => Reflect.ownKeys(value),
      getOwnPropertyDescriptor: (_, key) => { const d = Reflect.getOwnPropertyDescriptor(value, key); if (d === undefined) return undefined; return 'value' in d ? { ...d, value: scope(d.value), configurable: true } : { ...d, configurable: true }; },
      getPrototypeOf: () => Reflect.getPrototypeOf(value),
      apply: (_, self, args) => inEngine(handle, () => Reflect.apply(value, self, args)),
      set: refuseWrite, defineProperty: refuseWrite, deleteProperty: refuseWrite, setPrototypeOf: refuseWrite, preventExtensions: refuseWrite
    });
    proxies.set(value, proxy);
    return proxy;
  };
  return scope(build);
}
function hoist(b) {
  const target = typeof b.coerce === 'function' ? b.coerce : b.strict;
  const callable = (...args) => target(...args);
  for (const [key, value] of Object.entries(b)) Object.defineProperty(callable, key, { value, writable: false, configurable: false, enumerable: true });
  return Object.freeze(callable);
}

// a three-slot builder with its members in the literal; it reads the handle in scope
const engine = { render: () => ({ toString: () => '' }), trivia: {} };
const handle = { current: engine };
const isNode = (v) => v !== null && typeof v === 'object' && typeof v.$type === 'number';
const carry = (node, rebuilt) => { const trivia = node.$_trivia; if (trivia !== undefined && isNode(rebuilt)) rebuilt.$_trivia = trivia; return rebuilt; };
const rebuilt = (node, h, build) => carry(node, h === undefined ? build() : inEngine(h, build));
const triviaSide = (node, h, position, items) => [node, h, position, items];
function buildNode(config, h = currentHandle()) {
  const _left = config.left, _operator = config.operator, _right = config.right;
  const node = {
    $type: 311, $source: 2, $named: true, _left, _operator, _right,
    $with: { left: (v) => rebuilt(node, h, () => buildNode({ ...config, left: v })), operator: (v) => rebuilt(node, h, () => buildNode({ ...config, operator: v })), right: (v) => rebuilt(node, h, () => buildNode({ ...config, right: v })) },
    left: () => _left, operator: () => _operator, right: () => _right,
    $render: () => h.current.render(node).toString(),
    $toEdit: (a, b) => [node.$render(), a, b],
    $replace: (t) => [node.$render(), t],
    $trivia: { leading: (...items) => triviaSide(node, h, 'leading', items), trailing: (...items) => triviaSide(node, h, 'trailing', items) },
    $engine: h && (() => h.current)
  };
  return node;
}
const flavours = Object.freeze({ strict: (config) => buildNode(config), coerce: (config) => buildNode(config) });
const raw = Object.freeze({ node: hoist(flavours), statement: Object.freeze({ node: hoist(flavours) }) });
const build = scopedBuild(raw, handle);

// the same table scoped with ordinary functions, made once per engine
const scopeTable = (table) => {
  if (typeof table === 'function') {
    const scoped = (...args) => inEngine(handle, () => table(...args));
    for (const key of Object.keys(table)) scoped[key] = scopeTable(table[key]);
    return Object.freeze(scoped);
  }
  if (table !== null && typeof table === 'object') return Object.freeze(Object.fromEntries(Object.entries(table).map(([key, value]) => [key, scopeTable(value)])));
  return table;
};
const closures = scopeTable(raw);
// builders that take the handle when the table is made, so no call needs a scope
const bound = Object.freeze({ node: (config) => buildNode(config, handle), statement: Object.freeze({ node: Object.freeze(Object.assign((config) => buildNode(config, handle), { strict: (config) => buildNode(config, handle) })) }) });

const leaf = { $type: 1 };
const cfg = (i) => ({ left: leaf, operator: i, right: leaf });
const cases = {
  unscoped: ['the builder alone, no engine in scope', (i) => raw.node(cfg(i))],
  direct: ['the builder inside inEngine, called directly', (i) => inEngine(handle, () => raw.node(cfg(i)))],
  proxy1: ['through the scoped table: build.node(config)', (i) => build.node(cfg(i))],
  proxyHeld: ['through the scoped table, builder held in a variable', (() => { const held = build.node; return (i) => held(cfg(i)); })()],
  proxy3: ['through the scoped table: build.statement.node.strict(config)', (i) => build.statement.node.strict(cfg(i))],
  closures1: ['table scoped with plain functions: build.node(config)', (i) => closures.node(cfg(i))],
  closures3: ['table scoped with plain functions: build.statement.node.strict(config)', (i) => closures.statement.node.strict(cfg(i))],
  bound1: ['builders made with the handle: build.node(config)', (i) => bound.node(cfg(i))],
  bound3: ['builders made with the handle: build.statement.node.strict(config)', (i) => bound.statement.node.strict(cfg(i))]
};
const which = process.argv[2];
if (which === undefined) { console.log(Object.keys(cases).join(' ')); process.exit(0); }
const [label, fn] = cases[which];
const sample = fn(1);
if (which !== 'unscoped' && sample.$engine() !== engine) throw new Error(`${which}: node is not bound to the engine`);
const sink = new Array(1024);
const perCall = (n) => { const t0 = performance.now(); for (let i = 0; i < n; i++) sink[i & 1023] = fn(i); return ((performance.now() - t0) / n) * 1e6; };
perCall(300_000);
const rounds = []; for (let r = 0; r < 9; r++) rounds.push(perCall(1_000_000));
rounds.sort((a, b) => a - b);
console.log(`${rounds[0].toFixed(0).padStart(5)} ${rounds[4].toFixed(0).padStart(5)}   ${label}`);

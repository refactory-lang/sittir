// withListView and withGroupSeat today, against the same members written in the builder's literal.
// Helpers copied from packages/common/src/utils.ts. One form per process:
//   node --expose-gc --allow-natives-syntax list-and-seat.mjs            (lists the forms)
//   node --expose-gc --allow-natives-syntax list-and-seat.mjs <form>
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
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

// ---- today's helpers ---------------------------------------------------------------------------
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
const READONLY_ARRAY_METHODS = ['at', 'concat', 'entries', 'every', 'filter', 'find', 'findIndex', 'findLast', 'findLastIndex', 'flat', 'flatMap', 'forEach', 'includes', 'indexOf', 'join', 'keys', 'lastIndexOf', 'map', 'reduce', 'reduceRight', 'slice', 'some', 'toReversed', 'toSorted', 'toLocaleString', 'toSpliced', 'toString', 'values', 'with'];
const collapseWrapper = (item, wrapper) => {
  if (wrapper === undefined || item === null || typeof item !== 'object') return item;
  if (item.$type !== wrapper.kind) return item;
  if (wrapper.decorations.some((key) => item[key] !== undefined)) return item;
  return item[wrapper.content].call(item);
};
const defineHidden = (node, key, descriptor) => { Object.defineProperty(node, key, { enumerable: false, configurable: true, ...descriptor }); };
const LIST_ITEMS = Symbol('sittir.listItems');
const isGroupConfig = (value, keys) => typeof value === 'object' && value !== null && !('$type' in value) && Object.keys(value).length > 0 && Object.keys(value).every((key) => keys.includes(key));
const convertElements = (args, element) => {
  if (element === undefined) return args;
  const convert = (item) => (isGroupConfig(item, element.keys) ? element.make(item) : item);
  return args.length === 1 && Array.isArray(args[0]) ? [args[0].map(convert)] : args.map(convert);
};
const STORED_SLOT_READERS = Symbol('sittir.storedSlotReaders');
const storedElementsOf = (node, spec) => {
  const list = spec.list === undefined ? node : node[spec.list.storage];
  if (list == null) return [];
  const elements = list[spec.count];
  return Array.isArray(elements) ? elements : elements == null ? [] : [elements];
};
function withListView(node, spec) {
  const listOf = (self) => (spec.list === undefined ? self : self[spec.list.accessor].call(self));
  const itemsOf = (self) => {
    const cached = self[LIST_ITEMS];
    if (cached !== undefined) return cached;
    const list = listOf(self);
    const elements = list === undefined ? [] : (list[spec.elements].call(list) ?? []);
    const items = Object.freeze(elements.map((element) => collapseWrapper(element, spec.wrapper)));
    defineHidden(self, LIST_ITEMS, { value: items });
    return items;
  };
  const stored = storedElementsOf(node, spec);
  for (let index = 0; index < (stored?.length ?? 0); index++) defineHidden(node, index, { get() { return itemsOf(this)[index]; } });
  defineHidden(node, 'length', { value: stored.length });
  defineHidden(node, Symbol.isConcatSpreadable, { value: true });
  defineHidden(node, Symbol.iterator, { value: function () { return itemsOf(this)[Symbol.iterator](); } });
  defineHidden(node, Symbol.unscopables, { value: Array.prototype[Symbol.unscopables] });
  for (const method of READONLY_ARRAY_METHODS) defineHidden(node, method, { value: function (...args) { return itemsOf(this)[method](...args); } });
  for (const option of spec.options ?? []) defineHidden(node, option.key, { get() { return listOf(this)?.[`_${option.key}`] ?? option.default; } });
  return node;
}
function withListSlots(node, specs) {
  const setters = Object.getOwnPropertyDescriptor(node, '$with')?.value;
  if (setters === undefined) return node;
  for (const spec of specs) {
    const set = setters[spec.slot];
    if (set === undefined) continue;
    const make = spec.make;
    setters[spec.slot] = (...args) => {
      if (args.length === 0) return spec.optional ? set() : set(make());
      const whole = args.length === 1 && (args[0] === undefined || args[0]?.$type === spec.kind);
      return set(whole ? args[0] : make(...convertElements(args, spec.element)));
    };
  }
  return node;
}
function seatedReader(node, stored, read) { return node[stored] === undefined ? undefined : () => read.call(node); }
function withGroupSeat(node, spec) {
  const own = Object.getOwnPropertyDescriptor(node, spec.slot);
  const readGroup = own?.value ?? node[spec.slot];
  const known = node[STORED_SLOT_READERS];
  defineHidden(node, STORED_SLOT_READERS, { value: { ...known, [spec.slot]: readGroup } });
  const fieldOf = (key) => key.field ?? key.name;
  for (const key of spec.keys) {
    const read = function () { const group = readGroup.call(this); return group?.[fieldOf(key)]?.call(group); };
    defineHidden(node, key.name, { enumerable: key.name === spec.slot ? (own?.enumerable ?? false) : false, get() { return seatedReader(this, spec.stored, read); } });
  }
  const setters = Object.getOwnPropertyDescriptor(node, '$with')?.value;
  const seat = setters?.[spec.slot];
  if (setters === undefined || seat === undefined) return node;
  const make = spec.make;
  for (const key of spec.keys) {
    setters[key.name] = (...args) => {
      if (key.name === spec.slot && args.length === 1 && args[0]?.$type === spec.kind) return seat(args[0]);
      const group = readGroup.call(node);
      if (group !== undefined) return seat(group.$with[fieldOf(key)](...args));
      const value = key.rest ? args : args[0];
      if (key.rest ? args.length === 0 : value === undefined) return seat();
      const missing = spec.keys.filter((other) => other !== key && other.required === true).map((other) => other.name);
      if (missing.length > 0) throw new TypeError(`cannot build the absent '${spec.slot}' group without ${missing.join(', ')}`);
      return seat(make({ [fieldOf(key)]: value }));
    };
  }
  return node;
}

// ---- written once, for the literal forms -------------------------------------------------------
const carry = (node, rebuilt) => { const trivia = node.$_trivia; if (trivia !== undefined && isNode(rebuilt)) rebuilt.$_trivia = trivia; return rebuilt; };
const rebuildIn = (node, handle, build) => carry(node, inEngine(handle, build));
const triviaSide = (node, handle, position, items) => [node, handle.current.trivia, position, items];
const WRAPPER = { kind: 279, content: 'expression', decorations: ['_attribute_item'] };
const ELEMENT = { keys: ['attributeItem', 'expression'], make: (config) => config };
const NO_ITEMS = Object.freeze([]);
const listItems = (list, wrapper) => (list === undefined ? NO_ITEMS : list._element.map((element) => collapseWrapper(element, wrapper)));
const listArgument = (args, kind, make, element) => {
  if (args.length === 0) return undefined;
  return args.length === 1 && (args[0] === undefined || args[0]?.$type === kind) ? args[0] : make(...convertElements(args, element));
};
const seatField = (group, field, rest, args, make, required) => {
  if (group !== undefined) return group.$with[field](...args);
  const value = rest ? args : args[0];
  if (rest ? args.length === 0 : value === undefined) return undefined;
  if (required.length > 0) throw new TypeError(`cannot build the absent group without ${required.join(', ')}`);
  return make({ [field]: value });
};
const { at, concat, entries, every, filter, find, findIndex, findLast, findLastIndex, flat, flatMap, forEach, includes, indexOf, join, keys, lastIndexOf, map, reduce, reduceRight, slice, some, toReversed, toSorted, toLocaleString, toSpliced, toString, values } = Array.prototype;
const arrayWith = Array.prototype.with;
const UNSCOPABLES = Array.prototype[Symbol.unscopables];
const LIST_MEMBERS = { at, concat, entries, every, filter, find, findIndex, findLast, findLastIndex, flat, flatMap, forEach, includes, indexOf, join, keys, lastIndexOf, map, reduce, reduceRight, slice, some, toReversed, toSorted, toLocaleString, toSpliced, toString, values, with: arrayWith, [Symbol.iterator]: values, [Symbol.isConcatSpreadable]: true, [Symbol.unscopables]: UNSCOPABLES };

const leafOf = (text) => ({ $type: 1, $text: text });
const listChild = (...elements) => ({ $type: 278, $source: 2, $named: true, _element: elements, _delimiter: 1, elements() { return this._element; } });
const makeList = (...elements) => listChild(...elements);

// ---- list owner (rust `arguments`): today ------------------------------------------------------
function ownerToday(value) {
  const _arguments_elements = value;
  return withMethods(withListView(withListSlots(withAccessors(
    { $type: 277, $source: 2, $named: true, _arguments_elements, $with: { argumentsElements: (value) => ownerToday(value) } },
    { argumentsElements: () => _arguments_elements }),
    [{ slot: 'argumentsElements', kind: 278, optional: true, make: makeList, element: { keys: ['attributeItem', 'expression'], make: (config) => config } }]),
    { list: { accessor: 'argumentsElements', storage: '_arguments_elements' }, elements: 'elements', count: '_element', options: [{ key: 'delimiter', default: 0 }], wrapper: { kind: 279, content: 'expression', decorations: ['_attribute_item'] } }));
}
// everything in the literal; each array method a closure over the items
function ownerClosures(value) {
  const handle = currentHandle();
  const _arguments_elements = value;
  const items = listItems(_arguments_elements, WRAPPER);
  const node = {
    $type: 277, $source: 2, $named: true, _arguments_elements,
    $with: { argumentsElements: (...args) => rebuildIn(node, handle, () => ownerClosures(listArgument(args, 278, makeList, ELEMENT))) },
    argumentsElements: () => _arguments_elements,
    delimiter: _arguments_elements === undefined ? 0 : _arguments_elements._delimiter,
    length: items.length,
    [Symbol.iterator]: () => items[Symbol.iterator](), [Symbol.isConcatSpreadable]: true, [Symbol.unscopables]: UNSCOPABLES,
    at: (...a) => items.at(...a), concat: (...a) => items.concat(...a), entries: () => items.entries(), every: (...a) => items.every(...a), filter: (...a) => items.filter(...a),
    find: (...a) => items.find(...a), findIndex: (...a) => items.findIndex(...a), findLast: (...a) => items.findLast(...a), findLastIndex: (...a) => items.findLastIndex(...a),
    flat: (...a) => items.flat(...a), flatMap: (...a) => items.flatMap(...a), forEach: (...a) => items.forEach(...a), includes: (...a) => items.includes(...a), indexOf: (...a) => items.indexOf(...a),
    join: (...a) => items.join(...a), keys: () => items.keys(), lastIndexOf: (...a) => items.lastIndexOf(...a), map: (...a) => items.map(...a), reduce: (...a) => items.reduce(...a),
    reduceRight: (...a) => items.reduceRight(...a), slice: (...a) => items.slice(...a), some: (...a) => items.some(...a), toReversed: () => items.toReversed(), toSorted: (...a) => items.toSorted(...a),
    toLocaleString: (...a) => items.toLocaleString(...a), toSpliced: (...a) => items.toSpliced(...a), toString: () => items.toString(), values: () => items.values(), with: (...a) => items.with(...a),
    $render: () => handle.current.render(node).toString(),
    $toEdit: (a, b) => [node.$render(), a, b],
    $replace: (t) => [node.$render(), t],
    $trivia: { leading: (...entries) => triviaSide(node, handle, 'leading', entries), trailing: (...entries) => triviaSide(node, handle, 'trailing', entries), inner: (...entries) => triviaSide(node, handle, 'inner', entries), innerAt: (gap, ...entries) => triviaSide(node, handle, gap, entries) },
    $engine: () => handle.current
  };
  for (let index = 0; index < items.length; index++) node[index] = items[index];
  return node;
}
// everything in the literal; the array methods are the built-in ones, named
function ownerNamed(value) {
  const handle = currentHandle();
  const _arguments_elements = value;
  const items = listItems(_arguments_elements, WRAPPER);
  const node = {
    $type: 277, $source: 2, $named: true, _arguments_elements,
    $with: { argumentsElements: (...args) => rebuildIn(node, handle, () => ownerNamed(listArgument(args, 278, makeList, ELEMENT))) },
    argumentsElements: () => _arguments_elements,
    delimiter: _arguments_elements === undefined ? 0 : _arguments_elements._delimiter,
    length: items.length,
    [Symbol.iterator]: values, [Symbol.isConcatSpreadable]: true, [Symbol.unscopables]: UNSCOPABLES,
    at, concat, entries, every, filter, find, findIndex, findLast, findLastIndex, flat, flatMap, forEach, includes, indexOf, join, keys, lastIndexOf, map, reduce, reduceRight, slice, some,
    toReversed, toSorted, toLocaleString, toSpliced, toString, values, with: arrayWith,
    $render: () => handle.current.render(node).toString(),
    $toEdit: (a, b) => [node.$render(), a, b],
    $replace: (t) => [node.$render(), t],
    $trivia: { leading: (...entries) => triviaSide(node, handle, 'leading', entries), trailing: (...entries) => triviaSide(node, handle, 'trailing', entries), inner: (...entries) => triviaSide(node, handle, 'inner', entries), innerAt: (gap, ...entries) => triviaSide(node, handle, gap, entries) },
    $engine: () => handle.current
  };
  for (let index = 0; index < items.length; index++) node[index] = items[index];
  return node;
}
// the same, the array members spread from one object
function ownerSpread(value) {
  const handle = currentHandle();
  const _arguments_elements = value;
  const items = listItems(_arguments_elements, WRAPPER);
  const node = {
    $type: 277, $source: 2, $named: true, _arguments_elements,
    $with: { argumentsElements: (...args) => rebuildIn(node, handle, () => ownerSpread(listArgument(args, 278, makeList, ELEMENT))) },
    argumentsElements: () => _arguments_elements,
    delimiter: _arguments_elements === undefined ? 0 : _arguments_elements._delimiter,
    length: items.length,
    ...LIST_MEMBERS,
    $render: () => handle.current.render(node).toString(),
    $toEdit: (a, b) => [node.$render(), a, b],
    $replace: (t) => [node.$render(), t],
    $trivia: { leading: (...entries) => triviaSide(node, handle, 'leading', entries), trailing: (...entries) => triviaSide(node, handle, 'trailing', entries), inner: (...entries) => triviaSide(node, handle, 'inner', entries), innerAt: (gap, ...entries) => triviaSide(node, handle, gap, entries) },
    $engine: () => handle.current
  };
  for (let index = 0; index < items.length; index++) node[index] = items[index];
  return node;
}
// the array methods written once, each delegating to the items the node holds under a symbol
const ITEMS = Symbol('sittir.listItems');
const DELEGATES = Object.fromEntries(READONLY_ARRAY_METHODS.map((method) => [method, function (...args) { return this[ITEMS][method](...args); }]));
const iterateItems = function () { return this[ITEMS][Symbol.iterator](); };
function ownerDelegates(value) {
  const handle = currentHandle();
  const _arguments_elements = value;
  const items = listItems(_arguments_elements, WRAPPER);
  const node = {
    $type: 277, $source: 2, $named: true, _arguments_elements,
    $with: { argumentsElements: (...args) => rebuildIn(node, handle, () => ownerDelegates(listArgument(args, 278, makeList, ELEMENT))) },
    argumentsElements: () => _arguments_elements,
    delimiter: _arguments_elements === undefined ? 0 : _arguments_elements._delimiter,
    length: items.length,
    [ITEMS]: items, [Symbol.iterator]: iterateItems, [Symbol.isConcatSpreadable]: true, [Symbol.unscopables]: UNSCOPABLES,
    at: DELEGATES.at, concat: DELEGATES.concat, entries: DELEGATES.entries, every: DELEGATES.every, filter: DELEGATES.filter, find: DELEGATES.find, findIndex: DELEGATES.findIndex,
    findLast: DELEGATES.findLast, findLastIndex: DELEGATES.findLastIndex, flat: DELEGATES.flat, flatMap: DELEGATES.flatMap, forEach: DELEGATES.forEach, includes: DELEGATES.includes,
    indexOf: DELEGATES.indexOf, join: DELEGATES.join, keys: DELEGATES.keys, lastIndexOf: DELEGATES.lastIndexOf, map: DELEGATES.map, reduce: DELEGATES.reduce, reduceRight: DELEGATES.reduceRight,
    slice: DELEGATES.slice, some: DELEGATES.some, toReversed: DELEGATES.toReversed, toSorted: DELEGATES.toSorted, toLocaleString: DELEGATES.toLocaleString, toSpliced: DELEGATES.toSpliced,
    toString: DELEGATES.toString, values: DELEGATES.values, with: DELEGATES.with,
    $render: () => handle.current.render(node).toString(),
    $toEdit: (a, b) => [node.$render(), a, b],
    $replace: (t) => [node.$render(), t],
    $trivia: { leading: (...entries) => triviaSide(node, handle, 'leading', entries), trailing: (...entries) => triviaSide(node, handle, 'trailing', entries), inner: (...entries) => triviaSide(node, handle, 'inner', entries), innerAt: (gap, ...entries) => triviaSide(node, handle, gap, entries) },
    $engine: () => handle.current
  };
  for (let index = 0; index < items.length; index++) node[index] = items[index];
  return node;
}
// reference: the array members inherited by list nodes only
const LIST_PROTO = { ...DELEGATES, [Symbol.iterator]: iterateItems, [Symbol.isConcatSpreadable]: true, [Symbol.unscopables]: UNSCOPABLES };
function ownerInherits(value) {
  const handle = currentHandle();
  const _arguments_elements = value;
  const items = listItems(_arguments_elements, WRAPPER);
  const node = Object.create(LIST_PROTO);
  node.$type = 277; node.$source = 2; node.$named = true; node._arguments_elements = _arguments_elements;
  node.$with = { argumentsElements: (...args) => rebuildIn(node, handle, () => ownerInherits(listArgument(args, 278, makeList, ELEMENT))) };
  node.argumentsElements = () => _arguments_elements;
  node.delimiter = _arguments_elements === undefined ? 0 : _arguments_elements._delimiter;
  node.length = items.length;
  node[ITEMS] = items;
  node.$render = () => handle.current.render(node).toString();
  node.$toEdit = (a, b) => [node.$render(), a, b];
  node.$replace = (t) => [node.$render(), t];
  node.$trivia = { leading: (...entries) => triviaSide(node, handle, 'leading', entries), trailing: (...entries) => triviaSide(node, handle, 'trailing', entries), inner: (...entries) => triviaSide(node, handle, 'inner', entries), innerAt: (gap, ...entries) => triviaSide(node, handle, gap, entries) };
  node.$engine = () => handle.current;
  for (let index = 0; index < items.length; index++) node[index] = items[index];
  return node;
}

// ---- group seat (rust `match_block`): today, and in the literal ----------------------------------
const groupChild = (arms, last) => ({ $type: 301, _match_arms: arms, _last_arm: last, matchArms() { return this._match_arms; }, lastArm() { return this._last_arm; }, $with: { matchArms: (...v) => groupChild(v, last), lastArm: (v) => groupChild(arms, v) } });
const makeGroup = (config) => groupChild(config.matchArms ?? [], config.lastArm);
function seatToday(value) {
  const _match_block_arms = value;
  return withMethods(withGroupSeat(withAccessors(
    { $type: 300, $source: 2, $named: true, _match_block_arms, $with: { matchBlockArms: (value) => seatToday(value) } },
    { matchBlockArms: () => _match_block_arms }),
    { slot: 'matchBlockArms', stored: '_match_block_arms', kind: 301, make: makeGroup, keys: [{ name: 'matchArms', rest: true }, { name: 'lastArm', rest: false, required: true }] }));
}
function seatLiteral(value) {
  const handle = currentHandle();
  const _match_block_arms = value;
  const node = {
    $type: 300, $source: 2, $named: true, _match_block_arms,
    $with: {
      matchBlockArms: (value) => rebuildIn(node, handle, () => seatLiteral(value)),
      matchArms: (...args) => rebuildIn(node, handle, () => seatLiteral(seatField(_match_block_arms, 'matchArms', true, args, makeGroup, ['lastArm']))),
      lastArm: (...args) => rebuildIn(node, handle, () => seatLiteral(seatField(_match_block_arms, 'lastArm', false, args, makeGroup, [])))
    },
    matchBlockArms: () => _match_block_arms,
    matchArms: _match_block_arms === undefined ? undefined : () => _match_block_arms.matchArms(),
    lastArm: _match_block_arms === undefined ? undefined : () => _match_block_arms.lastArm(),
    $render: () => handle.current.render(node).toString(),
    $toEdit: (a, b) => [node.$render(), a, b],
    $replace: (t) => [node.$render(), t],
    $trivia: { leading: (...entries) => triviaSide(node, handle, 'leading', entries), trailing: (...entries) => triviaSide(node, handle, 'trailing', entries), inner: (...entries) => triviaSide(node, handle, 'inner', entries), innerAt: (gap, ...entries) => triviaSide(node, handle, gap, entries) },
    $engine: () => handle.current
  };
  return node;
}

const x = leafOf('x'), y = leafOf('y'), z = leafOf('z');
const wrapped = { $type: 279, _attribute_item: undefined, _expression: z, expression() { return this._expression; } };
const list = listChild(x, y, wrapped);
const group = groupChild([x, y], z);
const cases = {
  ownerToday: ['list owner, today: withAccessors, withListSlots, withListView, withMethods', ownerToday, list, 'list'],
  ownerClosures: ['list owner, all in the literal, a closure per array method', ownerClosures, list, 'list'],
  ownerNamed: ['list owner, all in the literal, naming the built-in array methods', ownerNamed, list, 'list'],
  ownerDelegates: ['list owner, all in the literal, naming array methods written once over its items', ownerDelegates, list, 'list'],
  ownerSpread: ['list owner, all in the literal, array members spread from one object', ownerSpread, list, 'list'],
  ownerInherits: ['list owner, array members inherited from one object (reference)', ownerInherits, list, 'list'],
  seatToday: ['group seat, today: withAccessors, withGroupSeat, withMethods', seatToday, group, 'seat'],
  seatLiteral: ['group seat, all in the literal', seatLiteral, group, 'seat']
};
const which = process.argv[2];
if (which === undefined) { console.log(Object.keys(cases).join(' ')); process.exit(0); }
const [label, fn, child, family] = cases[which];

// the surface each form must keep
const sample = fn(child);
if (family === 'list') {
  assert.equal(sample.length, 3);
  assert.deepEqual([sample[0], sample[1], sample[2], sample[3]], [x, y, z, undefined]);
  assert.deepEqual([...sample], [x, y, z]);
  assert.deepEqual(sample.map((item) => item.$text), ['x', 'y', 'z']);
  assert.deepEqual(sample.slice(1), [y, z]);
  assert.deepEqual(sample.toReversed(), [z, y, x]);
  assert.deepEqual(sample.with(0, 'q'), ['q', y, z]);
  assert.deepEqual([...sample.entries()], [[0, x], [1, y], [2, z]]);
  assert.equal(sample.at(-1), z);
  assert.equal(sample.delimiter, 1);
  assert.deepEqual(sample.concat(fn(listChild(x))), [x, y, z, x]);
  assert.deepEqual(['q'].concat(sample), ['q', x, y, z]);
  assert.equal(String(sample), '[object Object],[object Object],[object Object]');
  assert.equal(sample.argumentsElements(), list);
  const empty = fn(undefined);
  assert.equal(empty.length, 0); assert.equal(empty[0], undefined); assert.deepEqual([...empty], []); assert.equal(empty.delimiter, 0);
  assert.equal(sample.$with.argumentsElements(x, y).length, 2);
  assert.equal(sample.$with.argumentsElements().length, 0);
} else {
  assert.deepEqual(sample.matchArms(), [x, y]);
  assert.equal(sample.lastArm(), z);
  assert.equal(sample.matchBlockArms(), group);
  assert.equal(fn(undefined).matchArms, undefined);
  assert.equal(sample.$with.lastArm(x).lastArm(), x);
  assert.deepEqual(sample.$with.matchArms(z).matchArms(), [z]);
  assert.equal(fn(undefined).$with.lastArm(y).lastArm(), y);
  assert.throws(() => fn(undefined).$with.matchArms(x), /lastArm/);
  assert.equal(fn(undefined).$with.matchArms().matchBlockArms(), undefined);
}

perCall(200000, () => fn(child));
const builds = [];
for (let r = 0; r < 9; r++) builds.push(perCall(400_000, () => fn(child)));
builds.sort((a, b) => a - b);
const COUNT = 100_000;
globalThis.gc(); const before = process.memoryUsage().heapUsed;
const keep = new Array(COUNT); for (let i = 0; i < COUNT; i++) keep[i] = fn(child);
globalThis.gc(); const bytes = (process.memoryUsage().heapUsed - before) / COUNT;
const nodes = keep.slice(1000, 2024);
const use = (n) => { let acc = 0; const t0 = performance.now(); for (let i = 0; i < n; i++) { const node = nodes[i & 1023]; acc += family === 'list' ? node.length + (node[1] === y ? 1 : 0) + node.map((item) => item).length : node.matchArms().length + (node.lastArm() === z ? 1 : 0); } if (acc === 0) throw new Error('unreachable'); return ((performance.now() - t0) / n) * 1e6; };
use(200_000);
const uses = []; for (let r = 0; r < 5; r++) uses.push(use(1_000_000));
const walk = (n) => { let acc = 0; const t0 = performance.now(); for (let i = 0; i < n; i++) { for (const [key, raw] of Object.entries(nodes[i & 1023])) { if (key === '$with' || typeof raw === 'function') continue; acc += key.length; } } if (acc === 0) throw new Error('unreachable'); return ((performance.now() - t0) / n) * 1e6; };
walk(100_000);
const walks = []; for (let r = 0; r < 5; r++) walks.push(walk(500_000));
// a projection that selects by key prefix ($ metadata, _ storage) and reads only those values
const select = (n) => { let acc = 0; const t0 = performance.now(); for (let i = 0; i < n; i++) { const node = nodes[i & 1023]; for (const key in node) { const first = key.charCodeAt(0); if (first !== 36 && first !== 95) continue; const raw = node[key]; if (typeof raw === 'function' || key === '$with' || key === '$trivia') continue; acc += key.length; } } if (acc === 0) throw new Error('unreachable'); return ((performance.now() - t0) / n) * 1e6; };
select(100_000);
const selects = []; for (let r = 0; r < 5; r++) selects.push(select(500_000));
console.log(`${Math.min(...builds).toFixed(0).padStart(6)} ${builds[4].toFixed(0).padStart(6)}  ${bytes.toFixed(0).padStart(6)}  ${String(nodes.filter(fast).length).padStart(4)}/1024  ${String(Object.keys(sample).length).padStart(3)}  ${Math.min(...uses).toFixed(0).padStart(5)}  ${Math.min(...walks).toFixed(0).padStart(5)}  ${Math.min(...selects).toFixed(0).padStart(5)}   ${label}`);

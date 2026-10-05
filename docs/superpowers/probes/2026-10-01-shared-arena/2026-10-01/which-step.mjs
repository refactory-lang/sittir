// Which step of today's withMethods takes a node out of fast-properties mode.
const fast = new Function('o', 'return %HasFastProperties(o)');
const handle = { current: { trivia: {} } };
const make = (upTo) => {
  const node = { $type: 1, $source: 2, $named: true, _left: 1, _operator: 2, _right: 3, $with: { left: (v) => v } };
  for (const key of ['left', 'operator', 'right']) Object.defineProperty(node, key, { value: () => 1, enumerable: false, writable: true, configurable: true });
  if (upTo === 'withAccessors') return node;
  Object.assign(node, { $render() { return ''; }, $toEdit() { return ''; }, $replace() { return ''; } });
  if (upTo === 'Object.assign of the three methods') return node;
  Object.defineProperty(node, '$trivia', { get() { return [this, handle]; }, enumerable: false, configurable: true });
  if (upTo === 'defineProperty $trivia, a new getter per node') return node;
  Object.defineProperty(node, '$engine', { value: () => handle.current, enumerable: false, writable: false, configurable: true });
  return node;
};
for (const step of ['withAccessors', 'Object.assign of the three methods', 'defineProperty $trivia, a new getter per node', 'defineProperty $engine']) {
  const nodes = Array.from({ length: 1000 }, () => make(step));
  console.log(`${String(nodes.filter(fast).length).padStart(4)}/1000 fast after: ${step}`);
}

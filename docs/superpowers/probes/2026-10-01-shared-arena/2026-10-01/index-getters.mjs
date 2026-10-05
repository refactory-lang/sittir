// Do index getters take a node's named properties out of fast mode?
const fast = new Function('o', 'return %HasFastProperties(o)');
const literal = () => ({ $type: 1, $source: 2, $named: true, _items: [1, 2, 3], items: () => 1, length: 3, at: () => 1, map: () => 1 });
const shared = [0, 1, 2].map((index) => ({ get() { return this._items[index]; }, enumerable: false, configurable: true }));
const perPosition = Array.from({ length: 1000 }, () => { const node = literal(); for (let i = 0; i < 3; i++) Object.defineProperty(node, i, shared[i]); return node; });
const perNode = Array.from({ length: 1000 }, () => { const node = literal(); for (let i = 0; i < 3; i++) Object.defineProperty(node, i, { get() { return node._items[i]; }, enumerable: false, configurable: true }); return node; });
const data = Array.from({ length: 1000 }, () => { const node = literal(); for (let i = 0; i < 3; i++) node[i] = i; return node; });
console.log(`${perPosition.filter(fast).length}/1000 fast: index getters, one function per position`);
console.log(`${perNode.filter(fast).length}/1000 fast: index getters, a new function per node`);
console.log(`${data.filter(fast).length}/1000 fast: index data properties`);
console.log('reads:', perPosition[5][1], perNode[5][2], data[5][0]);

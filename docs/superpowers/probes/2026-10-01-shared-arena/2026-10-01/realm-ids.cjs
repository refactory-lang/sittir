// Is the tree-id counter per JavaScript realm (globalThis) while the addon image is shared by the thread?
const vm = require('node:vm');
const { Worker, isMainThread, threadId } = require('node:worker_threads');
const addonPath = `${process.env.SITTIR_ROOT ?? process.cwd()}/rust/crates/sittir-rust/sittir-rust.darwin-arm64.node`;
const idOf = (json) => JSON.parse(json).treeId;
if (isMainThread) {
  const first = { exports: {} };
  process.dlopen(first, addonPath);
  const a = new first.exports.SittirEngine();
  console.log('main realm ids:', idOf(a.parseAndRead('fn a() {}')), idOf(a.parseAndRead('fn b() {}')), '| counter:', globalThis.__sittirNextTreeId);
  const context = vm.createContext({});
  const second = vm.runInContext('({ exports: {} })', context);
  try {
    process.dlopen(second, addonPath);
    const b = new second.exports.SittirEngine();
    console.log('second realm, same thread, ids:', idOf(b.parseAndRead('fn c() {}')), idOf(b.parseAndRead('fn d() {}')), '| its counter:', vm.runInContext('globalThis.__sittirNextTreeId', context), '| main counter:', globalThis.__sittirNextTreeId);
    console.log('same addon class object in both realms:', first.exports.SittirEngine === second.exports.SittirEngine);
  } catch (error) { console.log('second load failed:', error.message); }
  // thread ids across workers that exit
  (async () => {
    const ids = [];
    for (let i = 0; i < 4; i++) ids.push(await new Promise((resolve, reject) => { const w = new Worker(__filename); w.once('message', resolve); w.once('error', reject); }));
    console.log('thread ids of four workers run one after another:', ids.join(', '));
  })();
} else {
  require('node:worker_threads').parentPort.postMessage(threadId);
}

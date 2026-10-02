// A worker thread loading a grammar addon by itself: it reports the addon's
// tree count before and after one parse, and the id that parse was given.
import { createRequire } from 'node:module';
import { parentPort, workerData } from 'node:worker_threads';

const native = createRequire(import.meta.url)(workerData.addon);
const before = native.liveTreeCount();
const read = JSON.parse(new native.SittirEngine().parseAndRead('fn worker() {}'));
parentPort.postMessage({ before, after: native.liveTreeCount(), treeId: read.treeId });

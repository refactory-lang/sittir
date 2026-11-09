import { nativeTargetRows } from '../native-targets.ts';

const targets = process.argv.slice(2);
console.log(JSON.stringify(nativeTargetRows(targets.length === 0 ? undefined : targets)));

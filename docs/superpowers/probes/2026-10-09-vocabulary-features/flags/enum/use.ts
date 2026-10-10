import type { Added } from './feature.ts';
import { Flag } from './flags.ts';
import { Merged } from './merged.ts';

const augmented: Added | Flag.Static = Flag.Async;
const set = Flag.Static | Flag.Async;
console.log(`augmented: Flag.Async is ${String(augmented)}, and Static | Async is ${set}`);
console.log(`merged: Merged.Async is ${Merged.Async}, and Static | Async is ${Merged.Static | Merged.Async}`);

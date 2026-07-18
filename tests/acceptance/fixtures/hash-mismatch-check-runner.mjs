// Plain Node.js runner (no Vite/Vitest involved) for
// us1-hash-mismatch.test.ts. Registers hash-tamper-hook.mjs, imports the
// grammar package entry passed as argv[2] with the tamper applied, and
// prints getActiveBackend()'s result as JSON on stdout.
import { register } from 'node:module';

register(new URL('./hash-tamper-hook.mjs', import.meta.url), import.meta.url);

const target = process.argv[2];
const { getActiveBackend } = await import(target);
process.stdout.write(JSON.stringify(getActiveBackend()));

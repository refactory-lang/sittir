// Plain Node.js runner (no Vite/Vitest involved) for
// us1-hash-mismatch.test.ts. Registers hash-tamper-hook.mjs, imports the
// grammar package entry passed as argv[2] with the tamper applied, and
// prints getActiveBackend()'s result as JSON on stdout.
import { register } from 'node:module';
import { existsSync, readdirSync } from 'node:fs';
import { dirname } from 'node:path';

register(new URL('./hash-tamper-hook.mjs', import.meta.url), import.meta.url);

const target = process.argv[2];

// CI (Linux) only: this path has intermittently not existed yet at the
// exact moment this runner executes, despite the Build step (and a
// same-job diagnostic step immediately before Test) confirming it
// present moments earlier — never reproduced locally. Poll briefly
// rather than fail on the first check; if it never appears, dump the
// containing directory so the real failure (vs. this timing gap) is
// visible in the CI log.
const POLL_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 250;
for (let attempt = 0; !existsSync(target) && attempt < POLL_ATTEMPTS; attempt++) {
	await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
}
if (!existsSync(target)) {
	const dir = dirname(target);
	const listing = existsSync(dir) ? readdirSync(dir).join(', ') : '<directory does not exist>';
	throw new Error(
		`${target} still missing after ${POLL_ATTEMPTS * POLL_INTERVAL_MS}ms polling. Directory listing (${dir}): ${listing}`
	);
}

const { getActiveBackend } = await import(target);
process.stdout.write(JSON.stringify(getActiveBackend()));

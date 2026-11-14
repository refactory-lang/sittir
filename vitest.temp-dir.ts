import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll } from 'vitest';

const VARIABLES = ['TMPDIR', 'TEMP', 'TMP'] as const;
const previous = VARIABLES.map((name) => [name, process.env[name]] as const);
const scratch = mkdtempSync(join(tmpdir(), 'vitest-'));

for (const name of VARIABLES) process.env[name] = scratch;

afterAll(() => {
	for (const [name, value] of previous) {
		if (value === undefined) delete process.env[name];
		else process.env[name] = value;
	}
	rmSync(scratch, { recursive: true, force: true });
});

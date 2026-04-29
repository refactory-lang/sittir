import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const GRAMMARS = ['python', 'rust', 'typescript'] as const;
const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url)).replace(
	/\/$/,
	''
);

type Grammar = (typeof GRAMMARS)[number];

interface CheckedInHash {
	path: string;
	hash: string;
}

function readTsHash(grammar: Grammar): CheckedInHash {
	const path = resolve(repoRoot, `packages/${grammar}/src/hash.ts`);
	const text = readFileSync(path, 'utf8');
	const match = /TEMPLATE_BUNDLE_HASH\s*=\s*['"]([0-9a-f]{64})['"]/.exec(text);
	if (!match?.[1]) {
		throw new Error(`missing checked-in TS hash in ${path}`);
	}
	return { path, hash: match[1] };
}

function readNativeHash(grammar: Grammar): CheckedInHash {
	const path = resolve(repoRoot, `packages/${grammar}/rust-render/src/hash.rs`);
	const text = readFileSync(path, 'utf8');
	const match = /TEMPLATE_BUNDLE_HASH: &str = "([0-9a-f]{64})"/.exec(text);
	if (!match?.[1]) {
		throw new Error(`missing checked-in native hash in ${path}`);
	}
	return { path, hash: match[1] };
}

describe('checked-in native bundle sync', () => {
	it.each(GRAMMARS)('%s TS/native hashes match', (grammar) => {
		const ts = readTsHash(grammar);
		const native = readNativeHash(grammar);
		if (ts.hash !== native.hash) {
			throw new Error(
				[
					`checked-in template bundle hash drift for ${grammar}`,
					`  ts:     ${ts.hash} (${ts.path})`,
					`  native: ${native.hash} (${native.path})`
				].join('\n')
			);
		}
		expect(ts.hash).toBe(native.hash);
	});
});

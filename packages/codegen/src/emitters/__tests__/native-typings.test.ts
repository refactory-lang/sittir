import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const GRAMMARS = ['rust', 'typescript', 'python', 'scm', 'regex'] as const;
const ADDON_API = ['EngineOptions', 'SittirEngine', 'disposeTree', 'liveTreeCount'];

describe("each grammar's native typings", () => {
	it.each(GRAMMARS)('%s declares the addon API alone', (grammar) => {
		const dts = readFileSync(new URL(`../../../../${grammar}/native/index.d.ts`, import.meta.url), 'utf8');
		const declared = [...dts.matchAll(/^export (?:declare )?(?:class|function|interface|type|const|enum) (\w+)/gm)].map((m) => m[1]).sort();
		expect(declared).toEqual(ADDON_API);
	});
});

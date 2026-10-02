/**
 * T067 — verify leaf-factory guards.
 *
 * Pattern validation: hoisted to module-level regex consts (regex
 * literals where valid JS, `new RegExp` otherwise), checked once at
 * load time and reused per call.
 *
 * Enum validation: compile-time only via literal-union parameter type.
 * No runtime `.includes()` guard — the type system enforces it for
 * typed callers; from() resolvers use the registry `values` list.
 *
 * Word-kind keyword exclusion: always-on RESERVED_KEYWORDS check.
 */

import { beforeAll, describe, it, expect } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { generate } from '../generate.ts';

describe('leaf factory guards', () => {
	let factories: string;

	beforeAll(async () => {
		factories = (await generate({ grammar: 'rust', outputDir: '/tmp/rust-leaf-guards' })).factories;
	}, FULL_PIPELINE_TIMEOUT);

	it('hoists leaf pattern checks to module-level regex consts', () => {
		// Identifier / metavariable / shebang all carry grammar patterns.
		// They're compiled once at load time as module-level consts
		// (regex literals or new RegExp for patterns with exotic syntax).
		expect(factories).toContain('_leafRe_');
		expect(factories).toContain('does not match pattern');
	});

	it('enum factories use compile-time literal union, no runtime includes check', () => {
		// Literal-union parameter (e.g. `text: 'u8' | 'i8' | ...`)
		// is the only guard — no runtime .includes() emitted.
		expect(factories).not.toContain('.includes(text)');
	});

	it('does not emit reserved-keyword runtime check on word-kind leaves', () => {
		// The earlier heuristic ("reject text if it matches the word
		// pattern AND is in the collected keyword set") was too strict —
		// it rejected legitimate constructions like rust `_` in `'_`
		// elided lifetimes and python `print`/`match` used as
		// identifiers via grammar-declared `alias(str, $.identifier)`
		// soft-keyword mechanics. Factory leaves keep the pattern
		// check; semantic misuse (building `identifier({text:'fn'})`)
		// surfaces at tree-sitter reparse time instead.
		expect(factories).not.toContain(`throw new Error(\`identifier: text '\${text}' is a reserved keyword\`)`);
	});
});

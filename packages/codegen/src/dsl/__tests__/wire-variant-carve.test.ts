import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluate } from '../evaluate.ts';
import { EMPTY_CONFLICT_RESOLUTIONS } from '../conflict-resolutions.ts';
import { NO_FILE_TYPES } from '../../compiler/upstream-file-types.ts';

const DSL = JSON.stringify(resolve(__dirname, '../index.ts'));

async function evaluateCarve(): Promise<Record<string, unknown>> {
	const dir = mkdtempSync(join(tmpdir(), 'sittir-carve-'));
	try {
		mkdirSync(join(dir, '.sittir'));
		writeFileSync(join(dir, '.sittir', 'resolutions.json'), JSON.stringify(EMPTY_CONFLICT_RESOLUTIONS));
		writeFileSync(
			join(dir, 'base.js'),
			"module.exports = grammar({ name: 'demo', extras: ($) => [/\\s/], rules: { source: ($) => repeat($.stmt), word: () => /[a-z]+/, stmt: ($) => choice($.word, seq(seq($.word, repeat(seq(',', $.word))), optional(','))) } });\n"
		);
		writeFileSync(
			join(dir, 'grammar.sittir.ts'),
			`import base from './base.js';\nimport resolutions from './.sittir/resolutions.json' with { type: 'json' };\nimport { enrich, variant, wire } from ${DSL};\nexport default grammar(enrich(base), wire({ resolutions, name: 'demo', edits: { stmt: { 1: variant('tuple') } } }));\n`
		);
		return (await evaluate(join(dir, 'grammar.sittir.ts'), NO_FILE_TYPES)).rules as Record<string, unknown>;
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

describe('variant() carves an arm into a rule in the form enrich gives a list body', () => {
	it('flattens the nested head element of a separated list', async () => {
		const rules = await evaluateCarve();
		const carved = rules['stmt_tuple'] as { type: string; members: { type: string }[] };
		expect(carved.type).toBe('SEQ');
		expect(carved.members.map((member) => member.type)).not.toContain('SEQ');
		expect(carved.members).toHaveLength(3);
	});
});

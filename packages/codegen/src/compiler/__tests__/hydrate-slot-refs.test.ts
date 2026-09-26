import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { evaluate } from '../evaluate.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx, hydrateSlotRefs } from '../assemble.ts';
import { assertCompilation } from '../compile.ts';
import { DiagnosticSink, EmitHaltedError } from '../../types/diagnostics.ts';

async function compileGrammarSource(source: string): Promise<DiagnosticSink> {
	const dir = mkdtempSync(resolve(tmpdir(), 'sittir-hydrate-slot-refs-'));
	const entry = resolve(dir, 'grammar.js');
	writeFileSync(entry, source, 'utf8');
	try {
		const diagnostics = new DiagnosticSink();
		const raw = await evaluate(entry);
		const linked = link(raw, { diagnostics });
		const normalized = normalizeGrammar(linked);
		const nodeMap = assemble(AssembleCtx.from(normalized, undefined, diagnostics));
		hydrateSlotRefs(nodeMap, { inline: new Set(raw.inline), diagnostics, grammar: 'dr' });
		return diagnostics;
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

describe('hydrateSlotRefs — dangling internal refs', () => {
	it('fails assertCompilation, naming the unresolvable target kind', async () => {
		const diagnostics = await compileGrammarSource(
			`module.exports = grammar({
  name: "dr",
  supertypes: ($) => [$._container],
  rules: {
    root: ($) => $._container,
    _container: ($) => choice($.visible, $.ghost),
    visible: ($) => "v"
  }
});\n`
		);

		let thrown: unknown;
		try {
			assertCompilation({
				grammar: 'dr',
				raw: undefined as never,
				linked: undefined as never,
				normalized: undefined as never,
				nodeMap: undefined as never,
				diagnostics,
				slotGroupingDiagnostics: [],
				grammarDiagnostics: []
			});
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toBeInstanceOf(EmitHaltedError);
		const message = (thrown as EmitHaltedError).message;
		expect(message).toContain('dangling-internal-ref');
		expect(message).toContain('ghost');
	});
});

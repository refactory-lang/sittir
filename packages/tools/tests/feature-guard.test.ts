import { beforeAll, describe, expect, it } from 'vitest';
import { readVocabulary, readVocabularySource, VOCABULARY_DIR } from '@sittir/codegen/bindings';
import { featureGuard, guardRows, heldBy, holdsSlot, UNHELD_SLOTS } from '../src/portable/feature-guard.ts';
import { plan, type Plan } from '../src/vocabulary/plan.ts';

const CEILINGS: Readonly<Record<string, number>> = { python: 0, rust: 0, typescript: 0 };

describe('feature guard', () => {
	let p: Plan;
	let python: ReadonlySet<string>;

	beforeAll(async () => {
		p = plan(await readVocabularySource(VOCABULARY_DIR));
		python = (await readVocabulary(VOCABULARY_DIR)).featuresOf('PythonFeatures');
	});

	it('gives one row to a slot claimed from a feature the grammar does not compose', () => {
		const rows = guardRows(p, python, { paths: new Set(), slots: new Set(['type.reference.lifetime']) });
		expect(rows.filter((row) => row.side === 'claimed-not-composed')).toEqual([
			{ feature: 'Lifetimes', path: 'type.reference', slot: 'lifetime', side: 'claimed-not-composed' }
		]);
	});

	it('holds a feature with no paths or slots of its own trivially', () => {
		const contentless = [...p.features.keys()].filter(
			(name) => ![...p.kinds.values()].some((kind) => kind.feature?.name === name) && !p.aliases.some((alias) => alias.feature === name) && ![...p.owned.values()].some((slots) => [...slots.values()].some((o) => o.feature.name === name))
		);
		const rows = guardRows(p, new Set(contentless), { paths: new Set(), slots: new Set() });
		expect(contentless.length).toBeGreaterThan(0);
		expect(rows).toEqual([]);
	});

	it('exempts only owned slots that no grammar holds', async () => {
		const owned = new Set([...p.owned].flatMap(([path, slots]) => [...slots.keys()].map((slot) => `${path}.${slot}`)));
		expect(UNHELD_SLOTS.filter((key) => !owned.has(key))).toEqual([]);
		for (const grammar of Object.keys(CEILINGS)) {
			const held = await heldBy(grammar as 'python' | 'rust' | 'typescript');
			const split = (key: string): [string, string] => [key.slice(0, key.lastIndexOf('.')), key.slice(key.lastIndexOf('.') + 1)];
			expect(UNHELD_SLOTS.filter((key) => holdsSlot(held, ...split(key))), `${grammar} holds an exempted slot: drop it from UNHELD_SLOTS`).toEqual([]);
		}
	}, 600_000);

	for (const [grammar, ceiling] of Object.entries(CEILINGS))
		it(`${grammar}: ${ceiling} rows where its claims and its composition disagree`, async () => {
			const rows = await featureGuard(grammar as 'python' | 'rust' | 'typescript');
			const shown = rows.map((row) => `${row.side} ${row.feature} ${row.path}${row.slot === undefined ? '' : `.${row.slot}`}`).join('\n');
			expect(rows.length, rows.length < ceiling ? `fell to ${rows.length}: lower the ceiling\n${shown}` : `rose above the ceiling\n${shown}`).toBe(ceiling);
		}, 600_000);
});

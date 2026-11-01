import type { PortableRows, PortableTable } from '@sittir/types';
import { engineOf } from '../engine-scope.ts';
import { hasKind } from './classify.ts';

type Node = { readonly $type: number };

const rowsByLoad = new WeakMap<object, PortableRows>();

const kindsByText = new WeakMap<PortableTable, ReadonlyMap<string, readonly number[]>>();

const kindsOfText = (table: PortableTable, text: string): readonly number[] => {
	let byText = kindsByText.get(table);
	if (byText === undefined) {
		const kinds = new Map<string, number[]>();
		const literals = new Set(table.literals);
		for (const [kind, fixed] of Object.entries(table.fixedText)) if (!literals.has(Number(kind))) (kinds.get(fixed) ?? kinds.set(fixed, []).get(fixed)!).push(Number(kind));
		kindsByText.set(table, (byText = kinds));
	}
	return byText.get(text) ?? [];
};

/**
 * Records a bound grammar's rows against the descriptor function that loads them, so the language's portable guards can read a
 * bare kind id. The engine calls it when a language loads.
 */
export function registerPortableRows(load: object, rows: PortableRows): void {
	rowsByLoad.set(load, rows);
}

/** A language whose portable guards read its kind ids: its name, and the function that loads it, which its copies share. */
export interface PortableLanguage {
	readonly name: string;
	readonly load: object;
}

export const languageGuardOf =
	(language: PortableLanguage, ofLanguage: (value: unknown) => boolean, test: (rows: PortableRows, value: Node | number) => boolean) =>
	(value: unknown): value is Node | number | string => {
		if (typeof value === 'number' || typeof value === 'string') {
			const rows = rowsByLoad.get(language.load);
			if (rows === undefined)
				throw new Error(`${language.name}: a portable guard given a kind id or a token's text reads the language's rows; create an engine for ${language.name} first`);
			return typeof value === 'number' ? test(rows, value) : kindsOfText(rows.table, value).some((kind) => test(rows, kind));
		}
		if (!hasKind(value) || !ofLanguage(value)) return false;
		const rows = engineOf(value)?.portable;
		return rows !== undefined && test(rows, value);
	};

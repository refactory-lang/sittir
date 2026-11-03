import type { PortableRows } from '@sittir/types';
import { engineOf } from '../engine-scope.ts';
import { hasKind } from './classify.ts';

type Node = { readonly $type: number };

const rowsByLoad = new WeakMap<object, PortableRows>();

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
	(value: unknown): value is Node | number => {
		if (typeof value === 'number') {
			const rows = rowsByLoad.get(language.load);
			if (rows === undefined)
				throw new Error(`${language.name}: a portable guard given a kind id reads the language's rows; create an engine for ${language.name} first`);
			return test(rows, value);
		}
		if (!hasKind(value) || !ofLanguage(value)) return false;
		const rows = engineOf(value)?.portable;
		return rows !== undefined && test(rows, value);
	};

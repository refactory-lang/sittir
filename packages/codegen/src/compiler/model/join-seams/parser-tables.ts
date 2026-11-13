import type * as TS from 'web-tree-sitter';

export const NO_STATE = 0;

export interface ParserTables {
	readonly stateCount: number;
	readonly symbolCount: number;
	readonly firstNonterminal: number;
	readonly names: readonly string[];
	readonly named: Uint8Array;
	readonly visible: Uint8Array;
	readonly moves: Uint8Array;
	readonly valid: readonly Int32Array[];
	readonly idsByName: ReadonlyMap<string, readonly number[]>;
	next(state: number, symbol: number): number;
	isValid(state: number, symbol: number): boolean;
	isTerminal(symbol: number): boolean;
}

export function readParserTables(language: TS.Language, startRule: string): ParserTables {
	const stateCount = language.stateCount;
	const symbolCount = language.nodeTypeCount;
	const names: string[] = [];
	const named = new Uint8Array(symbolCount);
	const visible = new Uint8Array(symbolCount);
	const idsByName = new Map<string, number[]>();
	for (let id = 0; id < symbolCount; id++) {
		const name = language.nodeTypeForId(id) ?? '';
		names.push(name);
		named[id] = language.nodeTypeIsNamed(id) ? 1 : 0;
		visible[id] = language.nodeTypeIsVisible(id) ? 1 : 0;
		const list = idsByName.get(name);
		if (list === undefined) idsByName.set(name, [id]);
		else list.push(id);
	}
	const firstNonterminal = language.idForNodeType(startRule, true);
	if (firstNonterminal === null)
		throw new Error(`join seams: the parser has no symbol for the start rule '${startRule}'`);
	const words = (symbolCount + 31) >>> 5;
	const validBits = new Int32Array(stateCount * words);
	const valid: Int32Array[] = [];
	const nextRows: Map<number, number>[] = [];
	const moves = new Uint8Array(symbolCount);
	for (let state = 0; state < stateCount; state++) {
		const ids: number[] = [];
		const iterator = language.lookaheadIterator(state);
		if (iterator !== null) {
			for (const _ of iterator) {
				const id = iterator.currentTypeId;
				if (id !== null) ids.push(id);
			}
			iterator.delete();
		}
		const row = new Map<number, number>();
		for (const id of ids) {
			validBits[state * words + (id >>> 5)]! |= 1 << (id & 31);
			const target = language.nextState(state, id);
			if (target !== NO_STATE) {
				row.set(id, target);
				moves[id] = 1;
			}
		}
		valid.push(Int32Array.from(ids));
		nextRows.push(row);
	}
	return {
		stateCount,
		symbolCount,
		firstNonterminal,
		names,
		named,
		visible,
		moves,
		valid,
		idsByName,
		next: (state, symbol) => (state < 0 ? NO_STATE : (nextRows[state]!.get(symbol) ?? NO_STATE)),
		isValid: (state, symbol) => state >= 0 && (validBits[state * words + (symbol >>> 5)]! & (1 << (symbol & 31))) !== 0,
		isTerminal: (symbol) => symbol < firstNonterminal
	};
}

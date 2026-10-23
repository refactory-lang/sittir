import { readFileSync } from 'node:fs';

export interface DogfoodResult {
	readonly rendered: string;
	readonly reparsesEqual: boolean;
	readonly sameModuloWhitespace: boolean;
	/** The 80-character window around the first whitespace-insensitive
	 *  difference, `<target> ⟷ <rendered>`; absent when identical. */
	readonly firstDifference?: string;
}

function collapseWhitespace(s: string): string {
	return s.replace(/\s+/g, '');
}

/**
 * The dogfood contract: a rebuilt node renders to text that (1) re-parses
 * to the same node JSON as the target file and (2) is identical to the target
 * after collapsing whitespace. Layout is not the claim — canonical render
 * whitespace may differ from the author's.
 */
export function dogfoodContract(
	engine: { parse(source: string): unknown },
	rebuilt: { $render(): string },
	targetPath: string
): DogfoodResult {
	const target = readFileSync(targetPath, 'utf8');
	const rendered = rebuilt.$render();
	const reparsesEqual = JSON.stringify(engine.parse(rendered)) === JSON.stringify(engine.parse(target));
	const a = collapseWhitespace(target);
	const b = collapseWhitespace(rendered);
	if (a === b) return { rendered, reparsesEqual, sameModuloWhitespace: true };
	let i = 0;
	while (i < a.length && a[i] === b[i]) i++;
	const firstDifference = `${a.slice(Math.max(0, i - 40), i + 40)} ⟷ ${b.slice(Math.max(0, i - 40), i + 40)}`;
	return { rendered, reparsesEqual, sameModuloWhitespace: false, firstDifference };
}

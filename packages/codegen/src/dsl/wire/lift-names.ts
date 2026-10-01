import { collectSymbolRefs } from '../../util/reachable-rules.ts';
import { renameRule } from './symbol-renames.ts';

export interface LiftName {
	readonly name: string;
	readonly hoisted: boolean;
}

export function liftRenames(liftNames: ReadonlyMap<string, LiftName> | undefined): ReadonlyMap<string, string> {
	return new Map([...(liftNames ?? [])].map(([liftName, named]) => [liftName, named.name]));
}

export function assertNoRenamedExternal(externals: Iterable<string>, liftNames: ReadonlyMap<string, LiftName>): void {
	for (const name of externals) {
		if (liftNames.has(name)) throw new Error(`resolveLiftNames: the renamed lift '${name}' is an external, whose name is read before any rule runs`);
	}
}

export function resolveLiftNames(
	bodies: Map<string, unknown>,
	liftNames: ReadonlyMap<string, LiftName>,
	mints: ReadonlySet<string>,
	externals: ReadonlySet<string>
): void {
	if (liftNames.size === 0) return;
	for (const liftName of liftNames.keys()) {
		if (!mints.has(liftName)) throw new Error(`resolveLiftNames: '${liftName}' carries a variant name but is not a rule enrich minted`);
	}
	assertNoRenamedExternal(externals, liftNames);
	for (const [ruleName, body] of bodies) {
		const refs = new Set<string>();
		collectSymbolRefs(body, refs);
		for (const ref of refs) {
			const named = liftNames.get(ref);
			if (named?.hoisted === true && ref !== ruleName) {
				throw new Error(
					`variant(): the lift '${ref}' was hoisted into '${named.name}', whose body is not the lift's, but '${ruleName}' still references it; naming that reference '${named.name}' would change what '${ruleName}' matches`
				);
			}
		}
	}
	const renames = liftRenames(liftNames);
	for (const [ruleName, body] of bodies) bodies.set(ruleName, renameRule(body, renames));
}

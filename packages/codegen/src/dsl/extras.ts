export function extrasClosure(
	extras: Iterable<string>,
	subtypesOf: (name: string) => Iterable<string> | undefined
): Set<string> {
	const names = new Set<string>();
	const add = (name: string): void => {
		if (names.has(name)) return;
		names.add(name);
		for (const subtype of subtypesOf(name) ?? []) add(subtype);
	};
	for (const name of extras) add(name);
	return names;
}

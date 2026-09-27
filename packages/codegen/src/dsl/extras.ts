export function extrasClosure(
	extras: Iterable<string>,
	supertypes: Iterable<string>,
	subtypesOf: (name: string) => Iterable<string> | undefined
): Set<string> {
	const names = new Set<string>();
	const add = (name: string): void => {
		if (names.has(name)) return;
		names.add(name);
		for (const subtype of subtypesOf(name) ?? []) add(subtype);
	};
	for (const name of extras) add(name);
	const pending = new Set([...supertypes].filter((name) => !names.has(name)));
	for (let grew = true; grew; ) {
		grew = false;
		for (const name of pending) {
			const members = [...(subtypesOf(name) ?? [])];
			if (members.length === 0 || !members.every((member) => names.has(member))) continue;
			pending.delete(name);
			add(name);
			grew = true;
		}
	}
	return names;
}

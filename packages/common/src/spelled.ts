export function spelledMember<T>(text: T, spellings: Readonly<Record<string, string>> | undefined): T {
	return (typeof text === 'string' && spellings !== undefined && Object.hasOwn(spellings, text) ? spellings[text] : text) as T;
}

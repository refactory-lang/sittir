/**
 * Every node's `toJSON`, one function shared by all of them: a node has no JSON form, so `JSON.stringify`
 * refuses it.
 *
 * @throws Always, naming `toJSON`.
 */
export function refuseJSON(): never {
	throw new Error('toJSON: a node has no JSON form');
}

/**
 * The engine's `reviver`: with no node JSON to read back, `JSON.parse(text, engine.reviver)` refuses.
 *
 * @throws Always, naming `reviver`.
 */
export function refuseReviver(): never {
	throw new Error('reviver: a node has no JSON form to revive');
}

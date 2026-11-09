export function checkedKindId(value: number | bigint): number {
	if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return value;
	throw new RangeError(`a kind id is a non-negative safe integer, not ${typeof value === 'bigint' ? `${value}n` : value}`);
}

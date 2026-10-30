export const BLANK_KIND_ID = 0;

export function blankArmStored<T>(value: T | null): T | typeof BLANK_KIND_ID {
	return value === null ? BLANK_KIND_ID : value;
}

export function blankArmRead<T>(value: T): Exclude<T, typeof BLANK_KIND_ID> | null {
	return value === BLANK_KIND_ID ? null : (value as Exclude<T, typeof BLANK_KIND_ID>);
}

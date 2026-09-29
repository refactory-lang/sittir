import { Printed } from '../../src/emit/factory-source.ts';

export function expectPrinted(value: Printed | string): Printed {
	if (!(value instanceof Printed)) throw new TypeError(`expected a printed call, got the bare string ${JSON.stringify(value)}`);
	return value;
}

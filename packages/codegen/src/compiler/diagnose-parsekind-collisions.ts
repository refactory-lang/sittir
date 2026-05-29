import type { Diagnostic } from './diagnostics.ts';

export interface ParseKindCollisionDiagnostic extends Diagnostic {
	readonly code: 'parsekind-noninjective';
	readonly severity: 'error';
	readonly message: string;
	readonly canProceed: true;
	readonly ownerKind: string;
	readonly slotName: string;
	readonly shape: 'propose-distinct-alias';
	readonly parseKind: string;
	readonly storageKinds: readonly string[];
	readonly proposal: string;
}

export interface ParseKindCollisionValue<T> {
	readonly original: T;
	readonly parseKind?: string;
	readonly storageKind?: string;
	readonly structuralSignature: string;
	readonly preferRepresentative?: boolean;
}

export interface ParseKindCollisionInput<T> {
	readonly ownerKind: string;
	readonly slotName: string;
	readonly values: readonly ParseKindCollisionValue<T>[];
}

export interface ParseKindCollisionResolution<T> {
	readonly values: readonly T[];
	readonly diagnostics: readonly ParseKindCollisionDiagnostic[];
}

export function diagnoseParseKindCollisions<T>(
	input: ParseKindCollisionInput<T>
): ParseKindCollisionResolution<T> {
	const byParseKind = new Map<string, ParseKindCollisionValue<T>[]>();
	for (const value of input.values) {
		if (value.parseKind === undefined || value.storageKind === undefined) continue;
		const bucket = byParseKind.get(value.parseKind) ?? [];
		bucket.push(value);
		byParseKind.set(value.parseKind, bucket);
	}

	const mergedByParseKind = new Map<string, ParseKindCollisionValue<T>>();
	const diagnostics: ParseKindCollisionDiagnostic[] = [];

	for (const [parseKind, bucket] of byParseKind) {
		const storageKinds = distinct(bucket.map((value) => value.storageKind!));
		if (storageKinds.length <= 1) continue;
		const signatures = distinct(bucket.map((value) => value.structuralSignature));
		if (signatures.length === 1) {
			mergedByParseKind.set(parseKind, pickRepresentative(bucket, parseKind));
			continue;
		}
		diagnostics.push({
			code: 'parsekind-noninjective',
			severity: 'error',
			message:
				`Slot '${input.slotName}' of kind '${input.ownerKind}' ` +
				`collapses [${storageKinds.join(', ')}] onto parse kind '${parseKind}'.`,
			canProceed: true,
			ownerKind: input.ownerKind,
			slotName: input.slotName,
			shape: 'propose-distinct-alias',
			parseKind,
			storageKinds,
			proposal:
				`Slot '${input.slotName}' of kind '${input.ownerKind}' collapses distinct storage kinds ` +
				`[${storageKinds.join(', ')}] onto parse kind '${parseKind}'. ` +
				`Give each colliding arm a distinct alias (for example via variant()/alias()) ` +
				`so read-time dispatch stays injective.`
		});
	}

	if (mergedByParseKind.size === 0) {
		return { values: input.values.map((value) => value.original), diagnostics };
	}

	const emittedParseKinds = new Set<string>();
	const values: T[] = [];
	for (const value of input.values) {
		const parseKind = value.parseKind;
		const merged = parseKind !== undefined ? mergedByParseKind.get(parseKind) : undefined;
		if (!merged) {
			values.push(value.original);
			continue;
		}
		if (emittedParseKinds.has(parseKind)) continue;
		values.push(merged.original);
		emittedParseKinds.add(parseKind);
	}

	return { values, diagnostics };
}

function pickRepresentative<T>(
	bucket: readonly ParseKindCollisionValue<T>[],
	parseKind: string
): ParseKindCollisionValue<T> {
	const preferred =
		bucket.find((value) => value.preferRepresentative) ??
		bucket.find((value) => value.storageKind === parseKind);
	return preferred ?? bucket[0]!;
}

function distinct(values: readonly string[]): string[] {
	return [...new Set(values)];
}

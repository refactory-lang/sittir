import type { Diagnostic, Severity } from './diagnostics.ts';

export interface ParseKindCollisionDiagnostic extends Diagnostic {
	readonly code: 'parsekind-noninjective';
	readonly severity: Severity;
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
	readonly parseKindId?: number;
	readonly storageKindId?: number;
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

function kindKey(id: number | undefined, name: string): string {
	return id !== undefined ? `#${id}` : `n:${name}`;
}

export function diagnoseParseKindCollisions<T>(input: ParseKindCollisionInput<T>): ParseKindCollisionResolution<T> {
	const byParseKind = new Map<string, ParseKindCollisionValue<T>[]>();
	for (const value of input.values) {
		if (value.parseKind === undefined || value.storageKind === undefined) continue;
		const key = kindKey(value.parseKindId, value.parseKind);
		const bucket = byParseKind.get(key) ?? [];
		bucket.push(value);
		byParseKind.set(key, bucket);
	}

	const mergedByParseKind = new Map<string, ParseKindCollisionValue<T>>();
	const diagnostics: ParseKindCollisionDiagnostic[] = [];

	for (const [parseKey, bucket] of byParseKind) {
		const parseKind = bucket[0]!.parseKind!;
		const storageKinds = distinct(bucket.map((value) => value.storageKind!));
		// Distinctness by stamped id where available: same-id values are the
		// same runtime identity even under different names (hidden/visible
		// twins); the name is only the fallback key for id-less values.
		const storageIdentities = distinct(bucket.map((value) => kindKey(value.storageKindId, value.storageKind!)));
		if (storageIdentities.length <= 1) continue;
		const signatures = distinct(bucket.map((value) => value.structuralSignature));
		if (signatures.length === 1) {
			mergedByParseKind.set(parseKey, pickRepresentative(bucket, parseKind));
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

	const emittedParseKeys = new Set<string>();
	const values: T[] = [];
	for (const value of input.values) {
		if (value.parseKind === undefined) {
			values.push(value.original);
			continue;
		}
		const parseKey = kindKey(value.parseKindId, value.parseKind);
		const merged = mergedByParseKind.get(parseKey);
		if (!merged) {
			values.push(value.original);
			continue;
		}
		if (emittedParseKeys.has(parseKey)) continue;
		values.push(merged.original);
		emittedParseKeys.add(parseKey);
	}

	return { values, diagnostics };
}

function pickRepresentative<T>(
	bucket: readonly ParseKindCollisionValue<T>[],
	parseKind: string
): ParseKindCollisionValue<T> {
	const preferred =
		bucket.find((value) => value.preferRepresentative) ?? bucket.find((value) => value.storageKind === parseKind);
	return preferred ?? bucket[0]!;
}

function distinct(values: readonly string[]): string[] {
	return [...new Set(values)];
}

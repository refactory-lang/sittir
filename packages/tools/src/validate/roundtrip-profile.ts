import { createHash } from 'node:crypto';
import { appendFileSync } from 'node:fs';

export const roundtripPhases = ['read', 'copy', 'build', 'render', 'parse', 'own-render', 'own-parse', 'lead-width', 'compare', 'own-compare', 'storage-build', 'storage-compare'] as const;
export type RoundtripPhase = (typeof roundtripPhases)[number];
export interface PhaseMeasurement {
	milliseconds: number;
	calls: number;
	throws: number;
}

interface CaseStep {
	ms: number;
	calls: number;
	renders: number;
	bytes: number;
}

interface CaseRecord {
	readonly lane: string | undefined;
	readonly run: number;
	readonly entry: string;
	readonly kind: string;
	readonly start: number;
	readonly end: number;
	readonly outcomes: Record<string, string>;
	readonly steps: Partial<Record<RoundtripPhase, CaseStep>>;
}

const runsByLane = new Map<string, number>();

export class RoundtripProfile {
	readonly phases = Object.fromEntries(
		roundtripPhases.map((phase) => [phase, { milliseconds: 0, calls: 0, throws: 0 }])
	) as Record<RoundtripPhase, PhaseMeasurement>;
	private readonly cases = createHash('sha256');
	private readonly outputs = createHash('sha256');
	private readonly sourceIds = new Map<string, string>();
	private caseCount = 0;
	private renderCount = 0;
	private renderBytes = 0;
	private readonly casesPath = process.env['SITTIR_PROFILE_CASES'];
	private readonly run: number;
	private readonly records: CaseRecord[] = [];
	private open: CaseRecord | undefined;

	constructor(
		private readonly clock: () => number = () => performance.now(),
		private readonly lane?: string
	) {
		this.run = runsByLane.get(lane ?? '') ?? 0;
		runsByLane.set(lane ?? '', this.run + 1);
	}

	measure<T>(phase: RoundtripPhase, action: () => T): T {
		if (phase === 'read') this.close();
		const start = this.clock();
		const measurement = this.phases[phase];
		measurement.calls++;
		try {
			return action();
		} catch (error) {
			measurement.throws++;
			throw error;
		} finally {
			const ms = this.clock() - start;
			measurement.milliseconds += ms;
			const step = this.step(phase);
			if (step !== undefined) {
				step.ms += ms;
				step.calls++;
			}
		}
	}

	candidate(entry: string, source: string, kind: string, start: number, end: number): void {
		let sourceId = this.sourceIds.get(source);
		if (sourceId === undefined) {
			sourceId = createHash('sha256').update(source).digest('hex');
			this.sourceIds.set(source, sourceId);
		}
		this.cases.update(JSON.stringify([entry, sourceId, kind, start, end]));
		this.caseCount++;
		if (this.casesPath === undefined) return;
		this.close();
		this.open = { lane: this.lane, run: this.run, entry, kind, start, end, outcomes: {}, steps: {} };
	}

	output(kind: string, target: string, text: string, phase: RoundtripPhase = 'render'): void {
		this.outputs.update(JSON.stringify([kind, target, text]));
		this.renderCount++;
		this.renderBytes += Buffer.byteLength(text);
		this.rendered(phase, text);
	}

	rendered(phase: RoundtripPhase, text: string): void {
		const step = this.step(phase);
		if (step === undefined) return;
		step.renders++;
		step.bytes += Buffer.byteLength(text);
	}

	outcome(step: string, status: string): void {
		if (this.open !== undefined) this.open.outcomes[step] = status;
	}

	private step(phase: RoundtripPhase): CaseStep | undefined {
		if (this.open === undefined) return undefined;
		return (this.open.steps[phase] ??= { ms: 0, calls: 0, renders: 0, bytes: 0 });
	}

	private close(): void {
		if (this.open === undefined) return;
		this.records.push(this.open);
		this.open = undefined;
	}

	finish() {
		this.close();
		if (this.casesPath !== undefined && this.records.length > 0) appendFileSync(this.casesPath, `${this.records.map((record) => JSON.stringify(record)).join('\n')}\n`);
		return {
			phases: this.phases,
			work: { cases: this.caseCount, sha256: this.cases.digest('hex') },
			render: { calls: this.renderCount, bytes: this.renderBytes, sha256: this.outputs.digest('hex') }
		};
	}
}

export function measureRoundtrip<T>(profile: RoundtripProfile | undefined, phase: RoundtripPhase, action: () => T): T {
	return profile === undefined ? action() : profile.measure(phase, action);
}

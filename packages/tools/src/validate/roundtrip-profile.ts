import { createHash } from 'node:crypto';

export const roundtripPhases = ['read', 'build', 'render', 'parse'] as const;
export type RoundtripPhase = (typeof roundtripPhases)[number];
export interface PhaseMeasurement {
	milliseconds: number;
	calls: number;
	throws: number;
}

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

	constructor(private readonly clock: () => number = () => performance.now()) {}

	measure<T>(phase: RoundtripPhase, action: () => T): T {
		const start = this.clock();
		const measurement = this.phases[phase];
		measurement.calls++;
		try {
			return action();
		} catch (error) {
			measurement.throws++;
			throw error;
		} finally {
			measurement.milliseconds += this.clock() - start;
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
	}

	output(kind: string, target: string, text: string): void {
		this.outputs.update(JSON.stringify([kind, target, text]));
		this.renderCount++;
		this.renderBytes += Buffer.byteLength(text);
	}

	finish() {
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

import { DiagnosticSink } from '../types/diagnostics.ts';

export interface RunToFixpointConfig {
	readonly name: string;
	readonly cap: number;
	readonly step: () => boolean;
	readonly diagnostics: DiagnosticSink;
}

export function runToFixpoint(cfg: RunToFixpointConfig): void {
	for (let pass = 0; pass < cfg.cap; pass++) {
		if (!cfg.step()) return;
	}
	cfg.diagnostics.fail({
		code: 'fixpoint-cap-reached',
		message: `${cfg.name}: did not converge within ${cfg.cap} passes`,
		details: { pass: cfg.name, cap: cfg.cap }
	});
}

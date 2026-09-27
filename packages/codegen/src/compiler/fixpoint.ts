export interface RunToFixpointConfig {
	readonly name: string;
	readonly cap: number;
	readonly step: () => boolean;
}

export function runToFixpoint(cfg: RunToFixpointConfig): void {
	for (let pass = 0; pass < cfg.cap; pass++) {
		if (!cfg.step()) return;
	}
	throw new Error(`${cfg.name}: did not converge within ${cfg.cap} passes`);
}

import { fileURLToPath } from 'node:url';

export const engineGuard = {
	setupFiles: [fileURLToPath(new URL('./vitest.engine-guard.ts', import.meta.url))],
	sequence: { hooks: 'stack' as const }
};

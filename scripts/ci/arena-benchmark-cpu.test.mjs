import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpu, lscpuFacts } from './arena-benchmark-cpu.mjs';

const arm64 = `Architecture:                         aarch64
CPU op-mode(s):                       64-bit
Byte Order:                           Little Endian
CPU(s):                               4
Vendor ID:                            ARM
Model name:                           Neoverse-N2
Model:                                0
Thread(s) per core:                   1
L1d cache:                            256 KiB (4 instances)
L1i cache:                            256 KiB (4 instances)
L2 cache:                             4 MiB (4 instances)
L3 cache:                             32 MiB (1 instance)`;

const x64 = `Architecture:                         x86_64
Vendor ID:                            AuthenticAMD
Model name:                           AMD EPYC 9V74 80-Core Processor
L1d cache:                            64 KiB (2 instances)
L1i cache:                            64 KiB (2 instances)
L2 cache:                             2 MiB (2 instances)
L3 cache:                             32 MiB (1 instance)`;

test('an arm64 runner records its CPU by lscpu model name, which os.cpus() reports as unknown there', () => {
	assert.deepEqual(lscpuFacts(arm64), {
		model: 'Neoverse-N2',
		caches: { l1d: '256 KiB', l1i: '256 KiB', l2: '4 MiB', l3: '32 MiB' }
	});
});

test('an x64 runner records the same model os.cpus() reports', () => {
	assert.equal(lscpuFacts(x64).model, 'AMD EPYC 9V74 80-Core Processor');
});

test('a missing field is absent, not an empty string', () => {
	assert.deepEqual(lscpuFacts('Architecture: aarch64\nModel name:\n'), {
		model: undefined,
		caches: { l1d: undefined, l1i: undefined, l2: undefined, l3: undefined }
	});
});

test('this host names its CPU', () => {
	const { model } = cpu();
	assert.equal(typeof model, 'string');
	assert.notEqual(model, 'unknown');
});

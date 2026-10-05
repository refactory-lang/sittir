// Dumps every slot's stamped storage facts as JSON lines, for joining against a generated
// transport.rs: owner typeName and kind, slot name and storage name, the field storage class
// (`slot.storageInfo.kind`), the primitive classification the transport field uses, and each
// value's storage (`via` + kind).
// Usage: SITTIR_ROOT=<checkout> tsx slot-storage-dump.mts <grammar>
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const root = process.env.SITTIR_ROOT ?? process.cwd();
const grammar = process.argv[2] ?? 'rust';
const surface = await import(pathToFileURL(join(root, 'packages/tools/src/codegen-surface.ts')).href);
const shared = await import(pathToFileURL(join(root, 'packages/codegen/src/emitters/shared.ts')).href);
const nodeMap = await surface.compileNodeMap(grammar);

for (const node of nodeMap.nodes.values()) {
	for (const slot of node.slots ?? []) {
		const info = shared.resolveFieldStorageInfo(slot, nodeMap);
		const primitive = shared.classifyPrimitiveField(slot, nodeMap);
		const values = slot.values.map((v: { storage?: { via: string; kind?: string; text?: string } }) => {
			const s = shared.valueStorageOf(v, nodeMap);
			return s === undefined ? null : { via: s.via, kind: s.kind ?? null, text: s.text ?? null };
		});
		console.log(
			JSON.stringify({
				typeName: node.typeName,
				kind: node.kind,
				slot: slot.name,
				storageName: slot.storageName,
				storageKind: info.kind,
				primitive: primitive?.kind ?? null,
				values
			})
		);
	}
}

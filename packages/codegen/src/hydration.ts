/**
 * Step 12: Hydration — resolve kinds: Set<string> → kinds: HydratedNodeModel[]
 *
 * After hydration, all model properties become readonly.
 */

import type {
	NodeModel,
	FieldModel,
	ChildModel,
	HydratedNodeModel,
} from './node-model.ts';
import { isBranch, isContainer, isHidden, eachChildSlot } from './node-model.ts';

// ---------------------------------------------------------------------------
// Hydration
// ---------------------------------------------------------------------------

function hydrateField(field: FieldModel, modelMap: Map<string, NodeModel>): void {
	const resolved: NodeModel[] = [];
	for (const kind of field.kinds) {
		const model = modelMap.get(kind);
		if (model) resolved.push(model);
	}
	// Replace kinds (Set<string>) with resolved references (NodeModel[])
	(field as any).kinds = resolved;
}

function hydrateChild(child: ChildModel, modelMap: Map<string, NodeModel>): void {
	const resolved: NodeModel[] = [];
	for (const kind of child.kinds) {
		const model = modelMap.get(kind);
		if (model) resolved.push(model);
	}
	(child as any).kinds = resolved;
}

/**
 * Resolve all `kinds: Set<string>` to `kinds: NodeModel[]` references.
 * After this step, models should be treated as frozen (HydratedNodeModel).
 */
export function hydrate(models: Map<string, NodeModel>): ReadonlyMap<string, HydratedNodeModel> {
	for (const model of models.values()) {
		if (isBranch(model)) {
			for (const field of model.fields) hydrateField(field, models);
			if (model.children) {
				eachChildSlot(model.children, (child) => hydrateChild(child, models));
			}
		}
		if (isContainer(model)) {
			eachChildSlot(model.children, (child) => hydrateChild(child, models));
		}
		if (isHidden(model)) {
			const resolved: NodeModel[] = [];
			for (const kind of model.subtypes) {
				const sub = models.get(kind);
				if (sub) resolved.push(sub);
			}
			(model as any).subtypes = resolved;
		}
	}

	// Return as hydrated (the mutation above made kinds into NodeModel[])
	return models as unknown as ReadonlyMap<string, HydratedNodeModel>;
}

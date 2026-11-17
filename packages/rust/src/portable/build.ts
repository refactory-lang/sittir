import type { Engine } from '@sittir/types';
import type { BuildInput } from '@sittir/types/vocabulary';
import type { RustAPI } from '../api.js';
import type { RustMap } from './map.js';
export function portableBuild(engine: Engine<RustAPI>) {
	const b = engine.build;
	const unbuilt = (
		owner: string,
		value: {
			readonly $path: string;
		}
	): never => {
		throw new Error(owner + ': ' + value.$path + ' is not generated');
	};
	const seated = <
		V extends
			| number
			| {
					readonly $type: number;
			  },
		const T extends readonly number[]
	>(
		value: V,
		kinds: T
	): value is Extract<
		V,
		| T[number]
		| {
				readonly $type: T[number];
		  }
	> => kinds.includes(typeof value === 'number' ? value : value.$type);
	const unseated = (
		owner: string,
		value:
			| number
			| {
					readonly $type: number;
			  }
	): never => {
		throw new Error(owner + ' has no seat for kind ' + (typeof value === 'number' ? value : value.$type));
	};
	const clause_bounds_removed$218_type = (
		value:
			| string
			| BuildInput<RustMap, 'clause.bounds.removed'>
			| RustMap['nodes']['clause.bounds.removed']
			| BuildInput<RustMap, 'expression.call.macro'>
			| RustMap['nodes']['expression.call.macro']
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.abstract'>
			| RustMap['nodes']['type.abstract']
			| BuildInput<RustMap, 'type.array'>
			| RustMap['nodes']['type.array']
			| BuildInput<RustMap, 'type.bounded'>
			| RustMap['nodes']['type.bounded']
			| BuildInput<RustMap, 'type.dynamic'>
			| RustMap['nodes']['type.dynamic']
			| BuildInput<RustMap, 'type.function'>
			| RustMap['nodes']['type.function']
			| BuildInput<RustMap, 'type.generic'>
			| RustMap['nodes']['type.generic']
			| BuildInput<RustMap, 'type.pointer'>
			| RustMap['nodes']['type.pointer']
			| BuildInput<RustMap, 'type.reference'>
			| RustMap['nodes']['type.reference']
			| BuildInput<RustMap, 'type.tuple'>
			| RustMap['nodes']['type.tuple']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case '!':
					return 254;
				case '()':
					return 244;
				case 'bool':
					return 72;
				case 'char':
					return 74;
				case 'f32':
					return 70;
				case 'f64':
					return 71;
				case 'i128':
					return 67;
				case 'i16':
					return 61;
				case 'i32':
					return 63;
				case 'i64':
					return 65;
				case 'i8':
					return 59;
				case 'isize':
					return 68;
				case 'str':
					return 73;
				case 'u128':
					return 66;
				case 'u16':
					return 60;
				case 'u32':
					return 62;
				case 'u64':
					return 64;
				case 'u8':
					return 58;
				case 'usize':
					return 69;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [127, 218, 236, 240, 242, 243, 246, 248, 252, 253, 255, 256, 259, 265, 341, 388, 389, 484]))
				return value;
			return unseated('clause.bounds.removed.type', value);
		}
		if (engine.isNode(value)) {
			if (
				seated(
					value,
					[
						58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 127, 218, 236, 240, 242, 243, 244, 246,
						248, 252, 253, 254, 255, 256, 259, 265, 341, 388, 389, 484
					]
				)
			)
				return value;
			return unseated('clause.bounds.removed.type', value);
		}
		switch (value.$path) {
			case 'clause.bounds.removed':
				return clause_bounds_removed$218(value);
			case 'expression.call.macro':
				return expression_call_macro$259(value);
			case 'identifier':
				return unbuilt('clause.bounds.removed.type', value);
			case 'identifier.metavariable':
				return unbuilt('clause.bounds.removed.type', value);
			case 'identifier.qualified':
				return identifier_qualified$265(value);
			case 'type.abstract':
				return unbuilt('clause.bounds.removed.type', value);
			case 'type.array':
				return unbuilt('clause.bounds.removed.type', value);
			case 'type.bounded':
				return type_bounded$248(value);
			case 'type.dynamic':
				return type_dynamic$256(value);
			case 'type.function':
				return unbuilt('clause.bounds.removed.type', value);
			case 'type.generic':
				return unbuilt('clause.bounds.removed.type', value);
			case 'type.pointer':
				if ((value.$flags ?? []).includes('writable') && value.type !== undefined) return type_pointer$389(value);
				return type_pointer$388(value);
			case 'type.reference':
				return type_reference$252(value);
			case 'type.tuple':
				return unbuilt('clause.bounds.removed.type', value);
			default:
				return unbuilt('clause.bounds.removed.type', value);
		}
	};
	const clause_bounds_use$249_bounds$item = (
		value:
			| string
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.lifetime'>
			| RustMap['nodes']['identifier.lifetime']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [239, 484])) return value;
			return unseated('clause.bounds.use.bounds', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [239, 484])) return value;
			return unseated('clause.bounds.use.bounds', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('clause.bounds.use.bounds', value);
			case 'identifier.lifetime':
				return identifier_lifetime$239(value);
			default:
				return unbuilt('clause.bounds.use.bounds', value);
		}
	};
	const clause_else$291_body = (
		value:
			| BuildInput<RustMap, 'statement.block'>
			| RustMap['nodes']['statement.block']
			| BuildInput<RustMap, 'statement.if'>
			| RustMap['nodes']['statement.if']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [287, 313])) return value;
			return unseated('clause.else.body', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [287, 313])) return value;
			return unseated('clause.else.body', value);
		}
		switch (value.$path) {
			case 'statement.block':
				return unbuilt('clause.else.body', value);
			case 'statement.if':
				return unbuilt('clause.else.body', value);
			default:
				return unbuilt('clause.else.body', value);
		}
	};
	const clause_import_alias$228_name = (
		value:
			| string
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case 'crate':
					return 126;
				case 'self':
					return 481;
				case 'super':
					return 125;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 127, 263])) return value;
			return unseated('clause.import.alias.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 125, 126, 127, 263, 481])) return value;
			return unseated('clause.import.alias.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('clause.import.alias.name', value);
			case 'identifier.metavariable':
				return unbuilt('clause.import.alias.name', value);
			case 'identifier.qualified':
				return identifier_qualified$263(value);
			default:
				return unbuilt('clause.import.alias.name', value);
		}
	};
	const clause_import_alias$228_rename = (
		value: string | BuildInput<RustMap, 'identifier'> | RustMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1])) return value;
			return unseated('clause.import.alias.rename', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1])) return value;
			return unseated('clause.import.alias.rename', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('clause.import.alias.rename', value);
			default:
				return unbuilt('clause.import.alias.rename', value);
		}
	};
	const clause_import_list$227_useClauses$item = (
		value:
			| string
			| BuildInput<RustMap, 'clause.import.alias'>
			| RustMap['nodes']['clause.import.alias']
			| BuildInput<RustMap, 'clause.import.list'>
			| RustMap['nodes']['clause.import.list']
			| BuildInput<RustMap, 'clause.import.list.scoped'>
			| RustMap['nodes']['clause.import.list.scoped']
			| BuildInput<RustMap, 'clause.import.wildcard'>
			| RustMap['nodes']['clause.import.wildcard']
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case 'crate':
					return 126;
				case 'self':
					return 481;
				case 'super':
					return 125;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 127, 226, 227, 228, 229, 263])) return value;
			return unseated('clause.import.list.useClauses', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 125, 126, 127, 226, 227, 228, 229, 263, 481])) return value;
			return unseated('clause.import.list.useClauses', value);
		}
		switch (value.$path) {
			case 'clause.import.alias':
				return clause_import_alias$228(value);
			case 'clause.import.list':
				return clause_import_list$227(value);
			case 'clause.import.list.scoped':
				return clause_import_list_scoped$226(value);
			case 'clause.import.wildcard':
				return clause_import_wildcard$229(value);
			case 'identifier':
				return unbuilt('clause.import.list.useClauses', value);
			case 'identifier.metavariable':
				return unbuilt('clause.import.list.useClauses', value);
			case 'identifier.qualified':
				return identifier_qualified$263(value);
			default:
				return unbuilt('clause.import.list.useClauses', value);
		}
	};
	const clause_import_list_scoped$226_list = (
		value: BuildInput<RustMap, 'clause.import.list'> | RustMap['nodes']['clause.import.list']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [227])) return value;
			return unseated('clause.import.list.scoped.list', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [227])) return value;
			return unseated('clause.import.list.scoped.list', value);
		}
		switch (value.$path) {
			case 'clause.import.list':
				return clause_import_list$227(value);
			default:
				return unbuilt('clause.import.list.scoped.list', value);
		}
	};
	const clause_import_list_scoped$226_path = (
		value:
			| string
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case 'crate':
					return 126;
				case 'self':
					return 481;
				case 'super':
					return 125;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 127, 263])) return value;
			return unseated('clause.import.list.scoped.path', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 125, 126, 127, 263, 481])) return value;
			return unseated('clause.import.list.scoped.path', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('clause.import.list.scoped.path', value);
			case 'identifier.metavariable':
				return unbuilt('clause.import.list.scoped.path', value);
			case 'identifier.qualified':
				return identifier_qualified$263(value);
			default:
				return unbuilt('clause.import.list.scoped.path', value);
		}
	};
	const clause_import_wildcard$229_useWildcardGroup = (value: never) => {
		if (typeof value === 'number') {
			if (seated(value, [359])) return value;
			return unseated('clause.import.wildcard.useWildcardGroup', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [359])) return value;
			return unseated('clause.import.wildcard.useWildcardGroup', value);
		}
		throw new Error('clause.import.wildcard.useWildcardGroup takes no structure');
	};
	const clause_macro_rule$181_left = (
		value:
			| BuildInput<RustMap, 'element.macro.token_tree.pattern.brace'>
			| RustMap['nodes']['element.macro.token_tree.pattern.brace']
			| BuildInput<RustMap, 'element.macro.token_tree.pattern.bracket'>
			| RustMap['nodes']['element.macro.token_tree.pattern.bracket']
			| BuildInput<RustMap, 'element.macro.token_tree.pattern.paren'>
			| RustMap['nodes']['element.macro.token_tree.pattern.paren']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [183, 405, 406, 407])) return value;
			return unseated('clause.macro.rule.left', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [183, 405, 406, 407])) return value;
			return unseated('clause.macro.rule.left', value);
		}
		switch (value.$path) {
			case 'element.macro.token_tree.pattern.brace':
				return unbuilt('clause.macro.rule.left', value);
			case 'element.macro.token_tree.pattern.bracket':
				return unbuilt('clause.macro.rule.left', value);
			case 'element.macro.token_tree.pattern.paren':
				return unbuilt('clause.macro.rule.left', value);
			default:
				return unbuilt('clause.macro.rule.left', value);
		}
	};
	const clause_macro_rule$181_right = (
		value:
			| BuildInput<RustMap, 'element.macro.token_tree.brace'>
			| RustMap['nodes']['element.macro.token_tree.brace']
			| BuildInput<RustMap, 'element.macro.token_tree.bracket'>
			| RustMap['nodes']['element.macro.token_tree.bracket']
			| BuildInput<RustMap, 'element.macro.token_tree.paren'>
			| RustMap['nodes']['element.macro.token_tree.paren']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [187, 408, 409, 410])) return value;
			return unseated('clause.macro.rule.right', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [187, 408, 409, 410])) return value;
			return unseated('clause.macro.rule.right', value);
		}
		switch (value.$path) {
			case 'element.macro.token_tree.brace':
				return unbuilt('clause.macro.rule.right', value);
			case 'element.macro.token_tree.bracket':
				return unbuilt('clause.macro.rule.right', value);
			case 'element.macro.token_tree.paren':
				return unbuilt('clause.macro.rule.right', value);
			default:
				return unbuilt('clause.macro.rule.right', value);
		}
	};
	const clause_where$211_wherePredicates$item = (
		value: BuildInput<RustMap, 'clause.where.predicate'> | RustMap['nodes']['clause.where.predicate']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [212])) return value;
			return unseated('clause.where.wherePredicates', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [212])) return value;
			return unseated('clause.where.wherePredicates', value);
		}
		switch (value.$path) {
			case 'clause.where.predicate':
				return unbuilt('clause.where.wherePredicates', value);
			default:
				return unbuilt('clause.where.wherePredicates', value);
		}
	};
	const declaration_macro$416_name = (
		value: string | BuildInput<RustMap, 'identifier'> | RustMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1])) return value;
			return unseated('declaration.macro.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1])) return value;
			return unseated('declaration.macro.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('declaration.macro.name', value);
			default:
				return unbuilt('declaration.macro.name', value);
		}
	};
	const declaration_macro$416_rules$item = (
		value: BuildInput<RustMap, 'clause.macro.rule'> | RustMap['nodes']['clause.macro.rule']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [181])) return value;
			return unseated('declaration.macro.rules', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [181])) return value;
			return unseated('declaration.macro.rules', value);
		}
		switch (value.$path) {
			case 'clause.macro.rule':
				return clause_macro_rule$181(value);
			default:
				return unbuilt('declaration.macro.rules', value);
		}
	};
	const declaration_macro_brace$418_name = (
		value: string | BuildInput<RustMap, 'identifier'> | RustMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1])) return value;
			return unseated('declaration.macro.brace.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1])) return value;
			return unseated('declaration.macro.brace.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('declaration.macro.brace.name', value);
			default:
				return unbuilt('declaration.macro.brace.name', value);
		}
	};
	const declaration_macro_brace$418_rules$item = (
		value: BuildInput<RustMap, 'clause.macro.rule'> | RustMap['nodes']['clause.macro.rule']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [181])) return value;
			return unseated('declaration.macro.brace.rules', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [181])) return value;
			return unseated('declaration.macro.brace.rules', value);
		}
		switch (value.$path) {
			case 'clause.macro.rule':
				return clause_macro_rule$181(value);
			default:
				return unbuilt('declaration.macro.brace.rules', value);
		}
	};
	const declaration_macro_bracket$417_name = (
		value: string | BuildInput<RustMap, 'identifier'> | RustMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1])) return value;
			return unseated('declaration.macro.bracket.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1])) return value;
			return unseated('declaration.macro.bracket.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('declaration.macro.bracket.name', value);
			default:
				return unbuilt('declaration.macro.bracket.name', value);
		}
	};
	const declaration_macro_bracket$417_rules$item = (
		value: BuildInput<RustMap, 'clause.macro.rule'> | RustMap['nodes']['clause.macro.rule']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [181])) return value;
			return unseated('declaration.macro.bracket.rules', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [181])) return value;
			return unseated('declaration.macro.bracket.rules', value);
		}
		switch (value.$path) {
			case 'clause.macro.rule':
				return clause_macro_rule$181(value);
			default:
				return unbuilt('declaration.macro.bracket.rules', value);
		}
	};
	const declaration_macro_paren$416_name = (
		value: string | BuildInput<RustMap, 'identifier'> | RustMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1])) return value;
			return unseated('declaration.macro.paren.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1])) return value;
			return unseated('declaration.macro.paren.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('declaration.macro.paren.name', value);
			default:
				return unbuilt('declaration.macro.paren.name', value);
		}
	};
	const declaration_macro_paren$416_rules$item = (
		value: BuildInput<RustMap, 'clause.macro.rule'> | RustMap['nodes']['clause.macro.rule']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [181])) return value;
			return unseated('declaration.macro.paren.rules', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [181])) return value;
			return unseated('declaration.macro.paren.rules', value);
		}
		switch (value.$path) {
			case 'clause.macro.rule':
				return clause_macro_rule$181(value);
			default:
				return unbuilt('declaration.macro.paren.rules', value);
		}
	};
	const declaration_module$384_name = (
		value: string | BuildInput<RustMap, 'identifier'> | RustMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1])) return value;
			return unseated('declaration.module.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1])) return value;
			return unseated('declaration.module.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('declaration.module.name', value);
			default:
				return unbuilt('declaration.module.name', value);
		}
	};
	const declaration_module_foreign$395_extern = (
		value: BuildInput<RustMap, 'modifier.extern'> | RustMap['nodes']['modifier.extern']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [234])) return value;
			return unseated('declaration.module.foreign.extern', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [234])) return value;
			return unseated('declaration.module.foreign.extern', value);
		}
		switch (value.$path) {
			case 'modifier.extern':
				return modifier_extern$234(value);
			default:
				return unbuilt('declaration.module.foreign.extern', value);
		}
	};
	const element_macro_token_binding$184_fragment = (value: string) => {
		if (typeof value === 'string') {
			switch (value) {
				case 'block':
					return 11;
				case 'expr':
					return 12;
				case 'expr_2021':
					return 13;
				case 'ident':
					return 14;
				case 'item':
					return 15;
				case 'lifetime':
					return 16;
				case 'literal':
					return 17;
				case 'meta':
					return 18;
				case 'pat':
					return 19;
				case 'pat_param':
					return 20;
				case 'path':
					return 21;
				case 'stmt':
					return 22;
				case 'tt':
					return 23;
				case 'ty':
					return 24;
				case 'vis':
					return 25;
				default:
					return value;
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [186])) return value;
			return unseated('element.macro.token_binding.fragment', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 186])) return value;
			return unseated('element.macro.token_binding.fragment', value);
		}
		throw new Error('element.macro.token_binding.fragment takes no structure');
	};
	const element_macro_token_binding$184_name = (
		value: BuildInput<RustMap, 'identifier.metavariable'> | RustMap['nodes']['identifier.metavariable']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [127])) return value;
			return unseated('element.macro.token_binding.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [127])) return value;
			return unseated('element.macro.token_binding.name', value);
		}
		switch (value.$path) {
			case 'identifier.metavariable':
				return unbuilt('element.macro.token_binding.name', value);
			default:
				return unbuilt('element.macro.token_binding.name', value);
		}
	};
	const element_struct_field$284_attributes = (
		value: BuildInput<RustMap, 'attribute'> | RustMap['nodes']['attribute']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [192])) return b.attributeItem(value);
			return unseated('element.struct.field.attributes', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [192])) return b.attributeItem(value);
			return unseated('element.struct.field.attributes', value);
		}
		switch (value.$path) {
			case 'attribute':
				return unbuilt('element.struct.field.attributes', value);
			default:
				return unbuilt('element.struct.field.attributes', value);
		}
	};
	const element_struct_field$284_name = (
		value:
			| string
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'literal.number.integer'>
			| RustMap['nodes']['literal.number.integer']
			| BuildInput<RustMap, 'literal.number.integer.binary'>
			| RustMap['nodes']['literal.number.integer.binary']
			| BuildInput<RustMap, 'literal.number.integer.hex'>
			| RustMap['nodes']['literal.number.integer.hex']
			| BuildInput<RustMap, 'literal.number.integer.octal'>
			| RustMap['nodes']['literal.number.integer.octal']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1])) return value;
			return unseated('element.struct.field.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1])) return value;
			return unseated('element.struct.field.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('element.struct.field.name', value);
			case 'literal.number.integer':
				return unbuilt('element.struct.field.name', value);
			case 'literal.number.integer.binary':
				return unbuilt('element.struct.field.name', value);
			case 'literal.number.integer.hex':
				return unbuilt('element.struct.field.name', value);
			case 'literal.number.integer.octal':
				return unbuilt('element.struct.field.name', value);
			default:
				return unbuilt('element.struct.field.name', value);
		}
	};
	const element_type_binding$251_name = (
		value: string | BuildInput<RustMap, 'identifier'> | RustMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [484])) return value;
			return unseated('element.type_binding.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [484])) return value;
			return unseated('element.type_binding.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('element.type_binding.name', value);
			default:
				return unbuilt('element.type_binding.name', value);
		}
	};
	const element_type_binding$251_type = (
		value:
			| string
			| BuildInput<RustMap, 'clause.bounds.removed'>
			| RustMap['nodes']['clause.bounds.removed']
			| BuildInput<RustMap, 'expression.call.macro'>
			| RustMap['nodes']['expression.call.macro']
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.abstract'>
			| RustMap['nodes']['type.abstract']
			| BuildInput<RustMap, 'type.array'>
			| RustMap['nodes']['type.array']
			| BuildInput<RustMap, 'type.bounded'>
			| RustMap['nodes']['type.bounded']
			| BuildInput<RustMap, 'type.dynamic'>
			| RustMap['nodes']['type.dynamic']
			| BuildInput<RustMap, 'type.function'>
			| RustMap['nodes']['type.function']
			| BuildInput<RustMap, 'type.generic'>
			| RustMap['nodes']['type.generic']
			| BuildInput<RustMap, 'type.pointer'>
			| RustMap['nodes']['type.pointer']
			| BuildInput<RustMap, 'type.reference'>
			| RustMap['nodes']['type.reference']
			| BuildInput<RustMap, 'type.tuple'>
			| RustMap['nodes']['type.tuple']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case '!':
					return 254;
				case '()':
					return 244;
				case 'bool':
					return 72;
				case 'char':
					return 74;
				case 'f32':
					return 70;
				case 'f64':
					return 71;
				case 'i128':
					return 67;
				case 'i16':
					return 61;
				case 'i32':
					return 63;
				case 'i64':
					return 65;
				case 'i8':
					return 59;
				case 'isize':
					return 68;
				case 'str':
					return 73;
				case 'u128':
					return 66;
				case 'u16':
					return 60;
				case 'u32':
					return 62;
				case 'u64':
					return 64;
				case 'u8':
					return 58;
				case 'usize':
					return 69;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [127, 218, 236, 240, 242, 243, 246, 248, 252, 253, 255, 256, 259, 265, 341, 388, 389, 484]))
				return value;
			return unseated('element.type_binding.type', value);
		}
		if (engine.isNode(value)) {
			if (
				seated(
					value,
					[
						58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 127, 218, 236, 240, 242, 243, 244, 246,
						248, 252, 253, 254, 255, 256, 259, 265, 341, 388, 389, 484
					]
				)
			)
				return value;
			return unseated('element.type_binding.type', value);
		}
		switch (value.$path) {
			case 'clause.bounds.removed':
				return clause_bounds_removed$218(value);
			case 'expression.call.macro':
				return expression_call_macro$259(value);
			case 'identifier':
				return unbuilt('element.type_binding.type', value);
			case 'identifier.metavariable':
				return unbuilt('element.type_binding.type', value);
			case 'identifier.qualified':
				return identifier_qualified$265(value);
			case 'type.abstract':
				return unbuilt('element.type_binding.type', value);
			case 'type.array':
				return unbuilt('element.type_binding.type', value);
			case 'type.bounded':
				return type_bounded$248(value);
			case 'type.dynamic':
				return type_dynamic$256(value);
			case 'type.function':
				return unbuilt('element.type_binding.type', value);
			case 'type.generic':
				return unbuilt('element.type_binding.type', value);
			case 'type.pointer':
				if ((value.$flags ?? []).includes('writable') && value.type !== undefined) return type_pointer$389(value);
				return type_pointer$388(value);
			case 'type.reference':
				return type_reference$252(value);
			case 'type.tuple':
				return unbuilt('element.type_binding.type', value);
			default:
				return unbuilt('element.type_binding.type', value);
		}
	};
	const element_type_binding$251_typeArguments$item = (
		value: BuildInput<RustMap, 'element.type_argument'> | RustMap['nodes']['element.type_argument']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [433])) return value;
			return unseated('element.type_binding.typeArguments', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [433])) return value;
			return unseated('element.type_binding.typeArguments', value);
		}
		switch (value.$path) {
			case 'element.type_argument':
				return unbuilt('element.type_binding.typeArguments', value);
			default:
				return unbuilt('element.type_binding.typeArguments', value);
		}
	};
	const expression_block_async$310_body = (
		value: BuildInput<RustMap, 'statement.block'> | RustMap['nodes']['statement.block']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [313])) return value;
			return unseated('expression.block.async.body', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [313])) return value;
			return unseated('expression.block.async.body', value);
		}
		switch (value.$path) {
			case 'statement.block':
				return unbuilt('expression.block.async.body', value);
			default:
				return unbuilt('expression.block.async.body', value);
		}
	};
	const expression_block_const$300_body = (
		value: BuildInput<RustMap, 'statement.block'> | RustMap['nodes']['statement.block']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [313])) return value;
			return unseated('expression.block.const.body', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [313])) return value;
			return unseated('expression.block.const.body', value);
		}
		switch (value.$path) {
			case 'statement.block':
				return unbuilt('expression.block.const.body', value);
			default:
				return unbuilt('expression.block.const.body', value);
		}
	};
	const expression_block_generator$311_body = (
		value: BuildInput<RustMap, 'statement.block'> | RustMap['nodes']['statement.block']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [313])) return value;
			return unseated('expression.block.generator.body', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [313])) return value;
			return unseated('expression.block.generator.body', value);
		}
		switch (value.$path) {
			case 'statement.block':
				return unbuilt('expression.block.generator.body', value);
			default:
				return unbuilt('expression.block.generator.body', value);
		}
	};
	const expression_block_try$312_body = (
		value: BuildInput<RustMap, 'statement.block'> | RustMap['nodes']['statement.block']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [313])) return value;
			return unseated('expression.block.try.body', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [313])) return value;
			return unseated('expression.block.try.body', value);
		}
		switch (value.$path) {
			case 'statement.block':
				return unbuilt('expression.block.try.body', value);
			default:
				return unbuilt('expression.block.try.body', value);
		}
	};
	const expression_block_unsafe$309_body = (
		value: BuildInput<RustMap, 'statement.block'> | RustMap['nodes']['statement.block']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [313])) return value;
			return unseated('expression.block.unsafe.body', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [313])) return value;
			return unseated('expression.block.unsafe.body', value);
		}
		switch (value.$path) {
			case 'statement.block':
				return unbuilt('expression.block.unsafe.body', value);
			default:
				return unbuilt('expression.block.unsafe.body', value);
		}
	};
	const expression_call_macro$259_arguments = (
		value:
			| BuildInput<RustMap, 'element.macro.token_tree.delimited.brace'>
			| RustMap['nodes']['element.macro.token_tree.delimited.brace']
			| BuildInput<RustMap, 'element.macro.token_tree.delimited.bracket'>
			| RustMap['nodes']['element.macro.token_tree.delimited.bracket']
			| BuildInput<RustMap, 'element.macro.token_tree.delimited.paren'>
			| RustMap['nodes']['element.macro.token_tree.delimited.paren']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [260, 411, 412, 413])) return value;
			return unseated('expression.call.macro.arguments', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [260, 411, 412, 413])) return value;
			return unseated('expression.call.macro.arguments', value);
		}
		switch (value.$path) {
			case 'element.macro.token_tree.delimited.brace':
				return unbuilt('expression.call.macro.arguments', value);
			case 'element.macro.token_tree.delimited.bracket':
				return unbuilt('expression.call.macro.arguments', value);
			case 'element.macro.token_tree.delimited.paren':
				return unbuilt('expression.call.macro.arguments', value);
			default:
				return unbuilt('expression.call.macro.arguments', value);
		}
	};
	const expression_call_macro$259_function = (
		value:
			| string
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 263])) return value;
			return unseated('expression.call.macro.function', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 263])) return value;
			return unseated('expression.call.macro.function', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('expression.call.macro.function', value);
			case 'identifier.qualified':
				return identifier_qualified$263(value);
			default:
				return unbuilt('expression.call.macro.function', value);
		}
	};
	const expression_collection_struct$282_body$item = (
		value:
			| BuildInput<RustMap, 'element.struct.base'>
			| RustMap['nodes']['element.struct.base']
			| BuildInput<RustMap, 'element.struct.field'>
			| RustMap['nodes']['element.struct.field']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [284, 285, 286])) return value;
			return unseated('expression.collection.struct.body', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [284, 285, 286])) return value;
			return unseated('expression.collection.struct.body', value);
		}
		switch (value.$path) {
			case 'element.struct.base':
				return unbuilt('expression.collection.struct.body', value);
			case 'element.struct.field':
				if (value.name !== undefined && value.value === undefined) return element_struct_field$284(value);
				return unbuilt('expression.collection.struct.body', value);
			default:
				return unbuilt('expression.collection.struct.body', value);
		}
	};
	const expression_collection_struct$282_name = (
		value:
			| string
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.generic.turbofish'>
			| RustMap['nodes']['type.generic.turbofish']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [247, 264, 484])) return value;
			return unseated('expression.collection.struct.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [247, 264, 484])) return value;
			return unseated('expression.collection.struct.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('expression.collection.struct.name', value);
			case 'identifier.qualified':
				return identifier_qualified$264(value);
			case 'type.generic.turbofish':
				return unbuilt('expression.collection.struct.name', value);
			default:
				return unbuilt('expression.collection.struct.name', value);
		}
	};
	const identifier_label$303_name = (
		value: string | BuildInput<RustMap, 'identifier'> | RustMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1])) return value;
			return unseated('identifier.label.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1])) return value;
			return unseated('identifier.label.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('identifier.label.name', value);
			default:
				return unbuilt('identifier.label.name', value);
		}
	};
	const identifier_lifetime$239_name = (
		value: string | BuildInput<RustMap, 'identifier'> | RustMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1])) return value;
			return unseated('identifier.lifetime.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1])) return value;
			return unseated('identifier.lifetime.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('identifier.lifetime.name', value);
			default:
				return unbuilt('identifier.lifetime.name', value);
		}
	};
	const identifier_qualified$263_name = (
		value: string | BuildInput<RustMap, 'identifier'> | RustMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case 'super':
					return 125;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [1])) return value;
			return unseated('identifier.qualified.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 125])) return value;
			return unseated('identifier.qualified.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('identifier.qualified.name', value);
			default:
				return unbuilt('identifier.qualified.name', value);
		}
	};
	const identifier_qualified$263_qualifier = (
		value:
			| string
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.bracketed'>
			| RustMap['nodes']['type.bracketed']
			| BuildInput<RustMap, 'type.generic'>
			| RustMap['nodes']['type.generic']
			| BuildInput<RustMap, 'type.generic.turbofish'>
			| RustMap['nodes']['type.generic.turbofish']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case 'crate':
					return 126;
				case 'self':
					return 481;
				case 'super':
					return 125;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 127, 237, 247, 263])) return value;
			return unseated('identifier.qualified.qualifier', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 125, 126, 127, 237, 247, 263, 481])) return value;
			return unseated('identifier.qualified.qualifier', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('identifier.qualified.qualifier', value);
			case 'identifier.metavariable':
				return unbuilt('identifier.qualified.qualifier', value);
			case 'identifier.qualified':
				return identifier_qualified$263(value);
			case 'type.bracketed':
				return type_bracketed$237(value);
			case 'type.generic':
				return unbuilt('identifier.qualified.qualifier', value);
			case 'type.generic.turbofish':
				return unbuilt('identifier.qualified.qualifier', value);
			default:
				return unbuilt('identifier.qualified.qualifier', value);
		}
	};
	const identifier_qualified$264_name = (
		value: string | BuildInput<RustMap, 'identifier'> | RustMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [484])) return value;
			return unseated('identifier.qualified.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [484])) return value;
			return unseated('identifier.qualified.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('identifier.qualified.name', value);
			default:
				return unbuilt('identifier.qualified.name', value);
		}
	};
	const identifier_qualified$264_qualifier = (
		value:
			| string
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.bracketed'>
			| RustMap['nodes']['type.bracketed']
			| BuildInput<RustMap, 'type.generic'>
			| RustMap['nodes']['type.generic']
			| BuildInput<RustMap, 'type.generic.turbofish'>
			| RustMap['nodes']['type.generic.turbofish']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case 'crate':
					return 126;
				case 'self':
					return 481;
				case 'super':
					return 125;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 127, 247, 263])) return value;
			return unseated('identifier.qualified.qualifier', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 125, 126, 127, 247, 263, 481])) return value;
			return unseated('identifier.qualified.qualifier', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('identifier.qualified.qualifier', value);
			case 'identifier.metavariable':
				return unbuilt('identifier.qualified.qualifier', value);
			case 'identifier.qualified':
				return identifier_qualified$263(value);
			case 'type.bracketed':
				return unbuilt('identifier.qualified.qualifier', value);
			case 'type.generic':
				return unbuilt('identifier.qualified.qualifier', value);
			case 'type.generic.turbofish':
				return unbuilt('identifier.qualified.qualifier', value);
			default:
				return unbuilt('identifier.qualified.qualifier', value);
		}
	};
	const identifier_qualified$265_name = (
		value: string | BuildInput<RustMap, 'identifier'> | RustMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [484])) return value;
			return unseated('identifier.qualified.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [484])) return value;
			return unseated('identifier.qualified.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('identifier.qualified.name', value);
			default:
				return unbuilt('identifier.qualified.name', value);
		}
	};
	const identifier_qualified$265_qualifier = (
		value:
			| string
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.bracketed'>
			| RustMap['nodes']['type.bracketed']
			| BuildInput<RustMap, 'type.generic'>
			| RustMap['nodes']['type.generic']
			| BuildInput<RustMap, 'type.generic.turbofish'>
			| RustMap['nodes']['type.generic.turbofish']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case 'crate':
					return 126;
				case 'self':
					return 481;
				case 'super':
					return 125;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 127, 237, 246, 247, 263])) return value;
			return unseated('identifier.qualified.qualifier', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 125, 126, 127, 237, 246, 247, 263, 481])) return value;
			return unseated('identifier.qualified.qualifier', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('identifier.qualified.qualifier', value);
			case 'identifier.metavariable':
				return unbuilt('identifier.qualified.qualifier', value);
			case 'identifier.qualified':
				return identifier_qualified$263(value);
			case 'type.bracketed':
				return type_bracketed$237(value);
			case 'type.generic':
				return unbuilt('identifier.qualified.qualifier', value);
			case 'type.generic.turbofish':
				return unbuilt('identifier.qualified.qualifier', value);
			default:
				return unbuilt('identifier.qualified.qualifier', value);
		}
	};
	const literal_character$145_content = (value: string) => {
		if (typeof value === 'string') {
			return value;
		}
		if (typeof value === 'number') {
			return unseated('literal.character.content', value);
		}
		if (engine.isNode(value)) {
			return unseated('literal.character.content', value);
		}
		throw new Error('literal.character.content takes no structure');
	};
	const literal_number_negative$330_value = (
		value:
			| BuildInput<RustMap, 'literal.number.float'>
			| RustMap['nodes']['literal.number.float']
			| BuildInput<RustMap, 'literal.number.integer'>
			| RustMap['nodes']['literal.number.integer']
			| BuildInput<RustMap, 'literal.number.integer.binary'>
			| RustMap['nodes']['literal.number.integer.binary']
			| BuildInput<RustMap, 'literal.number.integer.hex'>
			| RustMap['nodes']['literal.number.integer.hex']
			| BuildInput<RustMap, 'literal.number.integer.octal'>
			| RustMap['nodes']['literal.number.integer.octal']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [141, 142, 143, 144, 162, 331])) return value;
			return unseated('literal.number.negative.value', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [141, 142, 143, 144, 162, 331])) return value;
			return unseated('literal.number.negative.value', value);
		}
		switch (value.$path) {
			case 'literal.number.float':
				return literal_number_float$162(value);
			case 'literal.number.integer':
				return unbuilt('literal.number.negative.value', value);
			case 'literal.number.integer.binary':
				return unbuilt('literal.number.negative.value', value);
			case 'literal.number.integer.hex':
				return unbuilt('literal.number.negative.value', value);
			case 'literal.number.integer.octal':
				return unbuilt('literal.number.negative.value', value);
			default:
				return unbuilt('literal.number.negative.value', value);
		}
	};
	const modifier_extern$234_abi = (
		value:
			| BuildInput<RustMap, 'literal.string'>
			| RustMap['nodes']['literal.string']
			| BuildInput<RustMap, 'literal.string.bytes'>
			| RustMap['nodes']['literal.string.bytes']
			| BuildInput<RustMap, 'literal.string.c'>
			| RustMap['nodes']['literal.string.c']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [332])) return value;
			return unseated('modifier.extern.abi', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [332])) return value;
			return unseated('modifier.extern.abi', value);
		}
		switch (value.$path) {
			case 'literal.string':
				return unbuilt('modifier.extern.abi', value);
			case 'literal.string.bytes':
				return unbuilt('modifier.extern.abi', value);
			case 'literal.string.c':
				return unbuilt('modifier.extern.abi', value);
			default:
				return unbuilt('modifier.extern.abi', value);
		}
	};
	const pattern_struct$319_fields$item = (
		value:
			| string
			| BuildInput<RustMap, 'expression.block.const'>
			| RustMap['nodes']['expression.block.const']
			| BuildInput<RustMap, 'expression.call.macro'>
			| RustMap['nodes']['expression.call.macro']
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'literal.boolean.false'>
			| RustMap['nodes']['literal.boolean.false']
			| BuildInput<RustMap, 'literal.boolean.true'>
			| RustMap['nodes']['literal.boolean.true']
			| BuildInput<RustMap, 'literal.character'>
			| RustMap['nodes']['literal.character']
			| BuildInput<RustMap, 'literal.number.float'>
			| RustMap['nodes']['literal.number.float']
			| BuildInput<RustMap, 'literal.number.integer'>
			| RustMap['nodes']['literal.number.integer']
			| BuildInput<RustMap, 'literal.number.integer.binary'>
			| RustMap['nodes']['literal.number.integer.binary']
			| BuildInput<RustMap, 'literal.number.integer.hex'>
			| RustMap['nodes']['literal.number.integer.hex']
			| BuildInput<RustMap, 'literal.number.integer.octal'>
			| RustMap['nodes']['literal.number.integer.octal']
			| BuildInput<RustMap, 'literal.number.negative'>
			| RustMap['nodes']['literal.number.negative']
			| BuildInput<RustMap, 'literal.string'>
			| RustMap['nodes']['literal.string']
			| BuildInput<RustMap, 'literal.string.bytes'>
			| RustMap['nodes']['literal.string.bytes']
			| BuildInput<RustMap, 'literal.string.bytes.raw'>
			| RustMap['nodes']['literal.string.bytes.raw']
			| BuildInput<RustMap, 'literal.string.c'>
			| RustMap['nodes']['literal.string.c']
			| BuildInput<RustMap, 'literal.string.c.raw'>
			| RustMap['nodes']['literal.string.c.raw']
			| BuildInput<RustMap, 'literal.string.raw'>
			| RustMap['nodes']['literal.string.raw']
			| BuildInput<RustMap, 'pattern.as'>
			| RustMap['nodes']['pattern.as']
			| BuildInput<RustMap, 'pattern.generic'>
			| RustMap['nodes']['pattern.generic']
			| BuildInput<RustMap, 'pattern.list'>
			| RustMap['nodes']['pattern.list']
			| BuildInput<RustMap, 'pattern.mutable'>
			| RustMap['nodes']['pattern.mutable']
			| BuildInput<RustMap, 'pattern.or'>
			| RustMap['nodes']['pattern.or']
			| BuildInput<RustMap, 'pattern.range'>
			| RustMap['nodes']['pattern.range']
			| BuildInput<RustMap, 'pattern.range.exclusive'>
			| RustMap['nodes']['pattern.range.exclusive']
			| BuildInput<RustMap, 'pattern.range.inclusive'>
			| RustMap['nodes']['pattern.range.inclusive']
			| BuildInput<RustMap, 'pattern.range.inclusive.legacy'>
			| RustMap['nodes']['pattern.range.inclusive.legacy']
			| BuildInput<RustMap, 'pattern.reference'>
			| RustMap['nodes']['pattern.reference']
			| BuildInput<RustMap, 'pattern.reference.value'>
			| RustMap['nodes']['pattern.reference.value']
			| BuildInput<RustMap, 'pattern.struct'>
			| RustMap['nodes']['pattern.struct']
			| BuildInput<RustMap, 'pattern.struct.field'>
			| RustMap['nodes']['pattern.struct.field']
			| BuildInput<RustMap, 'pattern.tuple'>
			| RustMap['nodes']['pattern.tuple']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case '..':
					return 321;
				default:
					return value;
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [320, 414, 415])) return value;
			return unseated('pattern.struct.fields', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [320, 321, 414, 415])) return value;
			return unseated('pattern.struct.fields', value);
		}
		switch (value.$path) {
			case 'expression.block.const':
				return unbuilt('pattern.struct.fields', value);
			case 'expression.call.macro':
				return unbuilt('pattern.struct.fields', value);
			case 'identifier':
				return unbuilt('pattern.struct.fields', value);
			case 'identifier.qualified':
				return unbuilt('pattern.struct.fields', value);
			case 'literal.boolean.false':
				return unbuilt('pattern.struct.fields', value);
			case 'literal.boolean.true':
				return unbuilt('pattern.struct.fields', value);
			case 'literal.character':
				return unbuilt('pattern.struct.fields', value);
			case 'literal.number.float':
				return unbuilt('pattern.struct.fields', value);
			case 'literal.number.integer':
				return unbuilt('pattern.struct.fields', value);
			case 'literal.number.integer.binary':
				return unbuilt('pattern.struct.fields', value);
			case 'literal.number.integer.hex':
				return unbuilt('pattern.struct.fields', value);
			case 'literal.number.integer.octal':
				return unbuilt('pattern.struct.fields', value);
			case 'literal.number.negative':
				return unbuilt('pattern.struct.fields', value);
			case 'literal.string':
				return unbuilt('pattern.struct.fields', value);
			case 'literal.string.bytes':
				return unbuilt('pattern.struct.fields', value);
			case 'literal.string.bytes.raw':
				return unbuilt('pattern.struct.fields', value);
			case 'literal.string.c':
				return unbuilt('pattern.struct.fields', value);
			case 'literal.string.c.raw':
				return unbuilt('pattern.struct.fields', value);
			case 'literal.string.raw':
				return unbuilt('pattern.struct.fields', value);
			case 'pattern.as':
				return unbuilt('pattern.struct.fields', value);
			case 'pattern.generic':
				return unbuilt('pattern.struct.fields', value);
			case 'pattern.list':
				return unbuilt('pattern.struct.fields', value);
			case 'pattern.mutable':
				return unbuilt('pattern.struct.fields', value);
			case 'pattern.or':
				return unbuilt('pattern.struct.fields', value);
			case 'pattern.range':
				return unbuilt('pattern.struct.fields', value);
			case 'pattern.range.exclusive':
				return unbuilt('pattern.struct.fields', value);
			case 'pattern.range.inclusive':
				return unbuilt('pattern.struct.fields', value);
			case 'pattern.range.inclusive.legacy':
				return unbuilt('pattern.struct.fields', value);
			case 'pattern.reference':
				return unbuilt('pattern.struct.fields', value);
			case 'pattern.reference.value':
				return unbuilt('pattern.struct.fields', value);
			case 'pattern.struct':
				return unbuilt('pattern.struct.fields', value);
			case 'pattern.struct.field':
				if (value.name !== undefined && value.pattern === undefined) return pattern_struct_field$414(value);
				return unbuilt('pattern.struct.fields', value);
			case 'pattern.tuple':
				return unbuilt('pattern.struct.fields', value);
			default:
				return unbuilt('pattern.struct.fields', value);
		}
	};
	const pattern_struct$319_type = (
		value:
			| string
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.generic.turbofish'>
			| RustMap['nodes']['type.generic.turbofish']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [265, 484])) return value;
			return unseated('pattern.struct.type', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [265, 484])) return value;
			return unseated('pattern.struct.type', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('pattern.struct.type', value);
			case 'identifier.qualified':
				return identifier_qualified$265(value);
			case 'type.generic.turbofish':
				return unbuilt('pattern.struct.type', value);
			default:
				return unbuilt('pattern.struct.type', value);
		}
	};
	const pattern_struct_field$414_name = (
		value: string | BuildInput<RustMap, 'identifier'> | RustMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [482])) return value;
			return unseated('pattern.struct.field.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [482])) return value;
			return unseated('pattern.struct.field.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('pattern.struct.field.name', value);
			default:
				return unbuilt('pattern.struct.field.name', value);
		}
	};
	const statement_continue$305_label = (
		value: BuildInput<RustMap, 'identifier.label'> | RustMap['nodes']['identifier.label']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [303])) return value;
			return unseated('statement.continue.label', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [303])) return value;
			return unseated('statement.continue.label', value);
		}
		switch (value.$path) {
			case 'identifier.label':
				return identifier_label$303(value);
			default:
				return unbuilt('statement.continue.label', value);
		}
	};
	const statement_import$224_argument = (
		value:
			| string
			| BuildInput<RustMap, 'clause.import.alias'>
			| RustMap['nodes']['clause.import.alias']
			| BuildInput<RustMap, 'clause.import.list'>
			| RustMap['nodes']['clause.import.list']
			| BuildInput<RustMap, 'clause.import.list.scoped'>
			| RustMap['nodes']['clause.import.list.scoped']
			| BuildInput<RustMap, 'clause.import.wildcard'>
			| RustMap['nodes']['clause.import.wildcard']
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case 'crate':
					return 126;
				case 'self':
					return 481;
				case 'super':
					return 125;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 127, 226, 227, 228, 229, 263])) return value;
			return unseated('statement.import.argument', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 125, 126, 127, 226, 227, 228, 229, 263, 481])) return value;
			return unseated('statement.import.argument', value);
		}
		switch (value.$path) {
			case 'clause.import.alias':
				return clause_import_alias$228(value);
			case 'clause.import.list':
				return clause_import_list$227(value);
			case 'clause.import.list.scoped':
				return clause_import_list_scoped$226(value);
			case 'clause.import.wildcard':
				return clause_import_wildcard$229(value);
			case 'identifier':
				return unbuilt('statement.import.argument', value);
			case 'identifier.metavariable':
				return unbuilt('statement.import.argument', value);
			case 'identifier.qualified':
				return identifier_qualified$263(value);
			default:
				return unbuilt('statement.import.argument', value);
		}
	};
	const statement_import_package$204_alias = (
		value: string | BuildInput<RustMap, 'identifier'> | RustMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1])) return value;
			return unseated('statement.import.package.alias', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1])) return value;
			return unseated('statement.import.package.alias', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('statement.import.package.alias', value);
			default:
				return unbuilt('statement.import.package.alias', value);
		}
	};
	const statement_import_package$204_name = (
		value: string | BuildInput<RustMap, 'identifier'> | RustMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1])) return value;
			return unseated('statement.import.package.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1])) return value;
			return unseated('statement.import.package.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('statement.import.package.name', value);
			default:
				return unbuilt('statement.import.package.name', value);
		}
	};
	const statement_loop$298_body = (
		value: BuildInput<RustMap, 'statement.block'> | RustMap['nodes']['statement.block']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [313])) return value;
			return unseated('statement.loop.body', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [313])) return value;
			return unseated('statement.loop.body', value);
		}
		switch (value.$path) {
			case 'statement.block':
				return unbuilt('statement.loop.body', value);
			default:
				return unbuilt('statement.loop.body', value);
		}
	};
	const statement_loop$298_label = (
		value: BuildInput<RustMap, 'identifier.label'> | RustMap['nodes']['identifier.label']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [303])) return value;
			return unseated('statement.loop.label', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [303])) return value;
			return unseated('statement.loop.label', value);
		}
		switch (value.$path) {
			case 'identifier.label':
				return identifier_label$303(value);
			default:
				return unbuilt('statement.loop.label', value);
		}
	};
	const type_bounded$248_left = (
		value:
			| string
			| BuildInput<RustMap, 'clause.bounds.removed'>
			| RustMap['nodes']['clause.bounds.removed']
			| BuildInput<RustMap, 'clause.bounds.use'>
			| RustMap['nodes']['clause.bounds.use']
			| BuildInput<RustMap, 'expression.call.macro'>
			| RustMap['nodes']['expression.call.macro']
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.lifetime'>
			| RustMap['nodes']['identifier.lifetime']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.abstract'>
			| RustMap['nodes']['type.abstract']
			| BuildInput<RustMap, 'type.array'>
			| RustMap['nodes']['type.array']
			| BuildInput<RustMap, 'type.bounded'>
			| RustMap['nodes']['type.bounded']
			| BuildInput<RustMap, 'type.dynamic'>
			| RustMap['nodes']['type.dynamic']
			| BuildInput<RustMap, 'type.function'>
			| RustMap['nodes']['type.function']
			| BuildInput<RustMap, 'type.generic'>
			| RustMap['nodes']['type.generic']
			| BuildInput<RustMap, 'type.pointer'>
			| RustMap['nodes']['type.pointer']
			| BuildInput<RustMap, 'type.reference'>
			| RustMap['nodes']['type.reference']
			| BuildInput<RustMap, 'type.tuple'>
			| RustMap['nodes']['type.tuple']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case '!':
					return 254;
				case '()':
					return 244;
				case 'bool':
					return 72;
				case 'char':
					return 74;
				case 'f32':
					return 70;
				case 'f64':
					return 71;
				case 'i128':
					return 67;
				case 'i16':
					return 61;
				case 'i32':
					return 63;
				case 'i64':
					return 65;
				case 'i8':
					return 59;
				case 'isize':
					return 68;
				case 'str':
					return 73;
				case 'u128':
					return 66;
				case 'u16':
					return 60;
				case 'u32':
					return 62;
				case 'u64':
					return 64;
				case 'u8':
					return 58;
				case 'usize':
					return 69;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (
				seated(
					value,
					[127, 218, 236, 239, 240, 242, 243, 246, 248, 249, 252, 253, 255, 256, 259, 265, 341, 388, 389, 484]
				)
			)
				return value;
			return unseated('type.bounded.left', value);
		}
		if (engine.isNode(value)) {
			if (
				seated(
					value,
					[
						58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 127, 218, 236, 239, 240, 242, 243, 244,
						246, 248, 249, 252, 253, 254, 255, 256, 259, 265, 341, 388, 389, 484
					]
				)
			)
				return value;
			return unseated('type.bounded.left', value);
		}
		switch (value.$path) {
			case 'clause.bounds.removed':
				return clause_bounds_removed$218(value);
			case 'clause.bounds.use':
				return clause_bounds_use$249(value);
			case 'expression.call.macro':
				return expression_call_macro$259(value);
			case 'identifier':
				return unbuilt('type.bounded.left', value);
			case 'identifier.lifetime':
				return identifier_lifetime$239(value);
			case 'identifier.metavariable':
				return unbuilt('type.bounded.left', value);
			case 'identifier.qualified':
				return identifier_qualified$265(value);
			case 'type.abstract':
				return unbuilt('type.bounded.left', value);
			case 'type.array':
				return unbuilt('type.bounded.left', value);
			case 'type.bounded':
				return type_bounded$248(value);
			case 'type.dynamic':
				return type_dynamic$256(value);
			case 'type.function':
				return unbuilt('type.bounded.left', value);
			case 'type.generic':
				return unbuilt('type.bounded.left', value);
			case 'type.pointer':
				if ((value.$flags ?? []).includes('writable') && value.type !== undefined) return type_pointer$389(value);
				return type_pointer$388(value);
			case 'type.reference':
				return type_reference$252(value);
			case 'type.tuple':
				return unbuilt('type.bounded.left', value);
			default:
				return unbuilt('type.bounded.left', value);
		}
	};
	const type_bounded$248_right = (
		value:
			| string
			| BuildInput<RustMap, 'clause.bounds.removed'>
			| RustMap['nodes']['clause.bounds.removed']
			| BuildInput<RustMap, 'clause.bounds.use'>
			| RustMap['nodes']['clause.bounds.use']
			| BuildInput<RustMap, 'expression.call.macro'>
			| RustMap['nodes']['expression.call.macro']
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.lifetime'>
			| RustMap['nodes']['identifier.lifetime']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.abstract'>
			| RustMap['nodes']['type.abstract']
			| BuildInput<RustMap, 'type.array'>
			| RustMap['nodes']['type.array']
			| BuildInput<RustMap, 'type.bounded'>
			| RustMap['nodes']['type.bounded']
			| BuildInput<RustMap, 'type.dynamic'>
			| RustMap['nodes']['type.dynamic']
			| BuildInput<RustMap, 'type.function'>
			| RustMap['nodes']['type.function']
			| BuildInput<RustMap, 'type.generic'>
			| RustMap['nodes']['type.generic']
			| BuildInput<RustMap, 'type.pointer'>
			| RustMap['nodes']['type.pointer']
			| BuildInput<RustMap, 'type.reference'>
			| RustMap['nodes']['type.reference']
			| BuildInput<RustMap, 'type.tuple'>
			| RustMap['nodes']['type.tuple']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case '!':
					return 254;
				case '()':
					return 244;
				case 'bool':
					return 72;
				case 'char':
					return 74;
				case 'f32':
					return 70;
				case 'f64':
					return 71;
				case 'i128':
					return 67;
				case 'i16':
					return 61;
				case 'i32':
					return 63;
				case 'i64':
					return 65;
				case 'i8':
					return 59;
				case 'isize':
					return 68;
				case 'str':
					return 73;
				case 'u128':
					return 66;
				case 'u16':
					return 60;
				case 'u32':
					return 62;
				case 'u64':
					return 64;
				case 'u8':
					return 58;
				case 'usize':
					return 69;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (
				seated(
					value,
					[127, 218, 236, 239, 240, 242, 243, 246, 248, 249, 252, 253, 255, 256, 259, 265, 341, 388, 389, 484]
				)
			)
				return value;
			return unseated('type.bounded.right', value);
		}
		if (engine.isNode(value)) {
			if (
				seated(
					value,
					[
						58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 127, 218, 236, 239, 240, 242, 243, 244,
						246, 248, 249, 252, 253, 254, 255, 256, 259, 265, 341, 388, 389, 484
					]
				)
			)
				return value;
			return unseated('type.bounded.right', value);
		}
		switch (value.$path) {
			case 'clause.bounds.removed':
				return clause_bounds_removed$218(value);
			case 'clause.bounds.use':
				return clause_bounds_use$249(value);
			case 'expression.call.macro':
				return expression_call_macro$259(value);
			case 'identifier':
				return unbuilt('type.bounded.right', value);
			case 'identifier.lifetime':
				return identifier_lifetime$239(value);
			case 'identifier.metavariable':
				return unbuilt('type.bounded.right', value);
			case 'identifier.qualified':
				return identifier_qualified$265(value);
			case 'type.abstract':
				return unbuilt('type.bounded.right', value);
			case 'type.array':
				return unbuilt('type.bounded.right', value);
			case 'type.bounded':
				return type_bounded$248(value);
			case 'type.dynamic':
				return type_dynamic$256(value);
			case 'type.function':
				return unbuilt('type.bounded.right', value);
			case 'type.generic':
				return unbuilt('type.bounded.right', value);
			case 'type.pointer':
				if ((value.$flags ?? []).includes('writable') && value.type !== undefined) return type_pointer$389(value);
				return type_pointer$388(value);
			case 'type.reference':
				return type_reference$252(value);
			case 'type.tuple':
				return unbuilt('type.bounded.right', value);
			default:
				return unbuilt('type.bounded.right', value);
		}
	};
	const type_bracketed$237_type = (
		value:
			| string
			| BuildInput<RustMap, 'clause.bounds.removed'>
			| RustMap['nodes']['clause.bounds.removed']
			| BuildInput<RustMap, 'expression.call.macro'>
			| RustMap['nodes']['expression.call.macro']
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.abstract'>
			| RustMap['nodes']['type.abstract']
			| BuildInput<RustMap, 'type.array'>
			| RustMap['nodes']['type.array']
			| BuildInput<RustMap, 'type.bounded'>
			| RustMap['nodes']['type.bounded']
			| BuildInput<RustMap, 'type.dynamic'>
			| RustMap['nodes']['type.dynamic']
			| BuildInput<RustMap, 'type.function'>
			| RustMap['nodes']['type.function']
			| BuildInput<RustMap, 'type.generic'>
			| RustMap['nodes']['type.generic']
			| BuildInput<RustMap, 'type.pointer'>
			| RustMap['nodes']['type.pointer']
			| BuildInput<RustMap, 'type.qualified'>
			| RustMap['nodes']['type.qualified']
			| BuildInput<RustMap, 'type.reference'>
			| RustMap['nodes']['type.reference']
			| BuildInput<RustMap, 'type.tuple'>
			| RustMap['nodes']['type.tuple']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case '!':
					return 254;
				case '()':
					return 244;
				case 'bool':
					return 72;
				case 'char':
					return 74;
				case 'f32':
					return 70;
				case 'f64':
					return 71;
				case 'i128':
					return 67;
				case 'i16':
					return 61;
				case 'i32':
					return 63;
				case 'i64':
					return 65;
				case 'i8':
					return 59;
				case 'isize':
					return 68;
				case 'str':
					return 73;
				case 'u128':
					return 66;
				case 'u16':
					return 60;
				case 'u32':
					return 62;
				case 'u64':
					return 64;
				case 'u8':
					return 58;
				case 'usize':
					return 69;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (
				seated(value, [127, 218, 236, 238, 240, 242, 243, 246, 248, 252, 253, 255, 256, 259, 265, 341, 388, 389, 484])
			)
				return value;
			return unseated('type.bracketed.type', value);
		}
		if (engine.isNode(value)) {
			if (
				seated(
					value,
					[
						58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 127, 218, 236, 238, 240, 242, 243, 244,
						246, 248, 252, 253, 254, 255, 256, 259, 265, 341, 388, 389, 484
					]
				)
			)
				return value;
			return unseated('type.bracketed.type', value);
		}
		switch (value.$path) {
			case 'clause.bounds.removed':
				return clause_bounds_removed$218(value);
			case 'expression.call.macro':
				return expression_call_macro$259(value);
			case 'identifier':
				return unbuilt('type.bracketed.type', value);
			case 'identifier.metavariable':
				return unbuilt('type.bracketed.type', value);
			case 'identifier.qualified':
				return identifier_qualified$265(value);
			case 'type.abstract':
				return unbuilt('type.bracketed.type', value);
			case 'type.array':
				return unbuilt('type.bracketed.type', value);
			case 'type.bounded':
				return type_bounded$248(value);
			case 'type.dynamic':
				return type_dynamic$256(value);
			case 'type.function':
				return unbuilt('type.bracketed.type', value);
			case 'type.generic':
				return unbuilt('type.bracketed.type', value);
			case 'type.pointer':
				if ((value.$flags ?? []).includes('writable') && value.type !== undefined) return type_pointer$389(value);
				return type_pointer$388(value);
			case 'type.qualified':
				return type_qualified$238(value);
			case 'type.reference':
				return type_reference$252(value);
			case 'type.tuple':
				return unbuilt('type.bracketed.type', value);
			default:
				return unbuilt('type.bracketed.type', value);
		}
	};
	const type_dynamic$256_trait = (
		value:
			| string
			| BuildInput<RustMap, 'clause.bounds.higher_ranked'>
			| RustMap['nodes']['clause.bounds.higher_ranked']
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.function'>
			| RustMap['nodes']['type.function']
			| BuildInput<RustMap, 'type.generic'>
			| RustMap['nodes']['type.generic']
			| BuildInput<RustMap, 'type.tuple'>
			| RustMap['nodes']['type.tuple']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [217, 242, 243, 246, 265, 484])) return value;
			return unseated('type.dynamic.trait', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [217, 242, 243, 246, 265, 484])) return value;
			return unseated('type.dynamic.trait', value);
		}
		switch (value.$path) {
			case 'clause.bounds.higher_ranked':
				return unbuilt('type.dynamic.trait', value);
			case 'identifier':
				return unbuilt('type.dynamic.trait', value);
			case 'identifier.qualified':
				return identifier_qualified$265(value);
			case 'type.function':
				return unbuilt('type.dynamic.trait', value);
			case 'type.generic':
				return unbuilt('type.dynamic.trait', value);
			case 'type.tuple':
				return unbuilt('type.dynamic.trait', value);
			default:
				return unbuilt('type.dynamic.trait', value);
		}
	};
	const type_pointer$388_type = (
		value:
			| string
			| BuildInput<RustMap, 'clause.bounds.removed'>
			| RustMap['nodes']['clause.bounds.removed']
			| BuildInput<RustMap, 'expression.call.macro'>
			| RustMap['nodes']['expression.call.macro']
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.abstract'>
			| RustMap['nodes']['type.abstract']
			| BuildInput<RustMap, 'type.array'>
			| RustMap['nodes']['type.array']
			| BuildInput<RustMap, 'type.bounded'>
			| RustMap['nodes']['type.bounded']
			| BuildInput<RustMap, 'type.dynamic'>
			| RustMap['nodes']['type.dynamic']
			| BuildInput<RustMap, 'type.function'>
			| RustMap['nodes']['type.function']
			| BuildInput<RustMap, 'type.generic'>
			| RustMap['nodes']['type.generic']
			| BuildInput<RustMap, 'type.pointer'>
			| RustMap['nodes']['type.pointer']
			| BuildInput<RustMap, 'type.reference'>
			| RustMap['nodes']['type.reference']
			| BuildInput<RustMap, 'type.tuple'>
			| RustMap['nodes']['type.tuple']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case '!':
					return 254;
				case '()':
					return 244;
				case 'bool':
					return 72;
				case 'char':
					return 74;
				case 'f32':
					return 70;
				case 'f64':
					return 71;
				case 'i128':
					return 67;
				case 'i16':
					return 61;
				case 'i32':
					return 63;
				case 'i64':
					return 65;
				case 'i8':
					return 59;
				case 'isize':
					return 68;
				case 'str':
					return 73;
				case 'u128':
					return 66;
				case 'u16':
					return 60;
				case 'u32':
					return 62;
				case 'u64':
					return 64;
				case 'u8':
					return 58;
				case 'usize':
					return 69;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [127, 218, 236, 240, 242, 243, 246, 248, 252, 253, 255, 256, 259, 265, 341, 388, 389, 484]))
				return value;
			return unseated('type.pointer.type', value);
		}
		if (engine.isNode(value)) {
			if (
				seated(
					value,
					[
						58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 127, 218, 236, 240, 242, 243, 244, 246,
						248, 252, 253, 254, 255, 256, 259, 265, 341, 388, 389, 484
					]
				)
			)
				return value;
			return unseated('type.pointer.type', value);
		}
		switch (value.$path) {
			case 'clause.bounds.removed':
				return clause_bounds_removed$218(value);
			case 'expression.call.macro':
				return expression_call_macro$259(value);
			case 'identifier':
				return unbuilt('type.pointer.type', value);
			case 'identifier.metavariable':
				return unbuilt('type.pointer.type', value);
			case 'identifier.qualified':
				return identifier_qualified$265(value);
			case 'type.abstract':
				return unbuilt('type.pointer.type', value);
			case 'type.array':
				return unbuilt('type.pointer.type', value);
			case 'type.bounded':
				return type_bounded$248(value);
			case 'type.dynamic':
				return type_dynamic$256(value);
			case 'type.function':
				return unbuilt('type.pointer.type', value);
			case 'type.generic':
				return unbuilt('type.pointer.type', value);
			case 'type.pointer':
				if ((value.$flags ?? []).includes('writable') && value.type !== undefined) return type_pointer$389(value);
				return type_pointer$388(value);
			case 'type.reference':
				return type_reference$252(value);
			case 'type.tuple':
				return unbuilt('type.pointer.type', value);
			default:
				return unbuilt('type.pointer.type', value);
		}
	};
	const type_pointer$389_type = (
		value:
			| string
			| BuildInput<RustMap, 'clause.bounds.removed'>
			| RustMap['nodes']['clause.bounds.removed']
			| BuildInput<RustMap, 'expression.call.macro'>
			| RustMap['nodes']['expression.call.macro']
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.abstract'>
			| RustMap['nodes']['type.abstract']
			| BuildInput<RustMap, 'type.array'>
			| RustMap['nodes']['type.array']
			| BuildInput<RustMap, 'type.bounded'>
			| RustMap['nodes']['type.bounded']
			| BuildInput<RustMap, 'type.dynamic'>
			| RustMap['nodes']['type.dynamic']
			| BuildInput<RustMap, 'type.function'>
			| RustMap['nodes']['type.function']
			| BuildInput<RustMap, 'type.generic'>
			| RustMap['nodes']['type.generic']
			| BuildInput<RustMap, 'type.pointer'>
			| RustMap['nodes']['type.pointer']
			| BuildInput<RustMap, 'type.reference'>
			| RustMap['nodes']['type.reference']
			| BuildInput<RustMap, 'type.tuple'>
			| RustMap['nodes']['type.tuple']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case '!':
					return 254;
				case '()':
					return 244;
				case 'bool':
					return 72;
				case 'char':
					return 74;
				case 'f32':
					return 70;
				case 'f64':
					return 71;
				case 'i128':
					return 67;
				case 'i16':
					return 61;
				case 'i32':
					return 63;
				case 'i64':
					return 65;
				case 'i8':
					return 59;
				case 'isize':
					return 68;
				case 'str':
					return 73;
				case 'u128':
					return 66;
				case 'u16':
					return 60;
				case 'u32':
					return 62;
				case 'u64':
					return 64;
				case 'u8':
					return 58;
				case 'usize':
					return 69;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [127, 218, 236, 240, 242, 243, 246, 248, 252, 253, 255, 256, 259, 265, 341, 388, 389, 484]))
				return value;
			return unseated('type.pointer.type', value);
		}
		if (engine.isNode(value)) {
			if (
				seated(
					value,
					[
						58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 127, 218, 236, 240, 242, 243, 244, 246,
						248, 252, 253, 254, 255, 256, 259, 265, 341, 388, 389, 484
					]
				)
			)
				return value;
			return unseated('type.pointer.type', value);
		}
		switch (value.$path) {
			case 'clause.bounds.removed':
				return clause_bounds_removed$218(value);
			case 'expression.call.macro':
				return expression_call_macro$259(value);
			case 'identifier':
				return unbuilt('type.pointer.type', value);
			case 'identifier.metavariable':
				return unbuilt('type.pointer.type', value);
			case 'identifier.qualified':
				return identifier_qualified$265(value);
			case 'type.abstract':
				return unbuilt('type.pointer.type', value);
			case 'type.array':
				return unbuilt('type.pointer.type', value);
			case 'type.bounded':
				return type_bounded$248(value);
			case 'type.dynamic':
				return type_dynamic$256(value);
			case 'type.function':
				return unbuilt('type.pointer.type', value);
			case 'type.generic':
				return unbuilt('type.pointer.type', value);
			case 'type.pointer':
				if ((value.$flags ?? []).includes('writable') && value.type !== undefined) return type_pointer$389(value);
				return type_pointer$388(value);
			case 'type.reference':
				return type_reference$252(value);
			case 'type.tuple':
				return unbuilt('type.pointer.type', value);
			default:
				return unbuilt('type.pointer.type', value);
		}
	};
	const type_qualified$238_alias = (
		value:
			| string
			| BuildInput<RustMap, 'clause.bounds.removed'>
			| RustMap['nodes']['clause.bounds.removed']
			| BuildInput<RustMap, 'expression.call.macro'>
			| RustMap['nodes']['expression.call.macro']
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.abstract'>
			| RustMap['nodes']['type.abstract']
			| BuildInput<RustMap, 'type.array'>
			| RustMap['nodes']['type.array']
			| BuildInput<RustMap, 'type.bounded'>
			| RustMap['nodes']['type.bounded']
			| BuildInput<RustMap, 'type.dynamic'>
			| RustMap['nodes']['type.dynamic']
			| BuildInput<RustMap, 'type.function'>
			| RustMap['nodes']['type.function']
			| BuildInput<RustMap, 'type.generic'>
			| RustMap['nodes']['type.generic']
			| BuildInput<RustMap, 'type.pointer'>
			| RustMap['nodes']['type.pointer']
			| BuildInput<RustMap, 'type.reference'>
			| RustMap['nodes']['type.reference']
			| BuildInput<RustMap, 'type.tuple'>
			| RustMap['nodes']['type.tuple']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case '!':
					return 254;
				case '()':
					return 244;
				case 'bool':
					return 72;
				case 'char':
					return 74;
				case 'f32':
					return 70;
				case 'f64':
					return 71;
				case 'i128':
					return 67;
				case 'i16':
					return 61;
				case 'i32':
					return 63;
				case 'i64':
					return 65;
				case 'i8':
					return 59;
				case 'isize':
					return 68;
				case 'str':
					return 73;
				case 'u128':
					return 66;
				case 'u16':
					return 60;
				case 'u32':
					return 62;
				case 'u64':
					return 64;
				case 'u8':
					return 58;
				case 'usize':
					return 69;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [127, 218, 236, 240, 242, 243, 246, 248, 252, 253, 255, 256, 259, 265, 341, 388, 389, 484]))
				return value;
			return unseated('type.qualified.alias', value);
		}
		if (engine.isNode(value)) {
			if (
				seated(
					value,
					[
						58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 127, 218, 236, 240, 242, 243, 244, 246,
						248, 252, 253, 254, 255, 256, 259, 265, 341, 388, 389, 484
					]
				)
			)
				return value;
			return unseated('type.qualified.alias', value);
		}
		switch (value.$path) {
			case 'clause.bounds.removed':
				return clause_bounds_removed$218(value);
			case 'expression.call.macro':
				return expression_call_macro$259(value);
			case 'identifier':
				return unbuilt('type.qualified.alias', value);
			case 'identifier.metavariable':
				return unbuilt('type.qualified.alias', value);
			case 'identifier.qualified':
				return identifier_qualified$265(value);
			case 'type.abstract':
				return unbuilt('type.qualified.alias', value);
			case 'type.array':
				return unbuilt('type.qualified.alias', value);
			case 'type.bounded':
				return type_bounded$248(value);
			case 'type.dynamic':
				return type_dynamic$256(value);
			case 'type.function':
				return unbuilt('type.qualified.alias', value);
			case 'type.generic':
				return unbuilt('type.qualified.alias', value);
			case 'type.pointer':
				if ((value.$flags ?? []).includes('writable') && value.type !== undefined) return type_pointer$389(value);
				return type_pointer$388(value);
			case 'type.reference':
				return type_reference$252(value);
			case 'type.tuple':
				return unbuilt('type.qualified.alias', value);
			default:
				return unbuilt('type.qualified.alias', value);
		}
	};
	const type_qualified$238_type = (
		value:
			| string
			| BuildInput<RustMap, 'clause.bounds.removed'>
			| RustMap['nodes']['clause.bounds.removed']
			| BuildInput<RustMap, 'expression.call.macro'>
			| RustMap['nodes']['expression.call.macro']
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.abstract'>
			| RustMap['nodes']['type.abstract']
			| BuildInput<RustMap, 'type.array'>
			| RustMap['nodes']['type.array']
			| BuildInput<RustMap, 'type.bounded'>
			| RustMap['nodes']['type.bounded']
			| BuildInput<RustMap, 'type.dynamic'>
			| RustMap['nodes']['type.dynamic']
			| BuildInput<RustMap, 'type.function'>
			| RustMap['nodes']['type.function']
			| BuildInput<RustMap, 'type.generic'>
			| RustMap['nodes']['type.generic']
			| BuildInput<RustMap, 'type.pointer'>
			| RustMap['nodes']['type.pointer']
			| BuildInput<RustMap, 'type.reference'>
			| RustMap['nodes']['type.reference']
			| BuildInput<RustMap, 'type.tuple'>
			| RustMap['nodes']['type.tuple']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case '!':
					return 254;
				case '()':
					return 244;
				case 'bool':
					return 72;
				case 'char':
					return 74;
				case 'f32':
					return 70;
				case 'f64':
					return 71;
				case 'i128':
					return 67;
				case 'i16':
					return 61;
				case 'i32':
					return 63;
				case 'i64':
					return 65;
				case 'i8':
					return 59;
				case 'isize':
					return 68;
				case 'str':
					return 73;
				case 'u128':
					return 66;
				case 'u16':
					return 60;
				case 'u32':
					return 62;
				case 'u64':
					return 64;
				case 'u8':
					return 58;
				case 'usize':
					return 69;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [127, 218, 236, 240, 242, 243, 246, 248, 252, 253, 255, 256, 259, 265, 341, 388, 389, 484]))
				return value;
			return unseated('type.qualified.type', value);
		}
		if (engine.isNode(value)) {
			if (
				seated(
					value,
					[
						58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 127, 218, 236, 240, 242, 243, 244, 246,
						248, 252, 253, 254, 255, 256, 259, 265, 341, 388, 389, 484
					]
				)
			)
				return value;
			return unseated('type.qualified.type', value);
		}
		switch (value.$path) {
			case 'clause.bounds.removed':
				return clause_bounds_removed$218(value);
			case 'expression.call.macro':
				return expression_call_macro$259(value);
			case 'identifier':
				return unbuilt('type.qualified.type', value);
			case 'identifier.metavariable':
				return unbuilt('type.qualified.type', value);
			case 'identifier.qualified':
				return identifier_qualified$265(value);
			case 'type.abstract':
				return unbuilt('type.qualified.type', value);
			case 'type.array':
				return unbuilt('type.qualified.type', value);
			case 'type.bounded':
				return type_bounded$248(value);
			case 'type.dynamic':
				return type_dynamic$256(value);
			case 'type.function':
				return unbuilt('type.qualified.type', value);
			case 'type.generic':
				return unbuilt('type.qualified.type', value);
			case 'type.pointer':
				if ((value.$flags ?? []).includes('writable') && value.type !== undefined) return type_pointer$389(value);
				return type_pointer$388(value);
			case 'type.reference':
				return type_reference$252(value);
			case 'type.tuple':
				return unbuilt('type.qualified.type', value);
			default:
				return unbuilt('type.qualified.type', value);
		}
	};
	const type_reference$252_lifetime = (
		value: BuildInput<RustMap, 'identifier.lifetime'> | RustMap['nodes']['identifier.lifetime']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [239])) return value;
			return unseated('type.reference.lifetime', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [239])) return value;
			return unseated('type.reference.lifetime', value);
		}
		switch (value.$path) {
			case 'identifier.lifetime':
				return identifier_lifetime$239(value);
			default:
				return unbuilt('type.reference.lifetime', value);
		}
	};
	const type_reference$252_type = (
		value:
			| string
			| BuildInput<RustMap, 'clause.bounds.removed'>
			| RustMap['nodes']['clause.bounds.removed']
			| BuildInput<RustMap, 'expression.call.macro'>
			| RustMap['nodes']['expression.call.macro']
			| BuildInput<RustMap, 'identifier'>
			| RustMap['nodes']['identifier']
			| BuildInput<RustMap, 'identifier.metavariable'>
			| RustMap['nodes']['identifier.metavariable']
			| BuildInput<RustMap, 'identifier.qualified'>
			| RustMap['nodes']['identifier.qualified']
			| BuildInput<RustMap, 'type.abstract'>
			| RustMap['nodes']['type.abstract']
			| BuildInput<RustMap, 'type.array'>
			| RustMap['nodes']['type.array']
			| BuildInput<RustMap, 'type.bounded'>
			| RustMap['nodes']['type.bounded']
			| BuildInput<RustMap, 'type.dynamic'>
			| RustMap['nodes']['type.dynamic']
			| BuildInput<RustMap, 'type.function'>
			| RustMap['nodes']['type.function']
			| BuildInput<RustMap, 'type.generic'>
			| RustMap['nodes']['type.generic']
			| BuildInput<RustMap, 'type.pointer'>
			| RustMap['nodes']['type.pointer']
			| BuildInput<RustMap, 'type.reference'>
			| RustMap['nodes']['type.reference']
			| BuildInput<RustMap, 'type.tuple'>
			| RustMap['nodes']['type.tuple']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case '!':
					return 254;
				case '()':
					return 244;
				case 'bool':
					return 72;
				case 'char':
					return 74;
				case 'f32':
					return 70;
				case 'f64':
					return 71;
				case 'i128':
					return 67;
				case 'i16':
					return 61;
				case 'i32':
					return 63;
				case 'i64':
					return 65;
				case 'i8':
					return 59;
				case 'isize':
					return 68;
				case 'str':
					return 73;
				case 'u128':
					return 66;
				case 'u16':
					return 60;
				case 'u32':
					return 62;
				case 'u64':
					return 64;
				case 'u8':
					return 58;
				case 'usize':
					return 69;
				default:
					if (/^(?:(?:(r#)?[_\p{XID_Start}][_\p{XID_Continue}]*))$/u.test(value)) return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [127, 218, 236, 240, 242, 243, 246, 248, 252, 253, 255, 256, 259, 265, 341, 388, 389, 484]))
				return value;
			return unseated('type.reference.type', value);
		}
		if (engine.isNode(value)) {
			if (
				seated(
					value,
					[
						58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 127, 218, 236, 240, 242, 243, 244, 246,
						248, 252, 253, 254, 255, 256, 259, 265, 341, 388, 389, 484
					]
				)
			)
				return value;
			return unseated('type.reference.type', value);
		}
		switch (value.$path) {
			case 'clause.bounds.removed':
				return clause_bounds_removed$218(value);
			case 'expression.call.macro':
				return expression_call_macro$259(value);
			case 'identifier':
				return unbuilt('type.reference.type', value);
			case 'identifier.metavariable':
				return unbuilt('type.reference.type', value);
			case 'identifier.qualified':
				return identifier_qualified$265(value);
			case 'type.abstract':
				return unbuilt('type.reference.type', value);
			case 'type.array':
				return unbuilt('type.reference.type', value);
			case 'type.bounded':
				return type_bounded$248(value);
			case 'type.dynamic':
				return type_dynamic$256(value);
			case 'type.function':
				return unbuilt('type.reference.type', value);
			case 'type.generic':
				return unbuilt('type.reference.type', value);
			case 'type.pointer':
				if ((value.$flags ?? []).includes('writable') && value.type !== undefined) return type_pointer$389(value);
				return type_pointer$388(value);
			case 'type.reference':
				return type_reference$252(value);
			case 'type.tuple':
				return unbuilt('type.reference.type', value);
			default:
				return unbuilt('type.reference.type', value);
		}
	};
	const clause_bounds_removed$218 = (
		input: BuildInput<RustMap, 'clause.bounds.removed'>
	): ReturnType<typeof b.removedTraitBound> => {
		return b.removedTraitBound(clause_bounds_removed$218_type(input.type));
	};
	const clause_bounds_use$249 = (input: BuildInput<RustMap, 'clause.bounds.use'>): ReturnType<typeof b.useBounds> => {
		return b.useBounds(
			(input.bounds ?? []).length === 0
				? undefined
				: b.useBoundsElements(...(input.bounds ?? []).map(clause_bounds_use$249_bounds$item))
		);
	};
	const clause_else$291 = (input: BuildInput<RustMap, 'clause.else'>): ReturnType<typeof b.elseClause> => {
		return b.elseClause(clause_else$291_body(input.body));
	};
	const clause_import_alias$228 = (
		input: BuildInput<RustMap, 'clause.import.alias'>
	): ReturnType<typeof b.useAsClause> => {
		return b.useAsClause({
			name: clause_import_alias$228_name(input.name),
			rename: clause_import_alias$228_rename(input.rename)
		});
	};
	const clause_import_list$227 = (input: BuildInput<RustMap, 'clause.import.list'>): ReturnType<typeof b.useList> => {
		return b.useList(
			(input.useClauses ?? []).length === 0
				? undefined
				: b.useClauses(...(input.useClauses ?? []).map(clause_import_list$227_useClauses$item))
		);
	};
	const clause_import_list_scoped$226 = (
		input: BuildInput<RustMap, 'clause.import.list.scoped'>
	): ReturnType<typeof b.scopedUseList> => {
		return b.scopedUseList({
			path: input.path === undefined ? undefined : clause_import_list_scoped$226_path(input.path),
			list: clause_import_list_scoped$226_list(input.list)
		});
	};
	const clause_import_wildcard$229 = (
		input: BuildInput<RustMap, 'clause.import.wildcard'>
	): ReturnType<typeof b.useWildcard> => {
		return b.useWildcard(
			input.useWildcardGroup === undefined
				? undefined
				: clause_import_wildcard$229_useWildcardGroup(input.useWildcardGroup)
		);
	};
	const clause_macro_rule$181 = (input: BuildInput<RustMap, 'clause.macro.rule'>): ReturnType<typeof b.macroRule> => {
		return b.macroRule({
			left: clause_macro_rule$181_left(input.left),
			right: clause_macro_rule$181_right(input.right)
		});
	};
	const clause_where$211 = (input: BuildInput<RustMap, 'clause.where'>): ReturnType<typeof b.whereClause> => {
		return b.whereClause(
			(input.wherePredicates ?? []).length === 0
				? undefined
				: b.wherePredicates(...(input.wherePredicates ?? []).map(clause_where$211_wherePredicates$item))
		);
	};
	const declaration_macro$416 = (
		input: BuildInput<RustMap, 'declaration.macro'>
	): ReturnType<typeof b.macroDefinitionParen> => {
		return b.macroDefinitionParen({
			name: declaration_macro$416_name(input.name),
			macroRules:
				(input.rules ?? []).length === 0
					? undefined
					: b.macroRules(...(input.rules ?? []).map(declaration_macro$416_rules$item))
		});
	};
	const declaration_macro_brace$418 = (
		input: BuildInput<RustMap, 'declaration.macro.brace'>
	): ReturnType<typeof b.macroDefinitionBrace> => {
		return b.macroDefinitionBrace({
			name: declaration_macro_brace$418_name(input.name),
			macroRules:
				(input.rules ?? []).length === 0
					? undefined
					: b.macroRules(...(input.rules ?? []).map(declaration_macro_brace$418_rules$item))
		});
	};
	const declaration_macro_bracket$417 = (
		input: BuildInput<RustMap, 'declaration.macro.bracket'>
	): ReturnType<typeof b.macroDefinitionBracket> => {
		return b.macroDefinitionBracket({
			name: declaration_macro_bracket$417_name(input.name),
			macroRules:
				(input.rules ?? []).length === 0
					? undefined
					: b.macroRules(...(input.rules ?? []).map(declaration_macro_bracket$417_rules$item))
		});
	};
	const declaration_macro_paren$416 = (
		input: BuildInput<RustMap, 'declaration.macro.paren'>
	): ReturnType<typeof b.macroDefinitionParen> => {
		return b.macroDefinitionParen({
			name: declaration_macro_paren$416_name(input.name),
			macroRules:
				(input.rules ?? []).length === 0
					? undefined
					: b.macroRules(...(input.rules ?? []).map(declaration_macro_paren$416_rules$item))
		});
	};
	const declaration_module$384 = (
		input: BuildInput<RustMap, 'declaration.module'>
	): ReturnType<typeof b.modItemExternal> => {
		return b.modItemExternal({ name: declaration_module$384_name(input.name) });
	};
	const declaration_module_foreign$395 = (
		input: BuildInput<RustMap, 'declaration.module.foreign'>
	): ReturnType<typeof b.foreignModItemSemi> => {
		return b.foreignModItemSemi({
			externModifier: declaration_module_foreign$395_extern(input.extern),
			unsafe: (input.$flags ?? []).includes('unsafe')
		});
	};
	const element_macro_token_binding$184 = (
		input: BuildInput<RustMap, 'element.macro.token_binding'>
	): ReturnType<typeof b.tokenBindingPattern> => {
		return b.tokenBindingPattern({
			name: element_macro_token_binding$184_name(input.name),
			fragment: element_macro_token_binding$184_fragment(input.fragment)
		});
	};
	const element_struct_field$284 = (
		input: BuildInput<RustMap, 'element.struct.field'>
	): ReturnType<typeof b.shorthandFieldInitializer> => {
		return b.shorthandFieldInitializer({
			attributes: (input.attributes ?? []).map(element_struct_field$284_attributes),
			name: element_struct_field$284_name(input.name)
		});
	};
	const element_type_binding$251 = (
		input: BuildInput<RustMap, 'element.type_binding'>
	): ReturnType<typeof b.typeBinding> => {
		return b.typeBinding({
			name: element_type_binding$251_name(input.name),
			typeArguments:
				(input.typeArguments ?? []).length === 0
					? undefined
					: b.typeArguments(
							b.typeArgumentsElements(...(input.typeArguments ?? []).map(element_type_binding$251_typeArguments$item))
						),
			type: element_type_binding$251_type(input.type)
		});
	};
	const expression_block_async$310 = (
		input: BuildInput<RustMap, 'expression.block.async'>
	): ReturnType<typeof b.asyncBlock> => {
		return b.asyncBlock({
			body: expression_block_async$310_body(input.body),
			move: (input.$flags ?? []).includes('move')
		});
	};
	const expression_block_const$300 = (
		input: BuildInput<RustMap, 'expression.block.const'>
	): ReturnType<typeof b.constBlock> => {
		return b.constBlock(expression_block_const$300_body(input.body));
	};
	const expression_block_generator$311 = (
		input: BuildInput<RustMap, 'expression.block.generator'>
	): ReturnType<typeof b.genBlock> => {
		return b.genBlock({
			body: expression_block_generator$311_body(input.body),
			move: (input.$flags ?? []).includes('move')
		});
	};
	const expression_block_try$312 = (
		input: BuildInput<RustMap, 'expression.block.try'>
	): ReturnType<typeof b.tryBlock> => {
		return b.tryBlock(expression_block_try$312_body(input.body));
	};
	const expression_block_unsafe$309 = (
		input: BuildInput<RustMap, 'expression.block.unsafe'>
	): ReturnType<typeof b.unsafeBlock> => {
		return b.unsafeBlock(expression_block_unsafe$309_body(input.body));
	};
	const expression_call_macro$259 = (
		input: BuildInput<RustMap, 'expression.call.macro'>
	): ReturnType<typeof b.macroInvocation> => {
		return b.macroInvocation({
			function: expression_call_macro$259_function(input.function),
			arguments: expression_call_macro$259_arguments(input.arguments)
		});
	};
	const expression_collection_struct$282 = (
		input: BuildInput<RustMap, 'expression.collection.struct'>
	): ReturnType<typeof b.structExpression> => {
		return b.structExpression({
			name: expression_collection_struct$282_name(input.name),
			body:
				(input.body ?? []).length === 0
					? b.fieldInitializerList()
					: b.fieldInitializerList(
							b.fieldInitializerListElements(...(input.body ?? []).map(expression_collection_struct$282_body$item))
						)
		});
	};
	const expression_range$393 = (
		input: BuildInput<RustMap, 'expression.range'>
	): ReturnType<typeof b.rangeExpressionBare> => {
		return b.rangeExpressionBare();
	};
	const expression_range_exclusive$393 = (
		input: BuildInput<RustMap, 'expression.range.exclusive'>
	): ReturnType<typeof b.rangeExpressionBare> => {
		return b.rangeExpressionBare();
	};
	const identifier_label$303 = (input: BuildInput<RustMap, 'identifier.label'>): ReturnType<typeof b.label> => {
		return b.label(identifier_label$303_name(input.name));
	};
	const identifier_lifetime$239 = (
		input: BuildInput<RustMap, 'identifier.lifetime'>
	): ReturnType<typeof b.lifetime> => {
		return b.lifetime(identifier_lifetime$239_name(input.name));
	};
	const identifier_qualified$263 = (
		input: BuildInput<RustMap, 'identifier.qualified'>
	): ReturnType<typeof b.scopedIdentifier> => {
		return b.scopedIdentifier({
			qualifier: input.qualifier === undefined ? undefined : identifier_qualified$263_qualifier(input.qualifier),
			name: identifier_qualified$263_name(input.name)
		});
	};
	const identifier_qualified$264 = (
		input: BuildInput<RustMap, 'identifier.qualified'>
	): ReturnType<typeof b.scopedTypeIdentifierInExpressionPosition> => {
		return b.scopedTypeIdentifierInExpressionPosition({
			qualifier: input.qualifier === undefined ? undefined : identifier_qualified$264_qualifier(input.qualifier),
			name: identifier_qualified$264_name(input.name)
		});
	};
	const identifier_qualified$265 = (
		input: BuildInput<RustMap, 'identifier.qualified'>
	): ReturnType<typeof b.scopedTypeIdentifier> => {
		return b.scopedTypeIdentifier({
			qualifier: input.qualifier === undefined ? undefined : identifier_qualified$265_qualifier(input.qualifier),
			name: identifier_qualified$265_name(input.name)
		});
	};
	const literal_character$145 = (
		input: BuildInput<RustMap, 'literal.character'>
	): ReturnType<typeof b.charLiteralPlain> => {
		return b.charLiteralPlain({ content: literal_character$145_content(input.content) });
	};
	const literal_number_float$162 = (
		input: BuildInput<RustMap, 'literal.number.float'>
	): ReturnType<typeof b.floatLiteral> => {
		return b.floatLiteral(String(input.$value));
	};
	const literal_number_negative$330 = (
		input: BuildInput<RustMap, 'literal.number.negative'>
	): ReturnType<typeof b.negativeLiteral> => {
		return b.negativeLiteral(literal_number_negative$330_value(input.value));
	};
	const modifier_extern$234 = (input: BuildInput<RustMap, 'modifier.extern'>): ReturnType<typeof b.externModifier> => {
		return b.externModifier(input.abi === undefined ? undefined : modifier_extern$234_abi(input.abi));
	};
	const pattern_struct$319 = (input: BuildInput<RustMap, 'pattern.struct'>): ReturnType<typeof b.structPattern> => {
		return b.structPattern({
			type: pattern_struct$319_type(input.type),
			fields:
				(input.fields ?? []).length === 0
					? undefined
					: b.structPatternElements(...(input.fields ?? []).map(pattern_struct$319_fields$item))
		});
	};
	const pattern_struct_field$414 = (
		input: BuildInput<RustMap, 'pattern.struct.field'>
	): ReturnType<typeof b.fieldPatternShorthand> => {
		return b.fieldPatternShorthand({
			name: pattern_struct_field$414_name(input.name),
			mutable: (input.$flags ?? []).includes('mutable'),
			byReference: (input.$flags ?? []).includes('byReference')
		});
	};
	const statement_continue$305 = (
		input: BuildInput<RustMap, 'statement.continue'>
	): ReturnType<typeof b.continueExpression> => {
		return b.continueExpression(input.label === undefined ? undefined : statement_continue$305_label(input.label));
	};
	const statement_import$224 = (
		input: BuildInput<RustMap, 'statement.import'>
	): ReturnType<typeof b.useDeclaration> => {
		return b.useDeclaration({ argument: statement_import$224_argument(input.argument) });
	};
	const statement_import_package$204 = (
		input: BuildInput<RustMap, 'statement.import.package'>
	): ReturnType<typeof b.externCrateDeclaration> => {
		return b.externCrateDeclaration({
			name: statement_import_package$204_name(input.name),
			alias: input.alias === undefined ? undefined : statement_import_package$204_alias(input.alias)
		});
	};
	const statement_loop$298 = (input: BuildInput<RustMap, 'statement.loop'>): ReturnType<typeof b.loopExpression> => {
		return b.loopExpression({
			label: input.label === undefined ? undefined : statement_loop$298_label(input.label),
			body: statement_loop$298_body(input.body)
		});
	};
	const type_bounded$248 = (input: BuildInput<RustMap, 'type.bounded'>): ReturnType<typeof b.boundedType> => {
		return b.boundedType({ left: type_bounded$248_left(input.left), right: type_bounded$248_right(input.right) });
	};
	const type_bracketed$237 = (input: BuildInput<RustMap, 'type.bracketed'>): ReturnType<typeof b.bracketedType> => {
		return b.bracketedType(type_bracketed$237_type(input.type));
	};
	const type_dynamic$256 = (input: BuildInput<RustMap, 'type.dynamic'>): ReturnType<typeof b.dynamicType> => {
		return b.dynamicType(type_dynamic$256_trait(input.trait));
	};
	const type_pointer$388 = (input: BuildInput<RustMap, 'type.pointer'>): ReturnType<typeof b.pointerTypeConst> => {
		return b.pointerTypeConst(type_pointer$388_type(input.type));
	};
	const type_pointer$389 = (input: BuildInput<RustMap, 'type.pointer'>): ReturnType<typeof b.pointerTypeMut> => {
		return b.pointerTypeMut(type_pointer$389_type(input.type));
	};
	const type_qualified$238 = (input: BuildInput<RustMap, 'type.qualified'>): ReturnType<typeof b.qualifiedType> => {
		return b.qualifiedType({ type: type_qualified$238_type(input.type), alias: type_qualified$238_alias(input.alias) });
	};
	const type_reference$252 = (input: BuildInput<RustMap, 'type.reference'>): ReturnType<typeof b.referenceType> => {
		return b.referenceType({
			lifetime: input.lifetime === undefined ? undefined : type_reference$252_lifetime(input.lifetime),
			type: type_reference$252_type(input.type),
			exclusive: (input.$flags ?? []).includes('exclusive')
		});
	};
	const clause_bounds_removed = (input: BuildInput<RustMap, 'clause.bounds.removed'>) => {
		return clause_bounds_removed$218(input);
	};
	const clause_bounds_use = (input: BuildInput<RustMap, 'clause.bounds.use'>) => {
		return clause_bounds_use$249(input);
	};
	const clause_else = (input: BuildInput<RustMap, 'clause.else'>) => {
		return clause_else$291(input);
	};
	const clause_import_alias = (input: BuildInput<RustMap, 'clause.import.alias'>) => {
		return clause_import_alias$228(input);
	};
	const clause_import_list = (input: BuildInput<RustMap, 'clause.import.list'>) => {
		return clause_import_list$227(input);
	};
	const clause_import_list_scoped = (input: BuildInput<RustMap, 'clause.import.list.scoped'>) => {
		return clause_import_list_scoped$226(input);
	};
	const clause_import_wildcard = (input: BuildInput<RustMap, 'clause.import.wildcard'>) => {
		return clause_import_wildcard$229(input);
	};
	const clause_macro_rule = (input: BuildInput<RustMap, 'clause.macro.rule'>) => {
		return clause_macro_rule$181(input);
	};
	const clause_where = (input: BuildInput<RustMap, 'clause.where'>) => {
		return clause_where$211(input);
	};
	const declaration_macro_brace = (input: BuildInput<RustMap, 'declaration.macro.brace'>) => {
		return declaration_macro_brace$418(input);
	};
	const declaration_macro_bracket = (input: BuildInput<RustMap, 'declaration.macro.bracket'>) => {
		return declaration_macro_bracket$417(input);
	};
	const declaration_macro_paren = (input: BuildInput<RustMap, 'declaration.macro.paren'>) => {
		return declaration_macro_paren$416(input);
	};
	const element_macro_token_binding = (input: BuildInput<RustMap, 'element.macro.token_binding'>) => {
		return element_macro_token_binding$184(input);
	};
	const element_type_binding = (input: BuildInput<RustMap, 'element.type_binding'>) => {
		return element_type_binding$251(input);
	};
	const expression_block_async = (input: BuildInput<RustMap, 'expression.block.async'>) => {
		return expression_block_async$310(input);
	};
	const expression_block_const = (input: BuildInput<RustMap, 'expression.block.const'>) => {
		return expression_block_const$300(input);
	};
	const expression_block_generator = (input: BuildInput<RustMap, 'expression.block.generator'>) => {
		return expression_block_generator$311(input);
	};
	const expression_block_try = (input: BuildInput<RustMap, 'expression.block.try'>) => {
		return expression_block_try$312(input);
	};
	const expression_block_unsafe = (input: BuildInput<RustMap, 'expression.block.unsafe'>) => {
		return expression_block_unsafe$309(input);
	};
	const expression_call_macro = (input: BuildInput<RustMap, 'expression.call.macro'>) => {
		return expression_call_macro$259(input);
	};
	const expression_collection_struct = (input: BuildInput<RustMap, 'expression.collection.struct'>) => {
		return expression_collection_struct$282(input);
	};
	const identifier_label = (input: BuildInput<RustMap, 'identifier.label'>) => {
		return identifier_label$303(input);
	};
	const identifier_lifetime = (input: BuildInput<RustMap, 'identifier.lifetime'>) => {
		return identifier_lifetime$239(input);
	};
	const literal_number_negative = (input: BuildInput<RustMap, 'literal.number.negative'>) => {
		return literal_number_negative$330(input);
	};
	const modifier_extern = (input: BuildInput<RustMap, 'modifier.extern'>) => {
		return modifier_extern$234(input);
	};
	const statement_continue = (input: BuildInput<RustMap, 'statement.continue'>) => {
		return statement_continue$305(input);
	};
	const statement_import = (input: BuildInput<RustMap, 'statement.import'>) => {
		return statement_import$224(input);
	};
	const statement_import_package = (input: BuildInput<RustMap, 'statement.import.package'>) => {
		return statement_import_package$204(input);
	};
	const statement_loop = (input: BuildInput<RustMap, 'statement.loop'>) => {
		return statement_loop$298(input);
	};
	const type_bounded = (input: BuildInput<RustMap, 'type.bounded'>) => {
		return type_bounded$248(input);
	};
	const type_bracketed = (input: BuildInput<RustMap, 'type.bracketed'>) => {
		return type_bracketed$237(input);
	};
	const type_dynamic = (input: BuildInput<RustMap, 'type.dynamic'>) => {
		return type_dynamic$256(input);
	};
	const type_pointer = (input: BuildInput<RustMap, 'type.pointer'>) => {
		if ((input.$flags ?? []).includes('writable') && input.type !== undefined) return type_pointer$389(input);
		return type_pointer$388(input);
	};
	const type_qualified = (input: BuildInput<RustMap, 'type.qualified'>) => {
		return type_qualified$238(input);
	};
	const type_reference = (input: BuildInput<RustMap, 'type.reference'>) => {
		return type_reference$252(input);
	};
	return {
		clause: {
			bounds: { removed: clause_bounds_removed, use: clause_bounds_use },
			else: clause_else,
			import: {
				alias: clause_import_alias,
				list: Object.assign(clause_import_list, { scoped: clause_import_list_scoped }),
				wildcard: clause_import_wildcard
			},
			macro: { rule: clause_macro_rule },
			where: clause_where
		},
		declaration: {
			macro: { brace: declaration_macro_brace, bracket: declaration_macro_bracket, paren: declaration_macro_paren }
		},
		element: { macro: { token_binding: element_macro_token_binding }, type_binding: element_type_binding },
		expression: {
			block: {
				async: expression_block_async,
				const: expression_block_const,
				generator: expression_block_generator,
				try: expression_block_try,
				unsafe: expression_block_unsafe
			},
			call: { macro: expression_call_macro },
			collection: { struct: expression_collection_struct }
		},
		identifier: { label: identifier_label, lifetime: identifier_lifetime },
		literal: { number: { negative: literal_number_negative } },
		modifier: { extern: modifier_extern },
		statement: {
			continue: statement_continue,
			import: Object.assign(statement_import, { package: statement_import_package }),
			loop: statement_loop
		},
		type: {
			bounded: type_bounded,
			bracketed: type_bracketed,
			dynamic: type_dynamic,
			pointer: type_pointer,
			qualified: type_qualified,
			reference: type_reference
		}
	};
}

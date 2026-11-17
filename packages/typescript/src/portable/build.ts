import type { Engine } from '@sittir/types';
import type { BuildInput } from '@sittir/types/vocabulary';
import type { TypescriptAPI } from '../api.js';
import type { TypeScriptMap } from './map.js';
export function portableBuild(engine: Engine<TypescriptAPI>) {
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
	const attribute_member$286_object = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'attribute.member'>
			| TypeScriptMap['nodes']['attribute.member']
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case 'super':
					return 280;
				default:
					if (
						/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
							value
						)
					)
						return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 286])) return value;
			return unseated('attribute.member.object', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 280, 286])) return value;
			return unseated('attribute.member.object', value);
		}
		switch (value.$path) {
			case 'attribute.member':
				return attribute_member$286(value);
			case 'identifier':
				return unbuilt('attribute.member.object', value);
			default:
				return unbuilt('attribute.member.object', value);
		}
	};
	const attribute_member$286_property = (
		value: string | BuildInput<TypeScriptMap, 'identifier'> | TypeScriptMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (
				/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
					value
				)
			)
				return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [500])) return value;
			return unseated('attribute.member.property', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [500])) return value;
			return unseated('attribute.member.property', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('attribute.member.property', value);
			default:
				return unbuilt('attribute.member.property', value);
		}
	};
	const attribute_parenthesized$304_expression = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'attribute.call'>
			| TypeScriptMap['nodes']['attribute.call']
			| BuildInput<TypeScriptMap, 'attribute.member'>
			| TypeScriptMap['nodes']['attribute.member']
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (
				/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
					value
				)
			)
				return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 286, 287])) return value;
			return unseated('attribute.parenthesized.expression', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 286, 287])) return value;
			return unseated('attribute.parenthesized.expression', value);
		}
		switch (value.$path) {
			case 'attribute.call':
				return unbuilt('attribute.parenthesized.expression', value);
			case 'attribute.member':
				return attribute_member$286(value);
			case 'identifier':
				return unbuilt('attribute.parenthesized.expression', value);
			default:
				return unbuilt('attribute.parenthesized.expression', value);
		}
	};
	const clause_export$193_exportSpecifiers$item = (
		value:
			| BuildInput<TypeScriptMap, 'clause.export.specifier'>
			| TypeScriptMap['nodes']['clause.export.specifier']
			| BuildInput<TypeScriptMap, 'clause.export.specifier.typeof'>
			| TypeScriptMap['nodes']['clause.export.specifier.typeof']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [194])) return value;
			return unseated('clause.export.exportSpecifiers', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [194])) return value;
			return unseated('clause.export.exportSpecifiers', value);
		}
		switch (value.$path) {
			case 'clause.export.specifier':
				return unbuilt('clause.export.exportSpecifiers', value);
			case 'clause.export.specifier.typeof':
				return unbuilt('clause.export.exportSpecifiers', value);
			default:
				return unbuilt('clause.export.exportSpecifiers', value);
		}
	};
	const clause_finally$233_body = (
		value: BuildInput<TypeScriptMap, 'statement.block'> | TypeScriptMap['nodes']['statement.block']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [211])) return value;
			return unseated('clause.finally.body', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [211])) return value;
			return unseated('clause.finally.body', value);
		}
		switch (value.$path) {
			case 'statement.block':
				return unbuilt('clause.finally.body', value);
			default:
				return unbuilt('clause.finally.body', value);
		}
	};
	const clause_import_attribute$204_attributeKind = (value: string) => {
		if (typeof value === 'string') {
			switch (value) {
				case 'assert':
					return 13;
				case 'with':
					return 12;
				default:
					return value;
			}
		}
		if (typeof value === 'number') {
			return unseated('clause.import.attribute.attributeKind', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [12, 13])) return value;
			return unseated('clause.import.attribute.attributeKind', value);
		}
		throw new Error('clause.import.attribute.attributeKind takes no structure');
	};
	const clause_import_attribute$204_object = (
		value:
			| BuildInput<TypeScriptMap, 'expression.collection.object'>
			| TypeScriptMap['nodes']['expression.collection.object']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [238])) return value;
			return unseated('clause.import.attribute.object', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [238])) return value;
			return unseated('clause.import.attribute.object', value);
		}
		switch (value.$path) {
			case 'expression.collection.object':
				return expression_collection_object$238(value);
			default:
				return unbuilt('clause.import.attribute.object', value);
		}
	};
	const clause_import_namespace$201_name = (
		value: string | BuildInput<TypeScriptMap, 'identifier'> | TypeScriptMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (
				/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
					value
				)
			)
				return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1])) return value;
			return unseated('clause.import.namespace.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1])) return value;
			return unseated('clause.import.namespace.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('clause.import.namespace.name', value);
			default:
				return unbuilt('clause.import.namespace.name', value);
		}
	};
	const clause_import_specifier$414_name = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
			| BuildInput<TypeScriptMap, 'literal.string'>
			| TypeScriptMap['nodes']['literal.string']
	) => {
		if (typeof value === 'string') {
			if (
				/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
					value
				)
			)
				return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1])) return value;
			return unseated('clause.import.specifier.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1])) return value;
			return unseated('clause.import.specifier.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('clause.import.specifier.name', value);
			case 'literal.string':
				return unbuilt('clause.import.specifier.name', value);
			default:
				return unbuilt('clause.import.specifier.name', value);
		}
	};
	const declaration_ambient$313_body = (
		value:
			| BuildInput<TypeScriptMap, 'declaration.ambient'>
			| TypeScriptMap['nodes']['declaration.ambient']
			| BuildInput<TypeScriptMap, 'declaration.class'>
			| TypeScriptMap['nodes']['declaration.class']
			| BuildInput<TypeScriptMap, 'declaration.enum'>
			| TypeScriptMap['nodes']['declaration.enum']
			| BuildInput<TypeScriptMap, 'declaration.function'>
			| TypeScriptMap['nodes']['declaration.function']
			| BuildInput<TypeScriptMap, 'declaration.function.signature'>
			| TypeScriptMap['nodes']['declaration.function.signature']
			| BuildInput<TypeScriptMap, 'declaration.interface'>
			| TypeScriptMap['nodes']['declaration.interface']
			| BuildInput<TypeScriptMap, 'declaration.module'>
			| TypeScriptMap['nodes']['declaration.module']
			| BuildInput<TypeScriptMap, 'declaration.module.external'>
			| TypeScriptMap['nodes']['declaration.module.external']
			| BuildInput<TypeScriptMap, 'declaration.module_property'>
			| TypeScriptMap['nodes']['declaration.module_property']
			| BuildInput<TypeScriptMap, 'declaration.type_alias'>
			| TypeScriptMap['nodes']['declaration.type_alias']
			| BuildInput<TypeScriptMap, 'declaration.variable'>
			| TypeScriptMap['nodes']['declaration.variable']
			| BuildInput<TypeScriptMap, 'declaration.variable.constant'>
			| TypeScriptMap['nodes']['declaration.variable.constant']
			| BuildInput<TypeScriptMap, 'declaration.variable.reassignable'>
			| TypeScriptMap['nodes']['declaration.variable.reassignable']
			| BuildInput<TypeScriptMap, 'declaration.variable.reassignable.function_scoped'>
			| TypeScriptMap['nodes']['declaration.variable.reassignable.function_scoped']
			| BuildInput<TypeScriptMap, 'statement.block'>
			| TypeScriptMap['nodes']['statement.block']
			| BuildInput<TypeScriptMap, 'statement.import.alias'>
			| TypeScriptMap['nodes']['statement.import.alias']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [196, 207, 208, 209, 246, 249, 251, 303, 313, 314, 315, 316, 318, 320, 322, 325, 400]))
				return value;
			if (seated(value, [211])) return b.ambientDeclarationGlobal(value);
			return unseated('declaration.ambient.body', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [196, 207, 208, 209, 246, 249, 251, 303, 313, 314, 315, 316, 318, 320, 322, 325, 400]))
				return value;
			if (seated(value, [211])) return b.ambientDeclarationGlobal(value);
			return unseated('declaration.ambient.body', value);
		}
		switch (value.$path) {
			case 'declaration.ambient':
				return declaration_ambient$313(value);
			case 'declaration.class':
				return unbuilt('declaration.ambient.body', value);
			case 'declaration.enum':
				return declaration_enum$322(value);
			case 'declaration.function':
				return unbuilt('declaration.ambient.body', value);
			case 'declaration.function.signature':
				return unbuilt('declaration.ambient.body', value);
			case 'declaration.interface':
				return unbuilt('declaration.ambient.body', value);
			case 'declaration.module':
				return unbuilt('declaration.ambient.body', value);
			case 'declaration.module.external':
				return unbuilt('declaration.ambient.body', value);
			case 'declaration.module_property':
				return unbuilt('declaration.ambient.body', value);
			case 'declaration.type_alias':
				return unbuilt('declaration.ambient.body', value);
			case 'declaration.variable':
				return unbuilt('declaration.ambient.body', value);
			case 'declaration.variable.constant':
				return unbuilt('declaration.ambient.body', value);
			case 'declaration.variable.reassignable':
				return unbuilt('declaration.ambient.body', value);
			case 'declaration.variable.reassignable.function_scoped':
				return unbuilt('declaration.ambient.body', value);
			case 'statement.block':
				return unbuilt('declaration.ambient.body', value);
			case 'statement.import.alias':
				return unbuilt('declaration.ambient.body', value);
			default:
				return unbuilt('declaration.ambient.body', value);
		}
	};
	const declaration_enum$322_body$item = (
		value: BuildInput<TypeScriptMap, 'declaration.enum_member'> | TypeScriptMap['nodes']['declaration.enum_member']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [324, 388, 389])) return value;
			return unseated('declaration.enum.body', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [324, 388, 389])) return value;
			return unseated('declaration.enum.body', value);
		}
		switch (value.$path) {
			case 'declaration.enum_member':
				return unbuilt('declaration.enum.body', value);
			default:
				return unbuilt('declaration.enum.body', value);
		}
	};
	const declaration_enum$322_name = (
		value: string | BuildInput<TypeScriptMap, 'identifier'> | TypeScriptMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (
				/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
					value
				)
			)
				return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1])) return value;
			return unseated('declaration.enum.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1])) return value;
			return unseated('declaration.enum.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('declaration.enum.name', value);
			default:
				return unbuilt('declaration.enum.name', value);
		}
	};
	const element_template_substitution$347_type = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
			| BuildInput<TypeScriptMap, 'identifier.qualified'>
			| TypeScriptMap['nodes']['identifier.qualified']
			| BuildInput<TypeScriptMap, 'type.array'>
			| TypeScriptMap['nodes']['type.array']
			| BuildInput<TypeScriptMap, 'type.conditional'>
			| TypeScriptMap['nodes']['type.conditional']
			| BuildInput<TypeScriptMap, 'type.generic'>
			| TypeScriptMap['nodes']['type.generic']
			| BuildInput<TypeScriptMap, 'type.index_query'>
			| TypeScriptMap['nodes']['type.index_query']
			| BuildInput<TypeScriptMap, 'type.infer'>
			| TypeScriptMap['nodes']['type.infer']
			| BuildInput<TypeScriptMap, 'type.intersection'>
			| TypeScriptMap['nodes']['type.intersection']
			| BuildInput<TypeScriptMap, 'type.literal'>
			| TypeScriptMap['nodes']['type.literal']
			| BuildInput<TypeScriptMap, 'type.lookup'>
			| TypeScriptMap['nodes']['type.lookup']
			| BuildInput<TypeScriptMap, 'type.nullable'>
			| TypeScriptMap['nodes']['type.nullable']
			| BuildInput<TypeScriptMap, 'type.object'>
			| TypeScriptMap['nodes']['type.object']
			| BuildInput<TypeScriptMap, 'type.parenthesized'>
			| TypeScriptMap['nodes']['type.parenthesized']
			| BuildInput<TypeScriptMap, 'type.query'>
			| TypeScriptMap['nodes']['type.query']
			| BuildInput<TypeScriptMap, 'type.template'>
			| TypeScriptMap['nodes']['type.template']
			| BuildInput<TypeScriptMap, 'type.tuple'>
			| TypeScriptMap['nodes']['type.tuple']
			| BuildInput<TypeScriptMap, 'type.union'>
			| TypeScriptMap['nodes']['type.union']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case '*':
					return 364;
				case 'any':
					return 40;
				case 'boolean':
					return 42;
				case 'never':
					return 146;
				case 'number':
					return 41;
				case 'object':
					return 46;
				case 'string':
					return 43;
				case 'symbol':
					return 44;
				case 'this':
					return 504;
				case 'unique symbol':
					return 144;
				case 'unknown':
					return 145;
				case 'void':
					return 78;
				default:
					if (
						/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
							value
						)
					)
						return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (
				seated(value, [319, 346, 348, 349, 350, 351, 358, 359, 360, 362, 365, 366, 367, 369, 378, 379, 381, 382, 505])
			)
				return value;
			return unseated('element.template.substitution.type', value);
		}
		if (engine.isNode(value)) {
			if (
				seated(
					value,
					[
						40, 41, 42, 43, 44, 46, 78, 144, 145, 146, 319, 346, 348, 349, 350, 351, 358, 359, 360, 362, 364, 365, 366,
						367, 369, 378, 379, 381, 382, 504, 505
					]
				)
			)
				return value;
			return unseated('element.template.substitution.type', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('element.template.substitution.type', value);
			case 'identifier.qualified':
				return identifier_qualified$319(value);
			case 'type.array':
				return type_array$378(value);
			case 'type.conditional':
				return unbuilt('element.template.substitution.type', value);
			case 'type.generic':
				return unbuilt('element.template.substitution.type', value);
			case 'type.index_query':
				return type_index_query$359(value);
			case 'type.infer':
				return unbuilt('element.template.substitution.type', value);
			case 'type.intersection':
				return unbuilt('element.template.substitution.type', value);
			case 'type.literal':
				return unbuilt('element.template.substitution.type', value);
			case 'type.lookup':
				return unbuilt('element.template.substitution.type', value);
			case 'type.nullable':
				return type_nullable$365(value);
			case 'type.object':
				return type_object$369(value);
			case 'type.parenthesized':
				return unbuilt('element.template.substitution.type', value);
			case 'type.query':
				return type_query$358(value);
			case 'type.template':
				return type_template$348(value);
			case 'type.tuple':
				return unbuilt('element.template.substitution.type', value);
			case 'type.union':
				return unbuilt('element.template.substitution.type', value);
			default:
				return unbuilt('element.template.substitution.type', value);
		}
	};
	const expression_collection_object$238_properties = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'declaration.method'>
			| TypeScriptMap['nodes']['declaration.method']
			| BuildInput<TypeScriptMap, 'declaration.method.private'>
			| TypeScriptMap['nodes']['declaration.method.private']
			| BuildInput<TypeScriptMap, 'declaration.method.protected'>
			| TypeScriptMap['nodes']['declaration.method.protected']
			| BuildInput<TypeScriptMap, 'declaration.method.public'>
			| TypeScriptMap['nodes']['declaration.method.public']
			| BuildInput<TypeScriptMap, 'declaration.property.getter'>
			| TypeScriptMap['nodes']['declaration.property.getter']
			| BuildInput<TypeScriptMap, 'declaration.property.getter.private'>
			| TypeScriptMap['nodes']['declaration.property.getter.private']
			| BuildInput<TypeScriptMap, 'declaration.property.getter.protected'>
			| TypeScriptMap['nodes']['declaration.property.getter.protected']
			| BuildInput<TypeScriptMap, 'declaration.property.getter.public'>
			| TypeScriptMap['nodes']['declaration.property.getter.public']
			| BuildInput<TypeScriptMap, 'declaration.property.setter'>
			| TypeScriptMap['nodes']['declaration.property.setter']
			| BuildInput<TypeScriptMap, 'declaration.property.setter.private'>
			| TypeScriptMap['nodes']['declaration.property.setter.private']
			| BuildInput<TypeScriptMap, 'declaration.property.setter.protected'>
			| TypeScriptMap['nodes']['declaration.property.setter.protected']
			| BuildInput<TypeScriptMap, 'declaration.property.setter.public'>
			| TypeScriptMap['nodes']['declaration.property.setter.public']
			| BuildInput<TypeScriptMap, 'element.pair'>
			| TypeScriptMap['nodes']['element.pair']
			| BuildInput<TypeScriptMap, 'element.spread'>
			| TypeScriptMap['nodes']['element.spread']
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
	) => {
		if (value === null) return null;
		if (typeof value === 'string') {
			if (
				/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
					value
				)
			)
				return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [267, 293, 294, 453, 454, 455, 501])) return value;
			return unseated('expression.collection.object.properties', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [267, 293, 294, 453, 454, 455, 501])) return value;
			return unseated('expression.collection.object.properties', value);
		}
		switch (value.$path) {
			case 'declaration.method':
				return unbuilt('expression.collection.object.properties', value);
			case 'declaration.method.private':
				return unbuilt('expression.collection.object.properties', value);
			case 'declaration.method.protected':
				return unbuilt('expression.collection.object.properties', value);
			case 'declaration.method.public':
				return unbuilt('expression.collection.object.properties', value);
			case 'declaration.property.getter':
				return unbuilt('expression.collection.object.properties', value);
			case 'declaration.property.getter.private':
				return unbuilt('expression.collection.object.properties', value);
			case 'declaration.property.getter.protected':
				return unbuilt('expression.collection.object.properties', value);
			case 'declaration.property.getter.public':
				return unbuilt('expression.collection.object.properties', value);
			case 'declaration.property.setter':
				return unbuilt('expression.collection.object.properties', value);
			case 'declaration.property.setter.private':
				return unbuilt('expression.collection.object.properties', value);
			case 'declaration.property.setter.protected':
				return unbuilt('expression.collection.object.properties', value);
			case 'declaration.property.setter.public':
				return unbuilt('expression.collection.object.properties', value);
			case 'element.pair':
				return unbuilt('expression.collection.object.properties', value);
			case 'element.spread':
				return unbuilt('expression.collection.object.properties', value);
			case 'identifier':
				return unbuilt('expression.collection.object.properties', value);
			default:
				return unbuilt('expression.collection.object.properties', value);
		}
	};
	const expression_parenthesized$417_expression = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'expression.assignment'>
			| TypeScriptMap['nodes']['expression.assignment']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound'>
			| TypeScriptMap['nodes']['expression.assignment.compound']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound.add'>
			| TypeScriptMap['nodes']['expression.assignment.compound.add']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound.and'>
			| TypeScriptMap['nodes']['expression.assignment.compound.and']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound.bitwise_and'>
			| TypeScriptMap['nodes']['expression.assignment.compound.bitwise_and']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound.bitwise_or'>
			| TypeScriptMap['nodes']['expression.assignment.compound.bitwise_or']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound.bitwise_xor'>
			| TypeScriptMap['nodes']['expression.assignment.compound.bitwise_xor']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound.coalesce'>
			| TypeScriptMap['nodes']['expression.assignment.compound.coalesce']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound.divide'>
			| TypeScriptMap['nodes']['expression.assignment.compound.divide']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound.exponent'>
			| TypeScriptMap['nodes']['expression.assignment.compound.exponent']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound.modulo'>
			| TypeScriptMap['nodes']['expression.assignment.compound.modulo']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound.multiply'>
			| TypeScriptMap['nodes']['expression.assignment.compound.multiply']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound.or'>
			| TypeScriptMap['nodes']['expression.assignment.compound.or']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound.shift_left'>
			| TypeScriptMap['nodes']['expression.assignment.compound.shift_left']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound.shift_right'>
			| TypeScriptMap['nodes']['expression.assignment.compound.shift_right']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound.shift_right_unsigned'>
			| TypeScriptMap['nodes']['expression.assignment.compound.shift_right_unsigned']
			| BuildInput<TypeScriptMap, 'expression.assignment.compound.subtract'>
			| TypeScriptMap['nodes']['expression.assignment.compound.subtract']
			| BuildInput<TypeScriptMap, 'expression.await'>
			| TypeScriptMap['nodes']['expression.await']
			| BuildInput<TypeScriptMap, 'expression.binary'>
			| TypeScriptMap['nodes']['expression.binary']
			| BuildInput<TypeScriptMap, 'expression.binary.arithmetic.add'>
			| TypeScriptMap['nodes']['expression.binary.arithmetic.add']
			| BuildInput<TypeScriptMap, 'expression.binary.arithmetic.divide'>
			| TypeScriptMap['nodes']['expression.binary.arithmetic.divide']
			| BuildInput<TypeScriptMap, 'expression.binary.arithmetic.exponent'>
			| TypeScriptMap['nodes']['expression.binary.arithmetic.exponent']
			| BuildInput<TypeScriptMap, 'expression.binary.arithmetic.modulo'>
			| TypeScriptMap['nodes']['expression.binary.arithmetic.modulo']
			| BuildInput<TypeScriptMap, 'expression.binary.arithmetic.multiply'>
			| TypeScriptMap['nodes']['expression.binary.arithmetic.multiply']
			| BuildInput<TypeScriptMap, 'expression.binary.arithmetic.subtract'>
			| TypeScriptMap['nodes']['expression.binary.arithmetic.subtract']
			| BuildInput<TypeScriptMap, 'expression.binary.bitwise.and'>
			| TypeScriptMap['nodes']['expression.binary.bitwise.and']
			| BuildInput<TypeScriptMap, 'expression.binary.bitwise.or'>
			| TypeScriptMap['nodes']['expression.binary.bitwise.or']
			| BuildInput<TypeScriptMap, 'expression.binary.bitwise.xor'>
			| TypeScriptMap['nodes']['expression.binary.bitwise.xor']
			| BuildInput<TypeScriptMap, 'expression.binary.coalesce'>
			| TypeScriptMap['nodes']['expression.binary.coalesce']
			| BuildInput<TypeScriptMap, 'expression.binary.comparison.equal'>
			| TypeScriptMap['nodes']['expression.binary.comparison.equal']
			| BuildInput<TypeScriptMap, 'expression.binary.comparison.greater'>
			| TypeScriptMap['nodes']['expression.binary.comparison.greater']
			| BuildInput<TypeScriptMap, 'expression.binary.comparison.greater_equal'>
			| TypeScriptMap['nodes']['expression.binary.comparison.greater_equal']
			| BuildInput<TypeScriptMap, 'expression.binary.comparison.less'>
			| TypeScriptMap['nodes']['expression.binary.comparison.less']
			| BuildInput<TypeScriptMap, 'expression.binary.comparison.less_equal'>
			| TypeScriptMap['nodes']['expression.binary.comparison.less_equal']
			| BuildInput<TypeScriptMap, 'expression.binary.comparison.loose_equal'>
			| TypeScriptMap['nodes']['expression.binary.comparison.loose_equal']
			| BuildInput<TypeScriptMap, 'expression.binary.comparison.loose_not_equal'>
			| TypeScriptMap['nodes']['expression.binary.comparison.loose_not_equal']
			| BuildInput<TypeScriptMap, 'expression.binary.comparison.not_equal'>
			| TypeScriptMap['nodes']['expression.binary.comparison.not_equal']
			| BuildInput<TypeScriptMap, 'expression.binary.logical.and'>
			| TypeScriptMap['nodes']['expression.binary.logical.and']
			| BuildInput<TypeScriptMap, 'expression.binary.logical.or'>
			| TypeScriptMap['nodes']['expression.binary.logical.or']
			| BuildInput<TypeScriptMap, 'expression.binary.membership.in'>
			| TypeScriptMap['nodes']['expression.binary.membership.in']
			| BuildInput<TypeScriptMap, 'expression.binary.membership.instanceof'>
			| TypeScriptMap['nodes']['expression.binary.membership.instanceof']
			| BuildInput<TypeScriptMap, 'expression.binary.shift.left'>
			| TypeScriptMap['nodes']['expression.binary.shift.left']
			| BuildInput<TypeScriptMap, 'expression.binary.shift.right'>
			| TypeScriptMap['nodes']['expression.binary.shift.right']
			| BuildInput<TypeScriptMap, 'expression.binary.shift.right_unsigned'>
			| TypeScriptMap['nodes']['expression.binary.shift.right_unsigned']
			| BuildInput<TypeScriptMap, 'expression.call'>
			| TypeScriptMap['nodes']['expression.call']
			| BuildInput<TypeScriptMap, 'expression.call.construct'>
			| TypeScriptMap['nodes']['expression.call.construct']
			| BuildInput<TypeScriptMap, 'expression.call.construct.bare'>
			| TypeScriptMap['nodes']['expression.call.construct.bare']
			| BuildInput<TypeScriptMap, 'expression.call.member'>
			| TypeScriptMap['nodes']['expression.call.member']
			| BuildInput<TypeScriptMap, 'expression.call.template'>
			| TypeScriptMap['nodes']['expression.call.template']
			| BuildInput<TypeScriptMap, 'expression.cast.assertion'>
			| TypeScriptMap['nodes']['expression.cast.assertion']
			| BuildInput<TypeScriptMap, 'expression.cast.assertion.angle_bracket'>
			| TypeScriptMap['nodes']['expression.cast.assertion.angle_bracket']
			| BuildInput<TypeScriptMap, 'expression.cast.non_null'>
			| TypeScriptMap['nodes']['expression.cast.non_null']
			| BuildInput<TypeScriptMap, 'expression.cast.satisfies'>
			| TypeScriptMap['nodes']['expression.cast.satisfies']
			| BuildInput<TypeScriptMap, 'expression.class'>
			| TypeScriptMap['nodes']['expression.class']
			| BuildInput<TypeScriptMap, 'expression.collection.list'>
			| TypeScriptMap['nodes']['expression.collection.list']
			| BuildInput<TypeScriptMap, 'expression.collection.object'>
			| TypeScriptMap['nodes']['expression.collection.object']
			| BuildInput<TypeScriptMap, 'expression.conditional'>
			| TypeScriptMap['nodes']['expression.conditional']
			| BuildInput<TypeScriptMap, 'expression.function'>
			| TypeScriptMap['nodes']['expression.function']
			| BuildInput<TypeScriptMap, 'expression.instantiation'>
			| TypeScriptMap['nodes']['expression.instantiation']
			| BuildInput<TypeScriptMap, 'expression.lambda'>
			| TypeScriptMap['nodes']['expression.lambda']
			| BuildInput<TypeScriptMap, 'expression.member'>
			| TypeScriptMap['nodes']['expression.member']
			| BuildInput<TypeScriptMap, 'expression.parenthesized'>
			| TypeScriptMap['nodes']['expression.parenthesized']
			| BuildInput<TypeScriptMap, 'expression.sequence'>
			| TypeScriptMap['nodes']['expression.sequence']
			| BuildInput<TypeScriptMap, 'expression.subscript'>
			| TypeScriptMap['nodes']['expression.subscript']
			| BuildInput<TypeScriptMap, 'expression.unary'>
			| TypeScriptMap['nodes']['expression.unary']
			| BuildInput<TypeScriptMap, 'expression.unary.bitwise_not'>
			| TypeScriptMap['nodes']['expression.unary.bitwise_not']
			| BuildInput<TypeScriptMap, 'expression.unary.delete'>
			| TypeScriptMap['nodes']['expression.unary.delete']
			| BuildInput<TypeScriptMap, 'expression.unary.negation'>
			| TypeScriptMap['nodes']['expression.unary.negation']
			| BuildInput<TypeScriptMap, 'expression.unary.not'>
			| TypeScriptMap['nodes']['expression.unary.not']
			| BuildInput<TypeScriptMap, 'expression.unary.plus'>
			| TypeScriptMap['nodes']['expression.unary.plus']
			| BuildInput<TypeScriptMap, 'expression.unary.typeof'>
			| TypeScriptMap['nodes']['expression.unary.typeof']
			| BuildInput<TypeScriptMap, 'expression.unary.void'>
			| TypeScriptMap['nodes']['expression.unary.void']
			| BuildInput<TypeScriptMap, 'expression.update'>
			| TypeScriptMap['nodes']['expression.update']
			| BuildInput<TypeScriptMap, 'expression.update.decrement'>
			| TypeScriptMap['nodes']['expression.update.decrement']
			| BuildInput<TypeScriptMap, 'expression.update.increment'>
			| TypeScriptMap['nodes']['expression.update.increment']
			| BuildInput<TypeScriptMap, 'expression.yield'>
			| TypeScriptMap['nodes']['expression.yield']
			| BuildInput<TypeScriptMap, 'expression.yield.delegate'>
			| TypeScriptMap['nodes']['expression.yield.delegate']
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
			| BuildInput<TypeScriptMap, 'literal.boolean.false'>
			| TypeScriptMap['nodes']['literal.boolean.false']
			| BuildInput<TypeScriptMap, 'literal.boolean.true'>
			| TypeScriptMap['nodes']['literal.boolean.true']
			| BuildInput<TypeScriptMap, 'literal.null'>
			| TypeScriptMap['nodes']['literal.null']
			| BuildInput<TypeScriptMap, 'literal.null.undefined'>
			| TypeScriptMap['nodes']['literal.null.undefined']
			| BuildInput<TypeScriptMap, 'literal.number.float'>
			| TypeScriptMap['nodes']['literal.number.float']
			| BuildInput<TypeScriptMap, 'literal.number.float.leading_point'>
			| TypeScriptMap['nodes']['literal.number.float.leading_point']
			| BuildInput<TypeScriptMap, 'literal.number.float.scientific'>
			| TypeScriptMap['nodes']['literal.number.float.scientific']
			| BuildInput<TypeScriptMap, 'literal.number.integer'>
			| TypeScriptMap['nodes']['literal.number.integer']
			| BuildInput<TypeScriptMap, 'literal.number.integer.big'>
			| TypeScriptMap['nodes']['literal.number.integer.big']
			| BuildInput<TypeScriptMap, 'literal.number.integer.big.binary'>
			| TypeScriptMap['nodes']['literal.number.integer.big.binary']
			| BuildInput<TypeScriptMap, 'literal.number.integer.big.hex'>
			| TypeScriptMap['nodes']['literal.number.integer.big.hex']
			| BuildInput<TypeScriptMap, 'literal.number.integer.big.octal'>
			| TypeScriptMap['nodes']['literal.number.integer.big.octal']
			| BuildInput<TypeScriptMap, 'literal.number.integer.binary'>
			| TypeScriptMap['nodes']['literal.number.integer.binary']
			| BuildInput<TypeScriptMap, 'literal.number.integer.hex'>
			| TypeScriptMap['nodes']['literal.number.integer.hex']
			| BuildInput<TypeScriptMap, 'literal.number.integer.octal'>
			| TypeScriptMap['nodes']['literal.number.integer.octal']
			| BuildInput<TypeScriptMap, 'literal.regex'>
			| TypeScriptMap['nodes']['literal.regex']
			| BuildInput<TypeScriptMap, 'literal.string'>
			| TypeScriptMap['nodes']['literal.string']
			| BuildInput<TypeScriptMap, 'literal.string.interpolated'>
			| TypeScriptMap['nodes']['literal.string.interpolated']
	) => {
		if (typeof value === 'string') return value;
		if (typeof value === 'number') {
			if (seated(value, [272])) return value;
			return unseated('expression.parenthesized.expression', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [272])) return value;
			return unseated('expression.parenthesized.expression', value);
		}
		switch (value.$path) {
			case 'expression.assignment':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound.add':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound.and':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound.bitwise_and':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound.bitwise_or':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound.bitwise_xor':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound.coalesce':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound.divide':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound.exponent':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound.modulo':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound.multiply':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound.or':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound.shift_left':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound.shift_right':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound.shift_right_unsigned':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.assignment.compound.subtract':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.await':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.arithmetic.add':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.arithmetic.divide':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.arithmetic.exponent':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.arithmetic.modulo':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.arithmetic.multiply':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.arithmetic.subtract':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.bitwise.and':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.bitwise.or':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.bitwise.xor':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.coalesce':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.comparison.equal':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.comparison.greater':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.comparison.greater_equal':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.comparison.less':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.comparison.less_equal':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.comparison.loose_equal':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.comparison.loose_not_equal':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.comparison.not_equal':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.logical.and':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.logical.or':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.membership.in':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.membership.instanceof':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.shift.left':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.shift.right':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.binary.shift.right_unsigned':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.call':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.call.construct':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.call.construct.bare':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.call.member':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.call.template':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.cast.assertion':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.cast.assertion.angle_bracket':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.cast.non_null':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.cast.satisfies':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.class':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.collection.list':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.collection.object':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.conditional':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.function':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.instantiation':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.lambda':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.member':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.parenthesized':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.sequence':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.subscript':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.unary':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.unary.bitwise_not':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.unary.delete':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.unary.negation':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.unary.not':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.unary.plus':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.unary.typeof':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.unary.void':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.update':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.update.decrement':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.update.increment':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.yield':
				return unbuilt('expression.parenthesized.expression', value);
			case 'expression.yield.delegate':
				return unbuilt('expression.parenthesized.expression', value);
			case 'identifier':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.boolean.false':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.boolean.true':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.null':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.null.undefined':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.number.float':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.number.float.leading_point':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.number.float.scientific':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.number.integer':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.number.integer.big':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.number.integer.big.binary':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.number.integer.big.hex':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.number.integer.big.octal':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.number.integer.binary':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.number.integer.hex':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.number.integer.octal':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.regex':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.string':
				return unbuilt('expression.parenthesized.expression', value);
			case 'literal.string.interpolated':
				return unbuilt('expression.parenthesized.expression', value);
			default:
				return unbuilt('expression.parenthesized.expression', value);
		}
	};
	const identifier_qualified$244_name = (
		value: string | BuildInput<TypeScriptMap, 'identifier'> | TypeScriptMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (
				/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
					value
				)
			)
				return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [500])) return value;
			return unseated('identifier.qualified.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [500])) return value;
			return unseated('identifier.qualified.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('identifier.qualified.name', value);
			default:
				return unbuilt('identifier.qualified.name', value);
		}
	};
	const identifier_qualified$244_qualifier = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
			| BuildInput<TypeScriptMap, 'identifier.qualified'>
			| TypeScriptMap['nodes']['identifier.qualified']
			| BuildInput<TypeScriptMap, 'type.import'>
			| TypeScriptMap['nodes']['type.import']
	) => {
		if (typeof value === 'string') {
			if (
				/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
					value
				)
			)
				return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 244])) return value;
			return unseated('identifier.qualified.qualifier', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 244])) return value;
			return unseated('identifier.qualified.qualifier', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('identifier.qualified.qualifier', value);
			case 'identifier.qualified':
				return identifier_qualified$244(value);
			case 'type.import':
				return unbuilt('identifier.qualified.qualifier', value);
			default:
				return unbuilt('identifier.qualified.qualifier', value);
		}
	};
	const identifier_qualified$319_name = (
		value: string | BuildInput<TypeScriptMap, 'identifier'> | TypeScriptMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (
				/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
					value
				)
			)
				return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [505])) return value;
			return unseated('identifier.qualified.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [505])) return value;
			return unseated('identifier.qualified.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('identifier.qualified.name', value);
			default:
				return unbuilt('identifier.qualified.name', value);
		}
	};
	const identifier_qualified$319_qualifier = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
			| BuildInput<TypeScriptMap, 'identifier.qualified'>
			| TypeScriptMap['nodes']['identifier.qualified']
			| BuildInput<TypeScriptMap, 'type.import'>
			| TypeScriptMap['nodes']['type.import']
	) => {
		if (typeof value === 'string') {
			if (
				/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
					value
				)
			)
				return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 244])) return value;
			return unseated('identifier.qualified.qualifier', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 244])) return value;
			return unseated('identifier.qualified.qualifier', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('identifier.qualified.qualifier', value);
			case 'identifier.qualified':
				return identifier_qualified$244(value);
			case 'type.import':
				return unbuilt('identifier.qualified.qualifier', value);
			default:
				return unbuilt('identifier.qualified.qualifier', value);
		}
	};
	const identifier_qualified$354_name = (
		value: string | BuildInput<TypeScriptMap, 'identifier'> | TypeScriptMap['nodes']['identifier']
	) => {
		if (typeof value === 'string') {
			if (
				/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
					value
				)
			)
				return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [128, 500])) return value;
			return unseated('identifier.qualified.name', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [128, 500])) return value;
			return unseated('identifier.qualified.name', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('identifier.qualified.name', value);
			default:
				return unbuilt('identifier.qualified.name', value);
		}
	};
	const identifier_qualified$354_qualifier = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
			| BuildInput<TypeScriptMap, 'identifier.qualified'>
			| TypeScriptMap['nodes']['identifier.qualified']
			| BuildInput<TypeScriptMap, 'type.import'>
			| TypeScriptMap['nodes']['type.import']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case 'this':
					return 279;
				default:
					if (
						/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
							value
						)
					)
						return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 354, 355, 356])) return value;
			return unseated('identifier.qualified.qualifier', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 279, 354, 355, 356])) return value;
			return unseated('identifier.qualified.qualifier', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('identifier.qualified.qualifier', value);
			case 'identifier.qualified':
				return identifier_qualified$354(value);
			case 'type.import':
				return unbuilt('identifier.qualified.qualifier', value);
			default:
				return unbuilt('identifier.qualified.qualifier', value);
		}
	};
	const literal_regex$276_flags = (
		value: string | BuildInput<TypeScriptMap, 'literal.regex.flags'> | TypeScriptMap['nodes']['literal.regex.flags']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:[a-z]+))$/u.test(value)) return b.regexFlags(value);
			return b.regexFlags(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [127])) return value;
			return unseated('literal.regex.flags', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [127])) return value;
			return unseated('literal.regex.flags', value);
		}
		switch (value.$path) {
			case 'literal.regex.flags':
				return unbuilt('literal.regex.flags', value);
			default:
				return unbuilt('literal.regex.flags', value);
		}
	};
	const literal_regex$276_pattern = (
		value: string | BuildInput<TypeScriptMap, 'literal.regex.pattern'> | TypeScriptMap['nodes']['literal.regex.pattern']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:(?:\[(?:(?:\\(?:[^\x0A])|(?:[^\]\n\\])))*\]|\\(?:[^\x0A])|(?:[^/\\[\n])))+)$/u.test(value))
				return b.regexPattern(value);
			return b.regexPattern(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [126])) return value;
			return unseated('literal.regex.pattern', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [126])) return value;
			return unseated('literal.regex.pattern', value);
		}
		switch (value.$path) {
			case 'literal.regex.pattern':
				return unbuilt('literal.regex.pattern', value);
			default:
				return unbuilt('literal.regex.pattern', value);
		}
	};
	const literal_string$424_elements = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'literal.string.escape'>
			| TypeScriptMap['nodes']['literal.string.escape']
			| BuildInput<TypeScriptMap, 'literal.string.text'>
			| TypeScriptMap['nodes']['literal.string.text']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:[^"\\\r\n]+))$/u.test(value)) return b.unescapedDoubleStringFragment(value);
			return b.unescapedDoubleStringFragment(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [119, 121])) return value;
			return unseated('literal.string.elements', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [119, 121])) return value;
			return unseated('literal.string.elements', value);
		}
		switch (value.$path) {
			case 'literal.string.escape':
				return unbuilt('literal.string.elements', value);
			case 'literal.string.text':
				return unbuilt('literal.string.elements', value);
			default:
				return unbuilt('literal.string.elements', value);
		}
	};
	const literal_string_interpolated$274_elements = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'expression.interpolation'>
			| TypeScriptMap['nodes']['expression.interpolation']
			| BuildInput<TypeScriptMap, 'literal.string.escape'>
			| TypeScriptMap['nodes']['literal.string.escape']
			| BuildInput<TypeScriptMap, 'literal.string.text'>
			| TypeScriptMap['nodes']['literal.string.text']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:[^`\\$]+))$/u.test(value)) return b.templateChars(value);
			return b.templateChars(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [121, 176, 275])) return value;
			return unseated('literal.string.interpolated.elements', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [121, 176, 275])) return value;
			return unseated('literal.string.interpolated.elements', value);
		}
		switch (value.$path) {
			case 'expression.interpolation':
				return unbuilt('literal.string.interpolated.elements', value);
			case 'literal.string.escape':
				return unbuilt('literal.string.interpolated.elements', value);
			case 'literal.string.text':
				return unbuilt('literal.string.interpolated.elements', value);
			default:
				return unbuilt('literal.string.interpolated.elements', value);
		}
	};
	const pattern_list$243_elements = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'expression.cast.non_null'>
			| TypeScriptMap['nodes']['expression.cast.non_null']
			| BuildInput<TypeScriptMap, 'expression.member'>
			| TypeScriptMap['nodes']['expression.member']
			| BuildInput<TypeScriptMap, 'expression.subscript'>
			| TypeScriptMap['nodes']['expression.subscript']
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
			| BuildInput<TypeScriptMap, 'literal.null.undefined'>
			| TypeScriptMap['nodes']['literal.null.undefined']
			| BuildInput<TypeScriptMap, 'pattern.assignment'>
			| TypeScriptMap['nodes']['pattern.assignment']
			| BuildInput<TypeScriptMap, 'pattern.list'>
			| TypeScriptMap['nodes']['pattern.list']
			| BuildInput<TypeScriptMap, 'pattern.object'>
			| TypeScriptMap['nodes']['pattern.object']
			| BuildInput<TypeScriptMap, 'pattern.rest'>
			| TypeScriptMap['nodes']['pattern.rest']
	) => {
		if (value === null) return null;
		if (typeof value === 'string') {
			if (
				/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
					value
				)
			)
				return b.lhsExpression(b.identifier(value));
			return b.lhsExpression(b.identifier(value));
		}
		if (typeof value === 'number') {
			if (seated(value, [240, 291, 292])) return value;
			if (seated(value, [1, 129, 239, 243, 259, 260, 300])) return b.lhsExpression(value);
			return unseated('pattern.list.elements', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [240, 291, 292])) return value;
			if (seated(value, [1, 129, 239, 243, 259, 260, 300])) return b.lhsExpression(value);
			return unseated('pattern.list.elements', value);
		}
		switch (value.$path) {
			case 'expression.cast.non_null':
				return unbuilt('pattern.list.elements', value);
			case 'expression.member':
				return unbuilt('pattern.list.elements', value);
			case 'expression.subscript':
				return unbuilt('pattern.list.elements', value);
			case 'identifier':
				return unbuilt('pattern.list.elements', value);
			case 'literal.null.undefined':
				return unbuilt('pattern.list.elements', value);
			case 'pattern.assignment':
				return unbuilt('pattern.list.elements', value);
			case 'pattern.list':
				return b.lhsExpression(pattern_list$243(value));
			case 'pattern.object':
				return b.lhsExpression(pattern_object$239(value));
			case 'pattern.rest':
				return pattern_rest$292(value);
			default:
				return unbuilt('pattern.list.elements', value);
		}
	};
	const pattern_object$239_properties = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
			| BuildInput<TypeScriptMap, 'pattern.object.assignment'>
			| TypeScriptMap['nodes']['pattern.object.assignment']
			| BuildInput<TypeScriptMap, 'pattern.object.pair'>
			| TypeScriptMap['nodes']['pattern.object.pair']
			| BuildInput<TypeScriptMap, 'pattern.rest'>
			| TypeScriptMap['nodes']['pattern.rest']
	) => {
		if (value === null) return null;
		if (typeof value === 'string') {
			if (
				/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
					value
				)
			)
				return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [241, 292, 295, 502])) return value;
			return unseated('pattern.object.properties', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [241, 292, 295, 502])) return value;
			return unseated('pattern.object.properties', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('pattern.object.properties', value);
			case 'pattern.object.assignment':
				return unbuilt('pattern.object.properties', value);
			case 'pattern.object.pair':
				return unbuilt('pattern.object.properties', value);
			case 'pattern.rest':
				return pattern_rest$292(value);
			default:
				return unbuilt('pattern.object.properties', value);
		}
	};
	const pattern_rest$292_pattern = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'expression.cast.non_null'>
			| TypeScriptMap['nodes']['expression.cast.non_null']
			| BuildInput<TypeScriptMap, 'expression.member'>
			| TypeScriptMap['nodes']['expression.member']
			| BuildInput<TypeScriptMap, 'expression.subscript'>
			| TypeScriptMap['nodes']['expression.subscript']
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
			| BuildInput<TypeScriptMap, 'literal.null.undefined'>
			| TypeScriptMap['nodes']['literal.null.undefined']
			| BuildInput<TypeScriptMap, 'pattern.list'>
			| TypeScriptMap['nodes']['pattern.list']
			| BuildInput<TypeScriptMap, 'pattern.object'>
			| TypeScriptMap['nodes']['pattern.object']
	) => {
		if (typeof value === 'string') {
			if (
				/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
					value
				)
			)
				return b.identifier(value);
			return b.identifier(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 129, 239, 243, 259, 260, 300])) return value;
			return unseated('pattern.rest.pattern', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 129, 239, 243, 259, 260, 300])) return value;
			return unseated('pattern.rest.pattern', value);
		}
		switch (value.$path) {
			case 'expression.cast.non_null':
				return unbuilt('pattern.rest.pattern', value);
			case 'expression.member':
				return unbuilt('pattern.rest.pattern', value);
			case 'expression.subscript':
				return unbuilt('pattern.rest.pattern', value);
			case 'identifier':
				return unbuilt('pattern.rest.pattern', value);
			case 'literal.null.undefined':
				return unbuilt('pattern.rest.pattern', value);
			case 'pattern.list':
				return pattern_list$243(value);
			case 'pattern.object':
				return pattern_object$239(value);
			default:
				return unbuilt('pattern.rest.pattern', value);
		}
	};
	const type_array$378_type = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
			| BuildInput<TypeScriptMap, 'identifier.qualified'>
			| TypeScriptMap['nodes']['identifier.qualified']
			| BuildInput<TypeScriptMap, 'type.array'>
			| TypeScriptMap['nodes']['type.array']
			| BuildInput<TypeScriptMap, 'type.conditional'>
			| TypeScriptMap['nodes']['type.conditional']
			| BuildInput<TypeScriptMap, 'type.generic'>
			| TypeScriptMap['nodes']['type.generic']
			| BuildInput<TypeScriptMap, 'type.index_query'>
			| TypeScriptMap['nodes']['type.index_query']
			| BuildInput<TypeScriptMap, 'type.intersection'>
			| TypeScriptMap['nodes']['type.intersection']
			| BuildInput<TypeScriptMap, 'type.literal'>
			| TypeScriptMap['nodes']['type.literal']
			| BuildInput<TypeScriptMap, 'type.lookup'>
			| TypeScriptMap['nodes']['type.lookup']
			| BuildInput<TypeScriptMap, 'type.nullable'>
			| TypeScriptMap['nodes']['type.nullable']
			| BuildInput<TypeScriptMap, 'type.object'>
			| TypeScriptMap['nodes']['type.object']
			| BuildInput<TypeScriptMap, 'type.parenthesized'>
			| TypeScriptMap['nodes']['type.parenthesized']
			| BuildInput<TypeScriptMap, 'type.query'>
			| TypeScriptMap['nodes']['type.query']
			| BuildInput<TypeScriptMap, 'type.template'>
			| TypeScriptMap['nodes']['type.template']
			| BuildInput<TypeScriptMap, 'type.tuple'>
			| TypeScriptMap['nodes']['type.tuple']
			| BuildInput<TypeScriptMap, 'type.union'>
			| TypeScriptMap['nodes']['type.union']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case '*':
					return 364;
				case 'any':
					return 40;
				case 'boolean':
					return 42;
				case 'never':
					return 146;
				case 'number':
					return 41;
				case 'object':
					return 46;
				case 'string':
					return 43;
				case 'symbol':
					return 44;
				case 'this':
					return 504;
				case 'unique symbol':
					return 144;
				case 'unknown':
					return 145;
				case 'void':
					return 78;
				default:
					if (
						/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
							value
						)
					)
						return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [319, 346, 348, 350, 351, 358, 359, 360, 362, 365, 366, 367, 369, 378, 379, 381, 382, 505]))
				return value;
			return unseated('type.array.type', value);
		}
		if (engine.isNode(value)) {
			if (
				seated(
					value,
					[
						40, 41, 42, 43, 44, 46, 78, 144, 145, 146, 319, 346, 348, 350, 351, 358, 359, 360, 362, 364, 365, 366, 367,
						369, 378, 379, 381, 382, 504, 505
					]
				)
			)
				return value;
			return unseated('type.array.type', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('type.array.type', value);
			case 'identifier.qualified':
				return identifier_qualified$319(value);
			case 'type.array':
				return type_array$378(value);
			case 'type.conditional':
				return unbuilt('type.array.type', value);
			case 'type.generic':
				return unbuilt('type.array.type', value);
			case 'type.index_query':
				return type_index_query$359(value);
			case 'type.intersection':
				return unbuilt('type.array.type', value);
			case 'type.literal':
				return unbuilt('type.array.type', value);
			case 'type.lookup':
				return unbuilt('type.array.type', value);
			case 'type.nullable':
				return type_nullable$365(value);
			case 'type.object':
				return type_object$369(value);
			case 'type.parenthesized':
				return unbuilt('type.array.type', value);
			case 'type.query':
				return type_query$358(value);
			case 'type.template':
				return type_template$348(value);
			case 'type.tuple':
				return unbuilt('type.array.type', value);
			case 'type.union':
				return unbuilt('type.array.type', value);
			default:
				return unbuilt('type.array.type', value);
		}
	};
	const type_index_query$359_type = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
			| BuildInput<TypeScriptMap, 'identifier.qualified'>
			| TypeScriptMap['nodes']['identifier.qualified']
			| BuildInput<TypeScriptMap, 'type.array'>
			| TypeScriptMap['nodes']['type.array']
			| BuildInput<TypeScriptMap, 'type.conditional'>
			| TypeScriptMap['nodes']['type.conditional']
			| BuildInput<TypeScriptMap, 'type.generic'>
			| TypeScriptMap['nodes']['type.generic']
			| BuildInput<TypeScriptMap, 'type.index_query'>
			| TypeScriptMap['nodes']['type.index_query']
			| BuildInput<TypeScriptMap, 'type.intersection'>
			| TypeScriptMap['nodes']['type.intersection']
			| BuildInput<TypeScriptMap, 'type.literal'>
			| TypeScriptMap['nodes']['type.literal']
			| BuildInput<TypeScriptMap, 'type.lookup'>
			| TypeScriptMap['nodes']['type.lookup']
			| BuildInput<TypeScriptMap, 'type.nullable'>
			| TypeScriptMap['nodes']['type.nullable']
			| BuildInput<TypeScriptMap, 'type.object'>
			| TypeScriptMap['nodes']['type.object']
			| BuildInput<TypeScriptMap, 'type.parenthesized'>
			| TypeScriptMap['nodes']['type.parenthesized']
			| BuildInput<TypeScriptMap, 'type.query'>
			| TypeScriptMap['nodes']['type.query']
			| BuildInput<TypeScriptMap, 'type.template'>
			| TypeScriptMap['nodes']['type.template']
			| BuildInput<TypeScriptMap, 'type.tuple'>
			| TypeScriptMap['nodes']['type.tuple']
			| BuildInput<TypeScriptMap, 'type.union'>
			| TypeScriptMap['nodes']['type.union']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case '*':
					return 364;
				case 'any':
					return 40;
				case 'boolean':
					return 42;
				case 'never':
					return 146;
				case 'number':
					return 41;
				case 'object':
					return 46;
				case 'string':
					return 43;
				case 'symbol':
					return 44;
				case 'this':
					return 504;
				case 'unique symbol':
					return 144;
				case 'unknown':
					return 145;
				case 'void':
					return 78;
				default:
					if (
						/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
							value
						)
					)
						return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [319, 346, 348, 350, 351, 358, 359, 360, 362, 365, 366, 367, 369, 378, 379, 381, 382, 505]))
				return value;
			return unseated('type.index_query.type', value);
		}
		if (engine.isNode(value)) {
			if (
				seated(
					value,
					[
						40, 41, 42, 43, 44, 46, 78, 144, 145, 146, 319, 346, 348, 350, 351, 358, 359, 360, 362, 364, 365, 366, 367,
						369, 378, 379, 381, 382, 504, 505
					]
				)
			)
				return value;
			return unseated('type.index_query.type', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('type.index_query.type', value);
			case 'identifier.qualified':
				return identifier_qualified$319(value);
			case 'type.array':
				return type_array$378(value);
			case 'type.conditional':
				return unbuilt('type.index_query.type', value);
			case 'type.generic':
				return unbuilt('type.index_query.type', value);
			case 'type.index_query':
				return type_index_query$359(value);
			case 'type.intersection':
				return unbuilt('type.index_query.type', value);
			case 'type.literal':
				return unbuilt('type.index_query.type', value);
			case 'type.lookup':
				return unbuilt('type.index_query.type', value);
			case 'type.nullable':
				return type_nullable$365(value);
			case 'type.object':
				return type_object$369(value);
			case 'type.parenthesized':
				return unbuilt('type.index_query.type', value);
			case 'type.query':
				return type_query$358(value);
			case 'type.template':
				return type_template$348(value);
			case 'type.tuple':
				return unbuilt('type.index_query.type', value);
			case 'type.union':
				return unbuilt('type.index_query.type', value);
			default:
				return unbuilt('type.index_query.type', value);
		}
	};
	const type_nullable$365_type = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
			| BuildInput<TypeScriptMap, 'identifier.qualified'>
			| TypeScriptMap['nodes']['identifier.qualified']
			| BuildInput<TypeScriptMap, 'type.array'>
			| TypeScriptMap['nodes']['type.array']
			| BuildInput<TypeScriptMap, 'type.conditional'>
			| TypeScriptMap['nodes']['type.conditional']
			| BuildInput<TypeScriptMap, 'type.generic'>
			| TypeScriptMap['nodes']['type.generic']
			| BuildInput<TypeScriptMap, 'type.index_query'>
			| TypeScriptMap['nodes']['type.index_query']
			| BuildInput<TypeScriptMap, 'type.intersection'>
			| TypeScriptMap['nodes']['type.intersection']
			| BuildInput<TypeScriptMap, 'type.literal'>
			| TypeScriptMap['nodes']['type.literal']
			| BuildInput<TypeScriptMap, 'type.lookup'>
			| TypeScriptMap['nodes']['type.lookup']
			| BuildInput<TypeScriptMap, 'type.nullable'>
			| TypeScriptMap['nodes']['type.nullable']
			| BuildInput<TypeScriptMap, 'type.object'>
			| TypeScriptMap['nodes']['type.object']
			| BuildInput<TypeScriptMap, 'type.parenthesized'>
			| TypeScriptMap['nodes']['type.parenthesized']
			| BuildInput<TypeScriptMap, 'type.query'>
			| TypeScriptMap['nodes']['type.query']
			| BuildInput<TypeScriptMap, 'type.template'>
			| TypeScriptMap['nodes']['type.template']
			| BuildInput<TypeScriptMap, 'type.tuple'>
			| TypeScriptMap['nodes']['type.tuple']
			| BuildInput<TypeScriptMap, 'type.union'>
			| TypeScriptMap['nodes']['type.union']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case '*':
					return 364;
				case 'any':
					return 40;
				case 'boolean':
					return 42;
				case 'never':
					return 146;
				case 'number':
					return 41;
				case 'object':
					return 46;
				case 'string':
					return 43;
				case 'symbol':
					return 44;
				case 'this':
					return 504;
				case 'unique symbol':
					return 144;
				case 'unknown':
					return 145;
				case 'void':
					return 78;
				default:
					if (
						/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
							value
						)
					)
						return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [319, 346, 348, 350, 351, 358, 359, 360, 362, 365, 366, 367, 369, 378, 379, 381, 382, 505]))
				return value;
			return unseated('type.nullable.type', value);
		}
		if (engine.isNode(value)) {
			if (
				seated(
					value,
					[
						40, 41, 42, 43, 44, 46, 78, 144, 145, 146, 319, 346, 348, 350, 351, 358, 359, 360, 362, 364, 365, 366, 367,
						369, 378, 379, 381, 382, 504, 505
					]
				)
			)
				return value;
			return unseated('type.nullable.type', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('type.nullable.type', value);
			case 'identifier.qualified':
				return identifier_qualified$319(value);
			case 'type.array':
				return type_array$378(value);
			case 'type.conditional':
				return unbuilt('type.nullable.type', value);
			case 'type.generic':
				return unbuilt('type.nullable.type', value);
			case 'type.index_query':
				return type_index_query$359(value);
			case 'type.intersection':
				return unbuilt('type.nullable.type', value);
			case 'type.literal':
				return unbuilt('type.nullable.type', value);
			case 'type.lookup':
				return unbuilt('type.nullable.type', value);
			case 'type.nullable':
				return type_nullable$365(value);
			case 'type.object':
				return type_object$369(value);
			case 'type.parenthesized':
				return unbuilt('type.nullable.type', value);
			case 'type.query':
				return type_query$358(value);
			case 'type.template':
				return type_template$348(value);
			case 'type.tuple':
				return unbuilt('type.nullable.type', value);
			case 'type.union':
				return unbuilt('type.nullable.type', value);
			default:
				return unbuilt('type.nullable.type', value);
		}
	};
	const type_object$369_closing = (value: string) => {
		if (typeof value === 'string') {
			switch (value) {
				case '|}':
					return 148;
				case '}':
					return 6;
				default:
					return value;
			}
		}
		if (typeof value === 'number') {
			return unseated('type.object.closing', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [6, 148])) return value;
			return unseated('type.object.closing', value);
		}
		throw new Error('type.object.closing takes no structure');
	};
	const type_object$369_members$item = (
		value:
			| BuildInput<TypeScriptMap, 'declaration.field.signature'>
			| TypeScriptMap['nodes']['declaration.field.signature']
			| BuildInput<TypeScriptMap, 'declaration.field.signature.private'>
			| TypeScriptMap['nodes']['declaration.field.signature.private']
			| BuildInput<TypeScriptMap, 'declaration.field.signature.protected'>
			| TypeScriptMap['nodes']['declaration.field.signature.protected']
			| BuildInput<TypeScriptMap, 'declaration.field.signature.public'>
			| TypeScriptMap['nodes']['declaration.field.signature.public']
			| BuildInput<TypeScriptMap, 'declaration.method.signature'>
			| TypeScriptMap['nodes']['declaration.method.signature']
			| BuildInput<TypeScriptMap, 'declaration.method.signature.private'>
			| TypeScriptMap['nodes']['declaration.method.signature.private']
			| BuildInput<TypeScriptMap, 'declaration.method.signature.protected'>
			| TypeScriptMap['nodes']['declaration.method.signature.protected']
			| BuildInput<TypeScriptMap, 'declaration.method.signature.public'>
			| TypeScriptMap['nodes']['declaration.method.signature.public']
			| BuildInput<TypeScriptMap, 'declaration.property.signature.getter'>
			| TypeScriptMap['nodes']['declaration.property.signature.getter']
			| BuildInput<TypeScriptMap, 'declaration.property.signature.getter.private'>
			| TypeScriptMap['nodes']['declaration.property.signature.getter.private']
			| BuildInput<TypeScriptMap, 'declaration.property.signature.getter.protected'>
			| TypeScriptMap['nodes']['declaration.property.signature.getter.protected']
			| BuildInput<TypeScriptMap, 'declaration.property.signature.getter.public'>
			| TypeScriptMap['nodes']['declaration.property.signature.getter.public']
			| BuildInput<TypeScriptMap, 'declaration.property.signature.setter'>
			| TypeScriptMap['nodes']['declaration.property.signature.setter']
			| BuildInput<TypeScriptMap, 'declaration.property.signature.setter.private'>
			| TypeScriptMap['nodes']['declaration.property.signature.setter.private']
			| BuildInput<TypeScriptMap, 'declaration.property.signature.setter.protected'>
			| TypeScriptMap['nodes']['declaration.property.signature.setter.protected']
			| BuildInput<TypeScriptMap, 'declaration.property.signature.setter.public'>
			| TypeScriptMap['nodes']['declaration.property.signature.setter.public']
			| BuildInput<TypeScriptMap, 'declaration.signature.call'>
			| TypeScriptMap['nodes']['declaration.signature.call']
			| BuildInput<TypeScriptMap, 'declaration.signature.construct'>
			| TypeScriptMap['nodes']['declaration.signature.construct']
			| BuildInput<TypeScriptMap, 'declaration.signature.index'>
			| TypeScriptMap['nodes']['declaration.signature.index']
			| BuildInput<TypeScriptMap, 'declaration.signature.index.mapped'>
			| TypeScriptMap['nodes']['declaration.signature.index.mapped']
			| BuildInput<TypeScriptMap, 'statement.export'>
			| TypeScriptMap['nodes']['statement.export']
			| BuildInput<TypeScriptMap, 'statement.export.all'>
			| TypeScriptMap['nodes']['statement.export.all']
			| BuildInput<TypeScriptMap, 'statement.export.default'>
			| TypeScriptMap['nodes']['statement.export.default']
	) => {
		if (typeof value === 'number') {
			if (seated(value, [191, 301, 370, 371, 376, 377, 409, 410, 418, 419, 420, 431, 432, 456, 457, 458])) return value;
			return unseated('type.object.members', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [191, 301, 370, 371, 376, 377, 409, 410, 418, 419, 420, 431, 432, 456, 457, 458])) return value;
			return unseated('type.object.members', value);
		}
		switch (value.$path) {
			case 'declaration.field.signature':
				return unbuilt('type.object.members', value);
			case 'declaration.field.signature.private':
				return unbuilt('type.object.members', value);
			case 'declaration.field.signature.protected':
				return unbuilt('type.object.members', value);
			case 'declaration.field.signature.public':
				return unbuilt('type.object.members', value);
			case 'declaration.method.signature':
				return unbuilt('type.object.members', value);
			case 'declaration.method.signature.private':
				return unbuilt('type.object.members', value);
			case 'declaration.method.signature.protected':
				return unbuilt('type.object.members', value);
			case 'declaration.method.signature.public':
				return unbuilt('type.object.members', value);
			case 'declaration.property.signature.getter':
				return unbuilt('type.object.members', value);
			case 'declaration.property.signature.getter.private':
				return unbuilt('type.object.members', value);
			case 'declaration.property.signature.getter.protected':
				return unbuilt('type.object.members', value);
			case 'declaration.property.signature.getter.public':
				return unbuilt('type.object.members', value);
			case 'declaration.property.signature.setter':
				return unbuilt('type.object.members', value);
			case 'declaration.property.signature.setter.private':
				return unbuilt('type.object.members', value);
			case 'declaration.property.signature.setter.protected':
				return unbuilt('type.object.members', value);
			case 'declaration.property.signature.setter.public':
				return unbuilt('type.object.members', value);
			case 'declaration.signature.call':
				return unbuilt('type.object.members', value);
			case 'declaration.signature.construct':
				return unbuilt('type.object.members', value);
			case 'declaration.signature.index':
				return unbuilt('type.object.members', value);
			case 'declaration.signature.index.mapped':
				return unbuilt('type.object.members', value);
			case 'statement.export':
				return unbuilt('type.object.members', value);
			case 'statement.export.all':
				return unbuilt('type.object.members', value);
			case 'statement.export.default':
				return unbuilt('type.object.members', value);
			default:
				return unbuilt('type.object.members', value);
		}
	};
	const type_object$369_opening = (value: string) => {
		if (typeof value === 'string') {
			switch (value) {
				case '{':
					return 5;
				case '{|':
					return 147;
				default:
					return value;
			}
		}
		if (typeof value === 'number') {
			return unseated('type.object.opening', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [5, 147])) return value;
			return unseated('type.object.opening', value);
		}
		throw new Error('type.object.opening takes no structure');
	};
	const type_predicate_asserts$337_value = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
			| BuildInput<TypeScriptMap, 'type.predicate'>
			| TypeScriptMap['nodes']['type.predicate']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case 'this':
					return 279;
				default:
					if (
						/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
							value
						)
					)
						return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 352])) return value;
			return unseated('type.predicate.asserts.value', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 279, 352])) return value;
			return unseated('type.predicate.asserts.value', value);
		}
		switch (value.$path) {
			case 'identifier':
				return unbuilt('type.predicate.asserts.value', value);
			case 'type.predicate':
				return unbuilt('type.predicate.asserts.value', value);
			default:
				return unbuilt('type.predicate.asserts.value', value);
		}
	};
	const type_query$358_expression = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'expression.instantiation'>
			| TypeScriptMap['nodes']['expression.instantiation']
			| BuildInput<TypeScriptMap, 'identifier'>
			| TypeScriptMap['nodes']['identifier']
			| BuildInput<TypeScriptMap, 'identifier.qualified'>
			| TypeScriptMap['nodes']['identifier.qualified']
			| BuildInput<TypeScriptMap, 'type.import'>
			| TypeScriptMap['nodes']['type.import']
	) => {
		if (typeof value === 'string') {
			switch (value) {
				case 'this':
					return 279;
				default:
					if (
						/^(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})(?:(?:[^\x00-\x1F\x09-\x0D\x20\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}))*)$/u.test(
							value
						)
					)
						return b.identifier(value);
					return b.identifier(value);
			}
		}
		if (typeof value === 'number') {
			if (seated(value, [1, 354, 355, 356, 357])) return value;
			return unseated('type.query.expression', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [1, 279, 354, 355, 356, 357])) return value;
			return unseated('type.query.expression', value);
		}
		switch (value.$path) {
			case 'expression.instantiation':
				return unbuilt('type.query.expression', value);
			case 'identifier':
				return unbuilt('type.query.expression', value);
			case 'identifier.qualified':
				return identifier_qualified$354(value);
			case 'type.import':
				return unbuilt('type.query.expression', value);
			default:
				return unbuilt('type.query.expression', value);
		}
	};
	const type_template$348_elements = (
		value:
			| string
			| BuildInput<TypeScriptMap, 'element.template.substitution'>
			| TypeScriptMap['nodes']['element.template.substitution']
			| BuildInput<TypeScriptMap, 'literal.string.text'>
			| TypeScriptMap['nodes']['literal.string.text']
	) => {
		if (typeof value === 'string') {
			if (/^(?:(?:[^`\\$]+))$/u.test(value)) return b.templateChars(value);
			return b.templateChars(value);
		}
		if (typeof value === 'number') {
			if (seated(value, [176, 347])) return value;
			return unseated('type.template.elements', value);
		}
		if (engine.isNode(value)) {
			if (seated(value, [176, 347])) return value;
			return unseated('type.template.elements', value);
		}
		switch (value.$path) {
			case 'element.template.substitution':
				return element_template_substitution$347(value);
			case 'literal.string.text':
				return unbuilt('type.template.elements', value);
			default:
				return unbuilt('type.template.elements', value);
		}
	};
	const attribute_member$286 = (
		input: BuildInput<TypeScriptMap, 'attribute.member'>
	): ReturnType<typeof b.decoratorMemberExpression> => {
		return b.decoratorMemberExpression({
			object: attribute_member$286_object(input.object),
			property: attribute_member$286_property(input.property)
		});
	};
	const attribute_parenthesized$304 = (
		input: BuildInput<TypeScriptMap, 'attribute.parenthesized'>
	): ReturnType<typeof b.decoratorParenthesizedExpression> => {
		return b.decoratorParenthesizedExpression(attribute_parenthesized$304_expression(input.expression));
	};
	const clause_export$193 = (input: BuildInput<TypeScriptMap, 'clause.export'>): ReturnType<typeof b.exportClause> => {
		return b.exportClause(
			(input.exportSpecifiers ?? []).length === 0
				? undefined
				: b.exportSpecifiers(...(input.exportSpecifiers ?? []).map(clause_export$193_exportSpecifiers$item))
		);
	};
	const clause_finally$233 = (
		input: BuildInput<TypeScriptMap, 'clause.finally'>
	): ReturnType<typeof b.finallyClause> => {
		return b.finallyClause(clause_finally$233_body(input.body));
	};
	const clause_import_attribute$204 = (
		input: BuildInput<TypeScriptMap, 'clause.import.attribute'>
	): ReturnType<typeof b.importAttribute> => {
		return b.importAttribute({
			attributeKind: clause_import_attribute$204_attributeKind(input.attributeKind),
			object: clause_import_attribute$204_object(input.object)
		});
	};
	const clause_import_namespace$201 = (
		input: BuildInput<TypeScriptMap, 'clause.import.namespace'>
	): ReturnType<typeof b.namespaceImport> => {
		return b.namespaceImport(clause_import_namespace$201_name(input.name));
	};
	const clause_import_specifier$414 = (
		input: BuildInput<TypeScriptMap, 'clause.import.specifier'>
	): ReturnType<typeof b.importSpecifierName> => {
		return b.importSpecifierName({
			name: clause_import_specifier$414_name(input.name),
			typeKeyword: (input.$flags ?? []).includes('typeOnly')
		});
	};
	const declaration_ambient$313 = (
		input: BuildInput<TypeScriptMap, 'declaration.ambient'>
	): ReturnType<typeof b.ambientDeclaration> => {
		return b.ambientDeclaration(declaration_ambient$313_body(input.body));
	};
	const declaration_enum$322 = (
		input: BuildInput<TypeScriptMap, 'declaration.enum'>
	): ReturnType<typeof b.enumDeclaration> => {
		return b.enumDeclaration({
			name: declaration_enum$322_name(input.name),
			body:
				(input.body ?? []).length === 0
					? b.enumBody()
					: b.enumBody(b.enumBodyElements(...(input.body ?? []).map(declaration_enum$322_body$item))),
			const: (input.$flags ?? []).includes('const')
		});
	};
	const element_template_substitution$347 = (
		input: BuildInput<TypeScriptMap, 'element.template.substitution'>
	): ReturnType<typeof b.templateType> => {
		return b.templateType(element_template_substitution$347_type(input.type));
	};
	const expression_collection_object$238 = (
		input: BuildInput<TypeScriptMap, 'expression.collection.object'>
	): ReturnType<typeof b.object> => {
		return b.object(...(input.properties ?? []).map(expression_collection_object$238_properties));
	};
	const expression_parenthesized$417 = (
		input: BuildInput<TypeScriptMap, 'expression.parenthesized'>
	): ReturnType<typeof b.parenthesizedExpressionSequence> => {
		return b.parenthesizedExpressionSequence(expression_parenthesized$417_expression(input.expression));
	};
	const identifier_qualified$244 = (
		input: BuildInput<TypeScriptMap, 'identifier.qualified'>
	): ReturnType<typeof b.nestedIdentifier> => {
		return b.nestedIdentifier({
			qualifier: identifier_qualified$244_qualifier(input.qualifier),
			name: identifier_qualified$244_name(input.name)
		});
	};
	const identifier_qualified$319 = (
		input: BuildInput<TypeScriptMap, 'identifier.qualified'>
	): ReturnType<typeof b.nestedTypeIdentifier> => {
		return b.nestedTypeIdentifier({
			qualifier: identifier_qualified$319_qualifier(input.qualifier),
			name: identifier_qualified$319_name(input.name)
		});
	};
	const identifier_qualified$354 = (
		input: BuildInput<TypeScriptMap, 'identifier.qualified'>
	): ReturnType<typeof b.typeQueryMemberExpression> => {
		return b.typeQueryMemberExpression({
			object: identifier_qualified$354_qualifier(input.qualifier),
			property: identifier_qualified$354_name(input.name),
			operator: 63
		});
	};
	const literal_regex$276 = (input: BuildInput<TypeScriptMap, 'literal.regex'>): ReturnType<typeof b.regex> => {
		return b.regex({
			pattern: literal_regex$276_pattern(input.pattern),
			flags: input.flags === undefined ? undefined : literal_regex$276_flags(input.flags)
		});
	};
	const literal_string$424 = (
		input: BuildInput<TypeScriptMap, 'literal.string'>
	): ReturnType<typeof b.stringDouble> => {
		return b.stringDouble(...(input.elements ?? []).map(literal_string$424_elements));
	};
	const literal_string_interpolated$274 = (
		input: BuildInput<TypeScriptMap, 'literal.string.interpolated'>
	): ReturnType<typeof b.templateString> => {
		return b.templateString(...(input.elements ?? []).map(literal_string_interpolated$274_elements));
	};
	const pattern_list$243 = (input: BuildInput<TypeScriptMap, 'pattern.list'>): ReturnType<typeof b.arrayPattern> => {
		return b.arrayPattern(...(input.elements ?? []).map(pattern_list$243_elements));
	};
	const pattern_object$239 = (
		input: BuildInput<TypeScriptMap, 'pattern.object'>
	): ReturnType<typeof b.objectPattern> => {
		return b.objectPattern(...(input.properties ?? []).map(pattern_object$239_properties));
	};
	const pattern_rest$292 = (input: BuildInput<TypeScriptMap, 'pattern.rest'>): ReturnType<typeof b.restPattern> => {
		return b.restPattern(pattern_rest$292_pattern(input.pattern));
	};
	const type_array$378 = (input: BuildInput<TypeScriptMap, 'type.array'>): ReturnType<typeof b.arrayType> => {
		return b.arrayType(type_array$378_type(input.type));
	};
	const type_index_query$359 = (
		input: BuildInput<TypeScriptMap, 'type.index_query'>
	): ReturnType<typeof b.indexTypeQuery> => {
		return b.indexTypeQuery(type_index_query$359_type(input.type));
	};
	const type_nullable$365 = (input: BuildInput<TypeScriptMap, 'type.nullable'>): ReturnType<typeof b.flowMaybeType> => {
		return b.flowMaybeType(type_nullable$365_type(input.type));
	};
	const type_object$369 = (input: BuildInput<TypeScriptMap, 'type.object'>): ReturnType<typeof b.objectType> => {
		return b.objectType({
			opening: type_object$369_opening(input.opening),
			members:
				(input.members ?? []).length === 0
					? undefined
					: b.objectTypeContent(...(input.members ?? []).map(type_object$369_members$item)),
			closing: type_object$369_closing(input.closing)
		});
	};
	const type_predicate_asserts$337 = (
		input: BuildInput<TypeScriptMap, 'type.predicate.asserts'>
	): ReturnType<typeof b.asserts> => {
		return b.asserts(type_predicate_asserts$337_value(input.value));
	};
	const type_query$358 = (input: BuildInput<TypeScriptMap, 'type.query'>): ReturnType<typeof b.typeQuery> => {
		return b.typeQuery(type_query$358_expression(input.expression));
	};
	const type_template$348 = (
		input: BuildInput<TypeScriptMap, 'type.template'>
	): ReturnType<typeof b.templateLiteralType> => {
		return b.templateLiteralType(...(input.elements ?? []).map(type_template$348_elements));
	};
	const attribute_member = (input: BuildInput<TypeScriptMap, 'attribute.member'>) => {
		return attribute_member$286(input);
	};
	const attribute_parenthesized = (input: BuildInput<TypeScriptMap, 'attribute.parenthesized'>) => {
		return attribute_parenthesized$304(input);
	};
	const clause_export = (input: BuildInput<TypeScriptMap, 'clause.export'>) => {
		return clause_export$193(input);
	};
	const clause_finally = (input: BuildInput<TypeScriptMap, 'clause.finally'>) => {
		return clause_finally$233(input);
	};
	const clause_import_attribute = (input: BuildInput<TypeScriptMap, 'clause.import.attribute'>) => {
		return clause_import_attribute$204(input);
	};
	const clause_import_namespace = (input: BuildInput<TypeScriptMap, 'clause.import.namespace'>) => {
		return clause_import_namespace$201(input);
	};
	const declaration_ambient = (input: BuildInput<TypeScriptMap, 'declaration.ambient'>) => {
		return declaration_ambient$313(input);
	};
	const declaration_enum = (input: BuildInput<TypeScriptMap, 'declaration.enum'>) => {
		return declaration_enum$322(input);
	};
	const element_template_substitution = (input: BuildInput<TypeScriptMap, 'element.template.substitution'>) => {
		return element_template_substitution$347(input);
	};
	const expression_collection_object = (input: BuildInput<TypeScriptMap, 'expression.collection.object'>) => {
		return expression_collection_object$238(input);
	};
	const literal_regex = (input: BuildInput<TypeScriptMap, 'literal.regex'>) => {
		return literal_regex$276(input);
	};
	const literal_string_interpolated = (input: BuildInput<TypeScriptMap, 'literal.string.interpolated'>) => {
		return literal_string_interpolated$274(input);
	};
	const pattern_list = (input: BuildInput<TypeScriptMap, 'pattern.list'>) => {
		return pattern_list$243(input);
	};
	const pattern_object = (input: BuildInput<TypeScriptMap, 'pattern.object'>) => {
		return pattern_object$239(input);
	};
	const pattern_rest = (input: BuildInput<TypeScriptMap, 'pattern.rest'>) => {
		return pattern_rest$292(input);
	};
	const type_array = (input: BuildInput<TypeScriptMap, 'type.array'>) => {
		return type_array$378(input);
	};
	const type_index_query = (input: BuildInput<TypeScriptMap, 'type.index_query'>) => {
		return type_index_query$359(input);
	};
	const type_nullable = (input: BuildInput<TypeScriptMap, 'type.nullable'>) => {
		return type_nullable$365(input);
	};
	const type_object = (input: BuildInput<TypeScriptMap, 'type.object'>) => {
		return type_object$369(input);
	};
	const type_predicate_asserts = (input: BuildInput<TypeScriptMap, 'type.predicate.asserts'>) => {
		return type_predicate_asserts$337(input);
	};
	const type_query = (input: BuildInput<TypeScriptMap, 'type.query'>) => {
		return type_query$358(input);
	};
	const type_template = (input: BuildInput<TypeScriptMap, 'type.template'>) => {
		return type_template$348(input);
	};
	return {
		attribute: { member: attribute_member, parenthesized: attribute_parenthesized },
		clause: {
			export: clause_export,
			finally: clause_finally,
			import: { attribute: clause_import_attribute, namespace: clause_import_namespace }
		},
		declaration: { ambient: declaration_ambient, enum: declaration_enum },
		element: { template: { substitution: element_template_substitution } },
		expression: { collection: { object: expression_collection_object } },
		literal: { regex: literal_regex, string: { interpolated: literal_string_interpolated } },
		pattern: { list: pattern_list, object: pattern_object, rest: pattern_rest },
		type: {
			array: type_array,
			index_query: type_index_query,
			nullable: type_nullable,
			object: type_object,
			predicate: { asserts: type_predicate_asserts },
			query: type_query,
			template: type_template
		}
	};
}

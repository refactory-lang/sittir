import type { Engine } from '@sittir/types';
import type { BuildInput, BuildItem } from '@sittir/types/vocabulary';
import type { TypescriptAPI } from '../api.js';
import type { TypeScriptMap } from './map.js';
export function portableBuild(engine: Engine<TypescriptAPI>) {
  const b = engine.build;
  const attribute_decorator_content = (value: BuildItem<TypeScriptMap, 'attribute.decorator', 'content'>) => {
    if (typeof value === 'string') return b.identifier(value);
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      default:
        throw new Error('attribute.decorator.content: no generated builder for ' + value.$path);
    }
  };
  const expression_collection_list_elements = (value: BuildItem<TypeScriptMap, 'expression.collection.list', 'elements'>) => {
    if (value === null) return null;
    if (typeof value === 'string') switch (value) {
      case 'import.meta':
        return 441;
      case 'new.target':
        return 440;
      case 'super':
        return 280;
      case 'this':
        return 279;
      default:
        return b.identifier(value);
    }
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      case 'expression.collection.list':
        return expression_collection_list(value);
      case 'literal.number.integer':
        return literal_number_integer(value);
      case 'literal.number':
        return literal_number(value);
      default:
        throw new Error('expression.collection.list.elements: no generated builder for ' + value.$path);
    }
  };
  const declaration_property_getter_name = (value: BuildItem<TypeScriptMap, 'declaration.property.getter', 'name'>) => {
    if (typeof value === 'string') switch (value) {
      case 'import.meta':
        return 441;
      case 'new.target':
        return 440;
      case 'super':
        return 280;
      case 'this':
        return 279;
      default:
        return b.identifier(value);
    }
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      case 'expression.collection.list':
        return b.computedPropertyName(expression_collection_list(value));
      case 'literal.number.integer':
        return literal_number_integer(value);
      case 'literal.number':
        return literal_number(value);
      default:
        throw new Error('declaration.property.getter.name: no generated builder for ' + value.$path);
    }
  };
  const declaration_property_getter_type = (value: BuildItem<TypeScriptMap, 'declaration.property.getter', 'type'>) => {
    if (typeof value === 'string') switch (value) {
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
        return b.typeAnnotation(b.identifier(value));
    }
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      default:
        throw new Error('declaration.property.getter.type: no generated builder for ' + value.$path);
    }
  };
  const statement_return_expression = (value: BuildItem<TypeScriptMap, 'statement.return', 'expression'>) => {
    if (typeof value === 'string') switch (value) {
      case 'import.meta':
        return 441;
      case 'new.target':
        return 440;
      case 'super':
        return 280;
      case 'this':
        return 279;
      default:
        return b.identifier(value);
    }
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      case 'expression.collection.list':
        return expression_collection_list(value);
      case 'literal.number.integer':
        return literal_number_integer(value);
      case 'literal.number':
        return literal_number(value);
      default:
        throw new Error('statement.return.expression: no generated builder for ' + value.$path);
    }
  };
  const statement_block_statements = (value: BuildItem<TypeScriptMap, 'statement.block', 'statements'>) => {
    if (value === null) return null;
    if (typeof value === 'string') switch (value) {
      case ';':
        return 227;
      default:
        throw new Error('statements spells no text ' + value);
    }
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      case 'statement.block':
        return statement_block(value);
      case 'statement.return':
        return statement_return(value);
      default:
        throw new Error('statement.block.statements: no generated builder for ' + value.$path);
    }
  };
  const declaration_property_getter_body = (value: BuildItem<TypeScriptMap, 'declaration.property.getter', 'body'>) => {
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      case 'statement.block':
        return statement_block(value);
      default:
        throw new Error('declaration.property.getter.body: no generated builder for ' + value.$path);
    }
  };
  const declaration_method_name = (value: BuildItem<TypeScriptMap, 'declaration.method', 'name'>) => {
    if (typeof value === 'string') switch (value) {
      case 'import.meta':
        return 441;
      case 'new.target':
        return 440;
      case 'super':
        return 280;
      case 'this':
        return 279;
      default:
        return b.identifier(value);
    }
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      case 'expression.collection.list':
        return b.computedPropertyName(expression_collection_list(value));
      case 'literal.number.integer':
        return literal_number_integer(value);
      case 'literal.number':
        return literal_number(value);
      default:
        throw new Error('declaration.method.name: no generated builder for ' + value.$path);
    }
  };
  const declaration_method_typeParameters = (value: BuildItem<TypeScriptMap, 'declaration.method', 'typeParameters'>) => {
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      default:
        throw new Error('declaration.method.typeParameters: no generated builder for ' + value.$path);
    }
  };
  const declaration_method_returnType = (value: BuildItem<TypeScriptMap, 'declaration.method', 'returnType'>) => {
    if (typeof value === 'string') switch (value) {
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
        return b.typeAnnotation(b.identifier(value));
    }
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      default:
        throw new Error('declaration.method.returnType: no generated builder for ' + value.$path);
    }
  };
  const declaration_method_body = (value: BuildItem<TypeScriptMap, 'declaration.method', 'body'>) => {
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      case 'statement.block':
        return statement_block(value);
      default:
        throw new Error('declaration.method.body: no generated builder for ' + value.$path);
    }
  };
  const attribute_decorator = (input: BuildInput<TypeScriptMap, 'attribute.decorator'>) => {
    return b.decorator(attribute_decorator_content(input.content));
  };
  const declaration_property_getter = (input: BuildInput<TypeScriptMap, 'declaration.property.getter'>) => {
    return b.methodDefinitionGetter({ name: declaration_property_getter_name(input.name), type: input.type === undefined ? undefined : declaration_property_getter_type(input.type), body: declaration_property_getter_body(input.body), static: (input.$flags ?? []).includes('static'), override: (input.$flags ?? []).includes('override') });
  };
  const expression_collection_list = (input: BuildInput<TypeScriptMap, 'expression.collection.list'>) => {
    return b.array(...(input.elements ?? []).map(expression_collection_list_elements));
  };
  const statement_block = (input: BuildInput<TypeScriptMap, 'statement.block'>) => {
    return b.statementBlock(...(input.statements ?? []).map(statement_block_statements));
  };
  const statement_return = (input: BuildInput<TypeScriptMap, 'statement.return'>) => {
    return b.returnStatement(input.expression === undefined ? undefined : statement_return_expression(input.expression));
  };
  const declaration_method = (input: BuildInput<TypeScriptMap, 'declaration.method'>) => {
    return b.methodDefinitionPlain({ name: declaration_method_name(input.name), typeParameters: input.typeParameters === undefined ? undefined : declaration_method_typeParameters(input.typeParameters), returnType: input.returnType === undefined ? undefined : declaration_method_returnType(input.returnType), body: declaration_method_body(input.body), static: (input.$flags ?? []).includes('static'), override: (input.$flags ?? []).includes('override'), readonly: (input.$flags ?? []).includes('readonly'), async: (input.$flags ?? []).includes('async'), optional: (input.$flags ?? []).includes('optional'), generator: (input.$flags ?? []).includes('generator') });
  };
  const literal_number_integer = (input: BuildInput<TypeScriptMap, 'literal.number.integer'>) => {
    return b.number.decimal(input.$value);
  };
  const literal_number$166 = (input: BuildInput<TypeScriptMap, 'literal.number'>) => {
    return b.numberBigintDecimal(input.$value);
  };
  const literal_number$160 = (input: BuildInput<TypeScriptMap, 'literal.number'>) => {
    return b.number.decimal(input.$value);
  };
  const literal_number$156 = (input: BuildInput<TypeScriptMap, 'literal.number'>) => {
    const [integer, fraction = '0'] = String(input.$value).split('.');
    return b.numberFloatPoint({ integer: integer, fraction: fraction });
  };
  const literal_number = (input: BuildInput<TypeScriptMap, 'literal.number'>) => {
    if (typeof input.$value === 'bigint') return literal_number$166(input);
    if (Number.isInteger(input.$value)) return literal_number$160(input);
    return literal_number$156(input);
  };
  return { attribute: { decorator: attribute_decorator }, declaration: { property: { getter: declaration_property_getter }, method: declaration_method }, expression: { collection: { list: expression_collection_list } }, literal: { number: Object.assign(literal_number, { integer: literal_number_integer }) }, statement: { block: statement_block, return: statement_return } };
}

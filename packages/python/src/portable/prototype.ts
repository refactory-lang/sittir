import type { Engine } from '@sittir/types';
import type { BuildInput, BuildItem } from '@sittir/types/vocabulary';
import type { PythonAPI } from '../api.js';
import type { PythonMap } from './map.js';
export function portableBuild(engine: Engine<PythonAPI>) {
  const b = engine.build;
  const expression_collection_list_elements = (value: BuildItem<PythonMap, 'expression.collection.list', 'elements'>) => {
    if (value === null) return null;
    if (typeof value === 'string') return b.identifier(value);
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      case 'expression.collection.list':
        return expression_collection_list(value);
      case 'literal.number.integer':
        return literal_number_integer(value);
      default:
        throw new Error('expression.collection.list.elements: no generated builder for ' + value.$path);
    }
  };
  const attribute_decorator_content = (value: BuildItem<PythonMap, 'attribute.decorator', 'content'>) => {
    if (typeof value === 'string') return b.identifier(value);
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      case 'expression.collection.list':
        return expression_collection_list(value);
      case 'literal.number.integer':
        return literal_number_integer(value);
      default:
        throw new Error('attribute.decorator.content: no generated builder for ' + value.$path);
    }
  };
  const declaration_property_getter$361_name = (value: BuildItem<PythonMap, 'declaration.property.getter', 'name'>) => {
    if (typeof value === 'string') return b.identifier(value);
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      default:
        throw new Error('declaration.property.getter.name: no generated builder for ' + value.$path);
    }
  };
  const declaration_property_getter$361_type = (value: BuildItem<PythonMap, 'declaration.property.getter', 'type'>) => {
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      default:
        throw new Error('declaration.property.getter.type: no generated builder for ' + value.$path);
    }
  };
  const statement_return_expression = (value: BuildItem<PythonMap, 'statement.return', 'expression'>) => {
    if (typeof value === 'string') return b.identifier(value);
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      case 'expression.collection.list':
        return expression_collection_list(value);
      case 'literal.number.integer':
        return literal_number_integer(value);
      default:
        throw new Error('statement.return.expression: no generated builder for ' + value.$path);
    }
  };
  const statement_block$185_statements = (value: BuildItem<PythonMap, 'statement.block', 'statements'>) => {
    if (value === null) return null;
    if (typeof value === 'string') switch (value) {
      case 'break':
        return 154;
      case 'continue':
        return 155;
      case 'pass':
        return 153;
      default:
        throw new Error('statements spells no text ' + value);
    }
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      case 'statement.return':
        return b.simpleStatements(b.simpleStatementsElements(statement_return(value)));
      default:
        throw new Error('statement.block.statements: no generated builder for ' + value.$path);
    }
  };
  const declaration_property_getter$361_body = (value: BuildItem<PythonMap, 'declaration.property.getter', 'body'>) => {
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      case 'statement.block':
        if ((value.statements ?? []).length === 0) return statement_block$310(value);
        return b.suiteBlock(statement_block$185(value));
      default:
        throw new Error('declaration.property.getter.body: no generated builder for ' + value.$path);
    }
  };
  const declaration_method$361_name = (value: BuildItem<PythonMap, 'declaration.method', 'name'>) => {
    if (typeof value === 'string') return b.identifier(value);
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      default:
        throw new Error('declaration.method.name: no generated builder for ' + value.$path);
    }
  };
  const declaration_method$361_parameters = (value: BuildItem<PythonMap, 'declaration.method', 'parameters'>) => {
    if (value === null) return null;
    if (typeof value === 'string') switch (value) {
      case '*':
        return 264;
      case '/':
        return 263;
      default:
        return b.identifier(value);
    }
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      default:
        throw new Error('declaration.method.parameters: no generated builder for ' + value.$path);
    }
  };
  const declaration_method$361_returnType = (value: BuildItem<PythonMap, 'declaration.method', 'returnType'>) => {
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      default:
        throw new Error('declaration.method.returnType: no generated builder for ' + value.$path);
    }
  };
  const declaration_method$361_body = (value: BuildItem<PythonMap, 'declaration.method', 'body'>) => {
    if (engine.isNode(value)) return value;
    switch (value.$path) {
      case 'statement.block':
        if ((value.statements ?? []).length === 0) return statement_block$310(value);
        return b.suiteBlock(statement_block$185(value));
      default:
        throw new Error('declaration.method.body: no generated builder for ' + value.$path);
    }
  };
  const attribute_decorator = (input: BuildInput<PythonMap, 'attribute.decorator'>) => {
    return b.decorator(attribute_decorator_content(input.content));
  };
  const expression_collection_list = (input: BuildInput<PythonMap, 'expression.collection.list'>) => {
    return b.list(b.collectionElements(...(input.elements ?? []).map(expression_collection_list_elements)));
  };
  const declaration_property_getter$361 = (input: BuildInput<PythonMap, 'declaration.property.getter'>) => {
    return b.methodDeclaration({ name: declaration_property_getter$361_name(input.name), parameters: b.parameters(b.parametersElements(b.identifier('self'))), returnType: input.type === undefined ? undefined : declaration_property_getter$361_type(input.type), body: declaration_property_getter$361_body(input.body), async: (input.$flags ?? []).includes('async') });
  };
  const statement_block$310 = (input: BuildInput<PythonMap, 'statement.block'>) => {
    return b.suiteEmpty();
  };
  const statement_block$185 = (input: BuildInput<PythonMap, 'statement.block'>) => {
    return b.block(...(input.statements ?? []).map(statement_block$185_statements));
  };
  const statement_return = (input: BuildInput<PythonMap, 'statement.return'>) => {
    return b.returnStatement(input.expression === undefined ? undefined : statement_return_expression(input.expression));
  };
  const declaration_method$361 = (input: BuildInput<PythonMap, 'declaration.method'>) => {
    return b.methodDeclaration({ name: declaration_method$361_name(input.name), parameters: (input.parameters ?? []).length === 0 ? b.parameters() : b.parameters(b.parametersElements(...(input.parameters ?? []).map(declaration_method$361_parameters))), returnType: input.returnType === undefined ? undefined : declaration_method$361_returnType(input.returnType), body: declaration_method$361_body(input.body), async: (input.$flags ?? []).includes('async') });
  };
  const literal_number_integer = (input: BuildInput<PythonMap, 'literal.number.integer'>) => {
    return b.integerDecimal.plain(input.$value);
  };
  const declaration_property_getter = (input: BuildInput<PythonMap, 'declaration.property.getter'>) => {
    const node = declaration_property_getter$361(input);
    const decorators = [attribute_decorator({ $path: 'attribute.decorator', content: 'property' }), ...((input.$flags ?? []).includes('override') ? [attribute_decorator({ $path: 'attribute.decorator', content: 'override' })] : [])];
    return decorators.length === 0 ? node : b.decoratedDefinitionClassDeclaration({ definition: node, decorators: decorators });
  };
  const declaration_method = (input: BuildInput<PythonMap, 'declaration.method'>) => {
    const node = declaration_method$361(input);
    const decorators = [...((input.$flags ?? []).includes('static') ? [attribute_decorator({ $path: 'attribute.decorator', content: 'staticmethod' })] : []), ...((input.$flags ?? []).includes('override') ? [attribute_decorator({ $path: 'attribute.decorator', content: 'override' })] : [])];
    return decorators.length === 0 ? node : b.decoratedDefinitionClassDeclaration({ definition: node, decorators: decorators });
  };
  return { attribute: { decorator: attribute_decorator }, declaration: { property: { getter: declaration_property_getter }, method: declaration_method }, expression: { collection: { list: expression_collection_list } }, literal: { number: { integer: literal_number_integer } }, statement: { return: statement_return } };
}

import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AccessibilityModifier, AssertsAnnotation, ComputedPropertyName, FormalParameters, MethodDefinition, Number, OverrideModifier, PrivatePropertyIdentifier, PropertyIdentifier, StatementBlock, String, TypeAnnotation, TypeParameters, TypePredicateAnnotation } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { formal_parameters } from './formal-parameters.js';
import type { FormalParametersOptions } from './formal-parameters.js';
import { statement_block } from './statement-block.js';
import type { StatementBlockOptions } from './statement-block.js';


class MethodDefinitionBuilder extends Builder<MethodDefinition> {
  private _name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
  private _typeParameters?: Builder<TypeParameters>;
  private _parameters!: Builder<FormalParameters>;
  private _returnType?: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>;
  private _body!: Builder<StatementBlock>;
  private _children: Builder<AccessibilityModifier | OverrideModifier>[] = [];

  constructor(name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>) {
    super();
    this._name = name;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  parameters(value: Builder<FormalParameters>): this {
    this._parameters = value;
    return this;
  }

  returnType(value: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>): this {
    this._returnType = value;
    return this;
  }

  body(value: Builder<StatementBlock>): this {
    this._body = value;
    return this;
  }

  children(...value: Builder<AccessibilityModifier | OverrideModifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MethodDefinition {
    return {
      kind: 'method_definition',
      name: this._name.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
      parameters: this._parameters?.build(ctx),
      returnType: this._returnType?.build(ctx),
      body: this._body?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as MethodDefinition;
  }

  override get nodeKind(): string { return 'method_definition'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { MethodDefinitionBuilder };

export function method_definition(name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>): MethodDefinitionBuilder {
  return new MethodDefinitionBuilder(name);
}

export interface MethodDefinitionOptions {
  name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
  typeParameters?: Builder<TypeParameters> | TypeParametersOptions;
  parameters: Builder<FormalParameters> | FormalParametersOptions;
  returnType?: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>;
  body: Builder<StatementBlock> | StatementBlockOptions;
  children?: Builder<AccessibilityModifier | OverrideModifier> | (Builder<AccessibilityModifier | OverrideModifier>)[];
}

export namespace method_definition {
  export function from(options: MethodDefinitionOptions): MethodDefinitionBuilder {
    const b = new MethodDefinitionBuilder(options.name);
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v as TypeParametersOptions));
    }
    if (options.parameters !== undefined) {
      const _v = options.parameters;
      b.parameters(_v instanceof Builder ? _v : formal_parameters.from(_v as FormalParametersOptions));
    }
    if (options.returnType !== undefined) b.returnType(options.returnType);
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : statement_block.from(_v as StatementBlockOptions));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}

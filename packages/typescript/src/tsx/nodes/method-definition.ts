import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AccessibilityModifier, AssertsAnnotation, ComputedPropertyName, FormalParameters, MethodDefinition, OverrideModifier, PrivatePropertyIdentifier, PropertyIdentifier, StatementBlock, TypeAnnotation, TypeParameters, TypePredicateAnnotation } from '../types.js';


class MethodDefinitionBuilder extends Builder<MethodDefinition> {
  private _body!: Builder<StatementBlock>;
  private _name: Builder<ComputedPropertyName | PrivatePropertyIdentifier | PropertyIdentifier>;
  private _parameters!: Builder<FormalParameters>;
  private _returnType?: Builder<AssertsAnnotation | TypeAnnotation | TypePredicateAnnotation>;
  private _typeParameters?: Builder<TypeParameters>;
  private _children: Builder<AccessibilityModifier | OverrideModifier>[] = [];

  constructor(name: Builder<ComputedPropertyName | PrivatePropertyIdentifier | PropertyIdentifier>) {
    super();
    this._name = name;
  }

  body(value: Builder<StatementBlock>): this {
    this._body = value;
    return this;
  }

  parameters(value: Builder<FormalParameters>): this {
    this._parameters = value;
    return this;
  }

  returnType(value: Builder<AssertsAnnotation | TypeAnnotation | TypePredicateAnnotation>): this {
    this._returnType = value;
    return this;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
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
      body: this._body?.build(ctx),
      name: this._name.build(ctx),
      parameters: this._parameters?.build(ctx),
      returnType: this._returnType?.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
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

export function method_definition(name: Builder<ComputedPropertyName | PrivatePropertyIdentifier | PropertyIdentifier>): MethodDefinitionBuilder {
  return new MethodDefinitionBuilder(name);
}

export interface MethodDefinitionOptions {
  body: Builder<StatementBlock>;
  name: Builder<ComputedPropertyName | PrivatePropertyIdentifier | PropertyIdentifier>;
  parameters: Builder<FormalParameters>;
  returnType?: Builder<AssertsAnnotation | TypeAnnotation | TypePredicateAnnotation>;
  typeParameters?: Builder<TypeParameters>;
  children?: Builder<AccessibilityModifier | OverrideModifier> | (Builder<AccessibilityModifier | OverrideModifier>)[];
}

export namespace method_definition {
  export function from(options: MethodDefinitionOptions): MethodDefinitionBuilder {
    const b = new MethodDefinitionBuilder(options.name);
    if (options.body !== undefined) b.body(options.body);
    if (options.parameters !== undefined) b.parameters(options.parameters);
    if (options.returnType !== undefined) b.returnType(options.returnType);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}

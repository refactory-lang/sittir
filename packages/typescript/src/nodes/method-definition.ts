import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AccessibilityModifier, AssertsAnnotation, ComputedPropertyName, FormalParameters, MethodDefinition, OverrideModifier, PrivatePropertyIdentifier, PropertyIdentifier, StatementBlock, TypeAnnotation, TypeParameters, TypePredicateAnnotation } from '../types.js';


class MethodDefinitionBuilder extends Builder<MethodDefinition> {
  private _body!: Builder;
  private _name: Builder;
  private _parameters!: Builder;
  private _returnType?: Builder;
  private _typeParameters?: Builder;
  private _children: Builder[] = [];

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  body(value: Builder): this {
    this._body = value;
    return this;
  }

  parameters(value: Builder): this {
    this._parameters = value;
    return this;
  }

  returnType(value: Builder): this {
    this._returnType = value;
    return this;
  }

  typeParameters(value: Builder): this {
    this._typeParameters = value;
    return this;
  }

  children(...value: Builder[]): this {
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
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
      parameters: this._parameters ? this.renderChild(this._parameters, ctx) : undefined,
      returnType: this._returnType ? this.renderChild(this._returnType, ctx) : undefined,
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as MethodDefinition;
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

export function method_definition(name: Builder): MethodDefinitionBuilder {
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

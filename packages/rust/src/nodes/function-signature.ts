import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FunctionModifiers, FunctionSignatureItem, Identifier, Metavariable, Parameters, Type, TypeParameters, VisibilityModifier, WhereClause } from '../types.js';


class FunctionSignatureBuilder extends Builder<FunctionSignatureItem> {
  private _name: Builder;
  private _parameters!: Builder;
  private _returnType?: Builder;
  private _typeParameters?: Builder;
  private _children: Builder[] = [];

  constructor(name: Builder) {
    super();
    this._name = name;
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
    parts.push('fn');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) {
      parts.push('->');
      if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    }
    if (this._children[2]) parts.push(this.renderChild(this._children[2]!, ctx));
    parts.push(';');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FunctionSignatureItem {
    return {
      kind: 'function_signature_item',
      name: this.renderChild(this._name, ctx),
      parameters: this._parameters ? this.renderChild(this._parameters, ctx) : undefined,
      returnType: this._returnType ? this.renderChild(this._returnType, ctx) : undefined,
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as FunctionSignatureItem;
  }

  override get nodeKind(): string { return 'function_signature_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    parts.push({ kind: 'token', text: 'fn', type: 'fn' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) {
      parts.push({ kind: 'token', text: '->', type: '->' });
      if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    }
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export type { FunctionSignatureBuilder };

export function function_signature(name: Builder): FunctionSignatureBuilder {
  return new FunctionSignatureBuilder(name);
}

export interface FunctionSignatureItemOptions {
  name: Builder<Identifier | Metavariable>;
  parameters: Builder<Parameters>;
  returnType?: Builder<Type>;
  typeParameters?: Builder<TypeParameters>;
  children?: Builder<FunctionModifiers | VisibilityModifier | WhereClause> | (Builder<FunctionModifiers | VisibilityModifier | WhereClause>)[];
}

export namespace function_signature {
  export function from(options: FunctionSignatureItemOptions): FunctionSignatureBuilder {
    const b = new FunctionSignatureBuilder(options.name);
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

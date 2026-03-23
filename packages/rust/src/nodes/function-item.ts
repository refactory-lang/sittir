import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FunctionItem, FunctionModifiers, Identifier, Metavariable, Parameters, Type, TypeParameters, VisibilityModifier, WhereClause } from '../types.js';


class FunctionItemBuilder extends Builder<FunctionItem> {
  private _body!: Builder;
  private _name: Builder<Identifier | Metavariable>;
  private _parameters!: Builder<Parameters>;
  private _returnType?: Builder<Type>;
  private _typeParameters?: Builder<TypeParameters>;
  private _children: Builder<FunctionModifiers | VisibilityModifier | WhereClause>[] = [];

  constructor(name: Builder<Identifier | Metavariable>) {
    super();
    this._name = name;
  }

  body(value: Builder): this {
    this._body = value;
    return this;
  }

  parameters(value: Builder<Parameters>): this {
    this._parameters = value;
    return this;
  }

  returnType(value: Builder<Type>): this {
    this._returnType = value;
    return this;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  children(...value: Builder<FunctionModifiers | VisibilityModifier | WhereClause>[]): this {
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
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FunctionItem {
    return {
      kind: 'function_item',
      body: this._body?.build(ctx),
      name: this._name.build(ctx),
      parameters: this._parameters?.build(ctx),
      returnType: this._returnType?.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as FunctionItem;
  }

  override get nodeKind(): string { return 'function_item'; }

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
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { FunctionItemBuilder };

export function function_item(name: Builder<Identifier | Metavariable>): FunctionItemBuilder {
  return new FunctionItemBuilder(name);
}

export interface FunctionItemOptions {
  body: Builder;
  name: Builder<Identifier | Metavariable>;
  parameters: Builder<Parameters>;
  returnType?: Builder<Type>;
  typeParameters?: Builder<TypeParameters>;
  children?: Builder<FunctionModifiers | VisibilityModifier | WhereClause> | (Builder<FunctionModifiers | VisibilityModifier | WhereClause>)[];
}

export namespace function_item {
  export function from(options: FunctionItemOptions): FunctionItemBuilder {
    const b = new FunctionItemBuilder(options.name);
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

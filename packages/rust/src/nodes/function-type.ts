import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ForLifetimes, FunctionModifiers, FunctionType, Parameters, ScopedTypeIdentifier, Type, TypeIdentifier } from '../types.js';


class FunctionTypeBuilder extends Builder<FunctionType> {
  private _parameters: Builder;
  private _returnType?: Builder;
  private _trait?: Builder;
  private _children: Builder[] = [];

  constructor(parameters: Builder) {
    super();
    this._parameters = parameters;
  }

  returnType(value: Builder): this {
    this._returnType = value;
    return this;
  }

  trait(value: Builder): this {
    this._trait = value;
    return this;
  }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._trait) parts.push(this.renderChild(this._trait, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) {
      parts.push('->');
      if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FunctionType {
    return {
      kind: 'function_type',
      parameters: this.renderChild(this._parameters, ctx),
      returnType: this._returnType ? this.renderChild(this._returnType, ctx) : undefined,
      trait: this._trait ? this.renderChild(this._trait, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as FunctionType;
  }

  override get nodeKind(): string { return 'function_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._trait) parts.push({ kind: 'builder', builder: this._trait, fieldName: 'trait' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) {
      parts.push({ kind: 'token', text: '->', type: '->' });
      if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    }
    return parts;
  }
}

export type { FunctionTypeBuilder };

export function function_type(parameters: Builder): FunctionTypeBuilder {
  return new FunctionTypeBuilder(parameters);
}

export interface FunctionTypeOptions {
  parameters: Builder<Parameters>;
  returnType?: Builder<Type>;
  trait?: Builder<ScopedTypeIdentifier | TypeIdentifier>;
  children?: Builder<ForLifetimes | FunctionModifiers> | (Builder<ForLifetimes | FunctionModifiers>)[];
}

export namespace function_type {
  export function from(options: FunctionTypeOptions): FunctionTypeBuilder {
    const b = new FunctionTypeBuilder(options.parameters);
    if (options.returnType !== undefined) b.returnType(options.returnType);
    if (options.trait !== undefined) b.trait(options.trait);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}

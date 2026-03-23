import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ForLifetimes, FunctionModifiers, FunctionType, Parameters, ScopedTypeIdentifier, Type, TypeIdentifier } from '../types.js';


class FunctionTypeBuilder extends Builder<FunctionType> {
  private _parameters: Builder<Parameters>;
  private _returnType?: Builder<Type>;
  private _trait?: Builder<ScopedTypeIdentifier | TypeIdentifier>;
  private _children: Builder<ForLifetimes | FunctionModifiers>[] = [];

  constructor(parameters: Builder<Parameters>) {
    super();
    this._parameters = parameters;
  }

  returnType(value: Builder<Type>): this {
    this._returnType = value;
    return this;
  }

  trait(value: Builder<ScopedTypeIdentifier | TypeIdentifier>): this {
    this._trait = value;
    return this;
  }

  children(...value: Builder<ForLifetimes | FunctionModifiers>[]): this {
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
      parameters: this._parameters.build(ctx),
      returnType: this._returnType?.build(ctx),
      trait: this._trait?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as FunctionType;
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

export function function_type(parameters: Builder<Parameters>): FunctionTypeBuilder {
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

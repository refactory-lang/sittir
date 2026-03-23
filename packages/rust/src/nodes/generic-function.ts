import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldExpression, GenericFunction, Identifier, ScopedIdentifier, TypeArguments } from '../types.js';


class GenericFunctionBuilder extends Builder<GenericFunction> {
  private _function: Builder<FieldExpression | Identifier | ScopedIdentifier>;
  private _typeArguments!: Builder<TypeArguments>;

  constructor(function_: Builder<FieldExpression | Identifier | ScopedIdentifier>) {
    super();
    this._function = function_;
  }

  typeArguments(value: Builder<TypeArguments>): this {
    this._typeArguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._function) parts.push(this.renderChild(this._function, ctx));
    parts.push('::');
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GenericFunction {
    return {
      kind: 'generic_function',
      function: this._function.build(ctx),
      typeArguments: this._typeArguments?.build(ctx),
    } as GenericFunction;
  }

  override get nodeKind(): string { return 'generic_function'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._function) parts.push({ kind: 'builder', builder: this._function, fieldName: 'function' });
    parts.push({ kind: 'token', text: '::', type: '::' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    return parts;
  }
}

export type { GenericFunctionBuilder };

export function generic_function(function_: Builder<FieldExpression | Identifier | ScopedIdentifier>): GenericFunctionBuilder {
  return new GenericFunctionBuilder(function_);
}

export interface GenericFunctionOptions {
  function: Builder<FieldExpression | Identifier | ScopedIdentifier>;
  typeArguments: Builder<TypeArguments>;
}

export namespace generic_function {
  export function from(options: GenericFunctionOptions): GenericFunctionBuilder {
    const b = new GenericFunctionBuilder(options.function);
    if (options.typeArguments !== undefined) b.typeArguments(options.typeArguments);
    return b;
  }
}

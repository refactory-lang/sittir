import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldExpression, GenericFunction, Identifier, ScopedIdentifier, TypeArguments } from '../types.js';


class GenericFunctionBuilder extends Builder<GenericFunction> {
  private _function: Builder;
  private _typeArguments!: Builder;

  constructor(function_: Builder) {
    super();
    this._function = function_;
  }

  typeArguments(value: Builder): this {
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
      function: this.renderChild(this._function, ctx),
      typeArguments: this._typeArguments ? this.renderChild(this._typeArguments, ctx) : undefined,
    } as unknown as GenericFunction;
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

export function generic_function(function_: Builder): GenericFunctionBuilder {
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

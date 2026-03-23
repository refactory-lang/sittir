import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericFunction } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class GenericFunctionBuilder extends BaseBuilder<GenericFunction> {
  private _function: Child;
  private _typeArguments!: Child;

  constructor(function_: Child) {
    super();
    this._function = function_;
  }

  typeArguments(value: Child): this {
    this._typeArguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._function) parts.push(this.renderChild(this._function, ctx));
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
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    return parts;
  }
}

export function generic_function(function_: Child): GenericFunctionBuilder {
  return new GenericFunctionBuilder(function_);
}

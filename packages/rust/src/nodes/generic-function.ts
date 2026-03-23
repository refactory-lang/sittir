import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericFunction } from '../types.js';


class GenericFunctionBuilder extends BaseBuilder<GenericFunction> {
  private _function: BaseBuilder;
  private _typeArguments!: BaseBuilder;

  constructor(function_: BaseBuilder) {
    super();
    this._function = function_;
  }

  typeArguments(value: BaseBuilder): this {
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

export function generic_function(function_: BaseBuilder): GenericFunctionBuilder {
  return new GenericFunctionBuilder(function_);
}

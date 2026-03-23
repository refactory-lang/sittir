import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CallExpression } from '../types.js';


class CallBuilder extends BaseBuilder<CallExpression> {
  private _arguments: BaseBuilder;
  private _function!: BaseBuilder;
  private _typeArguments?: BaseBuilder;

  constructor(arguments_: BaseBuilder) {
    super();
    this._arguments = arguments_;
  }

  function(value: BaseBuilder): this {
    this._function = value;
    return this;
  }

  typeArguments(value: BaseBuilder): this {
    this._typeArguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._function) parts.push(this.renderChild(this._function, ctx));
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    if (this._arguments) parts.push(this.renderChild(this._arguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): CallExpression {
    return {
      kind: 'call_expression',
      arguments: this.renderChild(this._arguments, ctx),
      function: this._function ? this.renderChild(this._function, ctx) : undefined,
      typeArguments: this._typeArguments ? this.renderChild(this._typeArguments, ctx) : undefined,
    } as unknown as CallExpression;
  }

  override get nodeKind(): string { return 'call_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._function) parts.push({ kind: 'builder', builder: this._function, fieldName: 'function' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    if (this._arguments) parts.push({ kind: 'builder', builder: this._arguments, fieldName: 'arguments' });
    return parts;
  }
}

export function call(arguments_: BaseBuilder): CallBuilder {
  return new CallBuilder(arguments_);
}

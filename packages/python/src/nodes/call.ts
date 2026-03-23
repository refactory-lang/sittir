import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArgumentList, Call, GeneratorExpression, PrimaryExpression } from '../types.js';


class CallBuilder extends Builder<Call> {
  private _arguments!: Builder<ArgumentList | GeneratorExpression>;
  private _function: Builder<PrimaryExpression>;

  constructor(function_: Builder<PrimaryExpression>) {
    super();
    this._function = function_;
  }

  arguments(value: Builder<ArgumentList | GeneratorExpression>): this {
    this._arguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._function) parts.push(this.renderChild(this._function, ctx));
    if (this._arguments) parts.push(this.renderChild(this._arguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Call {
    return {
      kind: 'call',
      arguments: this._arguments?.build(ctx),
      function: this._function.build(ctx),
    } as Call;
  }

  override get nodeKind(): string { return 'call'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._function) parts.push({ kind: 'builder', builder: this._function, fieldName: 'function' });
    if (this._arguments) parts.push({ kind: 'builder', builder: this._arguments, fieldName: 'arguments' });
    return parts;
  }
}

export type { CallBuilder };

export function call(function_: Builder<PrimaryExpression>): CallBuilder {
  return new CallBuilder(function_);
}

export interface CallOptions {
  arguments: Builder<ArgumentList | GeneratorExpression>;
  function: Builder<PrimaryExpression>;
}

export namespace call {
  export function from(options: CallOptions): CallBuilder {
    const b = new CallBuilder(options.function);
    if (options.arguments !== undefined) b.arguments(options.arguments);
    return b;
  }
}

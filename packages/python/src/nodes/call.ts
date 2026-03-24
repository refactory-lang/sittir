import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArgumentList, Call, GeneratorExpression, PrimaryExpression } from '../types.js';
import { generator_expression } from './generator-expression.js';
import type { GeneratorExpressionOptions } from './generator-expression.js';
import { argument_list } from './argument-list.js';
import type { ArgumentListOptions } from './argument-list.js';


class CallBuilder extends Builder<Call> {
  private _function: Builder<PrimaryExpression>;
  private _arguments!: Builder<GeneratorExpression | ArgumentList>;

  constructor(function_: Builder<PrimaryExpression>) {
    super();
    this._function = function_;
  }

  arguments(value: Builder<GeneratorExpression | ArgumentList>): this {
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
      function: this._function.build(ctx),
      arguments: this._arguments ? this._arguments.build(ctx) : undefined,
    } as Call;
  }

  override get nodeKind(): 'call' { return 'call'; }

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
  nodeKind: 'call';
  function: Builder<PrimaryExpression>;
  arguments: Builder<GeneratorExpression | ArgumentList> | GeneratorExpressionOptions | ArgumentListOptions;
}

export namespace call {
  export function from(options: Omit<CallOptions, 'nodeKind'>): CallBuilder {
    const b = new CallBuilder(options.function);
    if (options.arguments !== undefined) {
      const _v = options.arguments;
      if (_v instanceof Builder) {
        b.arguments(_v);
      } else {
        switch (_v.nodeKind) {
          case 'generator_expression': b.arguments(generator_expression.from(_v)); break;
          case 'argument_list': b.arguments(argument_list.from(_v)); break;
        }
      }
    }
    return b;
  }
}

import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CallExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class CallBuilder extends BaseBuilder<CallExpression> {
  private _arguments: Child;
  private _function!: Child;

  constructor(arguments_: Child) {
    super();
    this._arguments = arguments_;
  }

  function(value: Child): this {
    this._function = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('call');
    if (this._arguments) parts.push(this.renderChild(this._arguments, ctx));
    if (this._function) parts.push(this.renderChild(this._function, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): CallExpression {
    return {
      kind: 'call_expression',
      arguments: this.renderChild(this._arguments, ctx),
      function: this._function ? this.renderChild(this._function, ctx) : undefined,
    } as unknown as CallExpression;
  }

  override get nodeKind(): string { return 'call_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'call' });
    if (this._arguments) parts.push({ kind: 'builder', builder: this._arguments, fieldName: 'arguments' });
    if (this._function) parts.push({ kind: 'builder', builder: this._function, fieldName: 'function' });
    return parts;
  }
}

export function call(arguments_: Child): CallBuilder {
  return new CallBuilder(arguments_);
}

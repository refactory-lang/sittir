import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, NotOperator } from '../types.js';


class NotOperatorBuilder extends Builder<NotOperator> {
  private _argument: Builder<Expression>;

  constructor(argument: Builder<Expression>) {
    super();
    this._argument = argument;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('not');
    if (this._argument) parts.push(this.renderChild(this._argument, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NotOperator {
    return {
      kind: 'not_operator',
      argument: this._argument.build(ctx),
    } as NotOperator;
  }

  override get nodeKind(): string { return 'not_operator'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'not', type: 'not' });
    if (this._argument) parts.push({ kind: 'builder', builder: this._argument, fieldName: 'argument' });
    return parts;
  }
}

export type { NotOperatorBuilder };

export function not_operator(argument: Builder<Expression>): NotOperatorBuilder {
  return new NotOperatorBuilder(argument);
}

export interface NotOperatorOptions {
  argument: Builder<Expression>;
}

export namespace not_operator {
  export function from(options: NotOperatorOptions): NotOperatorBuilder {
    const b = new NotOperatorBuilder(options.argument);
    return b;
  }
}

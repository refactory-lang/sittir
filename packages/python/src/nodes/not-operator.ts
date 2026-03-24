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

  override get nodeKind(): 'not_operator' { return 'not_operator'; }

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
  nodeKind: 'not_operator';
  argument: Builder<Expression>;
}

export namespace not_operator {
  export function from(input: Omit<NotOperatorOptions, 'nodeKind'> | Builder<Expression>): NotOperatorBuilder {
    const options: Omit<NotOperatorOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'argument' in input
      ? input as Omit<NotOperatorOptions, 'nodeKind'>
      : { argument: input } as Omit<NotOperatorOptions, 'nodeKind'>;
    const b = new NotOperatorBuilder(options.argument);
    return b;
  }
}

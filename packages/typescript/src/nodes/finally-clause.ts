import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FinallyClause, StatementBlock } from '../types.js';
import { statement_block } from './statement-block.js';
import type { StatementBlockOptions } from './statement-block.js';


class FinallyClauseBuilder extends Builder<FinallyClause> {
  private _body: Builder<StatementBlock>;

  constructor(body: Builder<StatementBlock>) {
    super();
    this._body = body;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('finally');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FinallyClause {
    return {
      kind: 'finally_clause',
      body: this._body.build(ctx),
    } as FinallyClause;
  }

  override get nodeKind(): 'finally_clause' { return 'finally_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'finally', type: 'finally' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { FinallyClauseBuilder };

export function finally_clause(body: Builder<StatementBlock>): FinallyClauseBuilder {
  return new FinallyClauseBuilder(body);
}

export interface FinallyClauseOptions {
  nodeKind: 'finally_clause';
  body: Builder<StatementBlock> | Omit<StatementBlockOptions, 'nodeKind'>;
}

export namespace finally_clause {
  export function from(input: Omit<FinallyClauseOptions, 'nodeKind'> | Builder<StatementBlock> | Omit<StatementBlockOptions, 'nodeKind'>): FinallyClauseBuilder {
    const options: Omit<FinallyClauseOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'body' in input
      ? input as Omit<FinallyClauseOptions, 'nodeKind'>
      : { body: input } as Omit<FinallyClauseOptions, 'nodeKind'>;
    const _ctor = options.body;
    const b = new FinallyClauseBuilder(_ctor instanceof Builder ? _ctor : statement_block.from(_ctor));
    return b;
  }
}

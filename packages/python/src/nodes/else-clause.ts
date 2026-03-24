import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ElseClause } from '../types.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';


class ElseClauseBuilder extends Builder<ElseClause> {
  private _body: Builder<Block>;

  constructor(body: Builder<Block>) {
    super();
    this._body = body;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('else');
    parts.push(':');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ElseClause {
    return {
      kind: 'else_clause',
      body: this._body.build(ctx),
    } as ElseClause;
  }

  override get nodeKind(): 'else_clause' { return 'else_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'else', type: 'else' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ElseClauseBuilder };

export function else_clause(body: Builder<Block>): ElseClauseBuilder {
  return new ElseClauseBuilder(body);
}

export interface ElseClauseOptions {
  nodeKind: 'else_clause';
  body: Builder<Block> | Omit<BlockOptions, 'nodeKind'>;
}

export namespace else_clause {
  export function from(input: Omit<ElseClauseOptions, 'nodeKind'> | Builder<Block> | Omit<BlockOptions, 'nodeKind'>): ElseClauseBuilder {
    const options: Omit<ElseClauseOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'body' in input
      ? input as Omit<ElseClauseOptions, 'nodeKind'>
      : { body: input } as Omit<ElseClauseOptions, 'nodeKind'>;
    const _ctor = options.body;
    const b = new ElseClauseBuilder(_ctor instanceof Builder ? _ctor : block.from(_ctor));
    return b;
  }
}

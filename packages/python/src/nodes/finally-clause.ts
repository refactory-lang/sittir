import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, FinallyClause } from '../types.js';


class FinallyClauseBuilder extends Builder<FinallyClause> {
  private _children: Builder<Block>[] = [];

  constructor(children: Builder<Block>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('finally');
    parts.push(':');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FinallyClause {
    return {
      kind: 'finally_clause',
      children: this._children[0]?.build(ctx),
    } as FinallyClause;
  }

  override get nodeKind(): string { return 'finally_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'finally', type: 'finally' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { FinallyClauseBuilder };

export function finally_clause(children: Builder<Block>): FinallyClauseBuilder {
  return new FinallyClauseBuilder(children);
}

export interface FinallyClauseOptions {
  children: Builder<Block> | (Builder<Block>)[];
}

export namespace finally_clause {
  export function from(options: FinallyClauseOptions): FinallyClauseBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new FinallyClauseBuilder(_ctor);
    return b;
  }
}

import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ForInClause, Pattern, PatternList } from '../types.js';


class ForInClauseBuilder extends Builder<ForInClause> {
  private _left: Builder<Pattern | PatternList>;
  private _right: Builder<Expression>[] = [];

  constructor(left: Builder<Pattern | PatternList>) {
    super();
    this._left = left;
  }

  right(...value: Builder<Expression>[]): this {
    this._right = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('for');
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    parts.push('in');
    if (this._right.length > 0) parts.push(this.renderChildren(this._right, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForInClause {
    return {
      kind: 'for_in_clause',
      left: this._left.build(ctx),
      right: this._right.map(c => c.build(ctx)),
    } as ForInClause;
  }

  override get nodeKind(): string { return 'for_in_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'for', type: 'for' });
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    parts.push({ kind: 'token', text: 'in', type: 'in' });
    for (const child of this._right) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'right' });
    }
    return parts;
  }
}

export type { ForInClauseBuilder };

export function for_in_clause(left: Builder<Pattern | PatternList>): ForInClauseBuilder {
  return new ForInClauseBuilder(left);
}

export interface ForInClauseOptions {
  left: Builder<Pattern | PatternList>;
  right: Builder<Expression> | (Builder<Expression>)[];
}

export namespace for_in_clause {
  export function from(options: ForInClauseOptions): ForInClauseBuilder {
    const b = new ForInClauseBuilder(options.left);
    if (options.right !== undefined) {
      const _v = options.right;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.right(..._arr);
    }
    return b;
  }
}

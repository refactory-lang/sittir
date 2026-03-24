import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ForInClause, Lambda, Pattern, PatternList } from '../types.js';
import { pattern_list } from './pattern-list.js';
import type { PatternListOptions } from './pattern-list.js';
import { lambda } from './lambda.js';
import type { LambdaOptions } from './lambda.js';


class ForInClauseBuilder extends Builder<ForInClause> {
  private _left: Builder<Pattern | PatternList>;
  private _right: Builder<Expression | Lambda>[] = [];

  constructor(left: Builder<Pattern | PatternList>) {
    super();
    this._left = left;
  }

  right(...value: Builder<Expression | Lambda>[]): this {
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

  override get nodeKind(): 'for_in_clause' { return 'for_in_clause'; }

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
  nodeKind: 'for_in_clause';
  left: Builder<Pattern | PatternList> | Omit<PatternListOptions, 'nodeKind'>;
  right: Builder<Expression | Lambda> | Omit<LambdaOptions, 'nodeKind'> | (Builder<Expression | Lambda> | Omit<LambdaOptions, 'nodeKind'>)[];
}

export namespace for_in_clause {
  export function from(options: Omit<ForInClauseOptions, 'nodeKind'>): ForInClauseBuilder {
    const _ctor = options.left;
    const b = new ForInClauseBuilder(_ctor instanceof Builder ? _ctor : pattern_list.from(_ctor));
    if (options.right !== undefined) {
      const _v = options.right;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.right(..._arr.map(_v => _v instanceof Builder ? _v : lambda.from(_v)));
    }
    return b;
  }
}

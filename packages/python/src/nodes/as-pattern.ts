import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AsPattern, CasePattern, Expression, Identifier } from '../types.js';


class AsPatternBuilder extends Builder<AsPattern> {
  private _alias?: Builder;
  private _children: Builder<CasePattern | Expression | Identifier>[] = [];

  constructor(...children: Builder<CasePattern | Expression | Identifier>[]) {
    super();
    this._children = children;
  }

  alias(value: Builder): this {
    this._alias = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('as');
    if (this._alias) parts.push(this.renderChild(this._alias, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AsPattern {
    return {
      kind: 'as_pattern',
      alias: this._alias?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as AsPattern;
  }

  override get nodeKind(): string { return 'as_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'as', type: 'as' });
    if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    return parts;
  }
}

export type { AsPatternBuilder };

export function as_pattern(...children: Builder<CasePattern | Expression | Identifier>[]): AsPatternBuilder {
  return new AsPatternBuilder(...children);
}

export interface AsPatternOptions {
  alias?: Builder;
  children: Builder<CasePattern | Expression | Identifier> | (Builder<CasePattern | Expression | Identifier>)[];
}

export namespace as_pattern {
  export function from(options: AsPatternOptions): AsPatternBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new AsPatternBuilder(..._arr);
    if (options.alias !== undefined) b.alias(options.alias);
    return b;
  }
}

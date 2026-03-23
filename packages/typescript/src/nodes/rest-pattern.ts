import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, Identifier, MemberExpression, NonNullExpression, ObjectPattern, RestPattern, SubscriptExpression, Undefined } from '../types.js';


class RestPatternBuilder extends Builder<RestPattern> {
  private _children: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression>[] = [];

  constructor(...children: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('...');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RestPattern {
    return {
      kind: 'rest_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as RestPattern;
  }

  override get nodeKind(): string { return 'rest_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '...', type: '...' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { RestPatternBuilder };

export function rest_pattern(...children: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression>[]): RestPatternBuilder {
  return new RestPatternBuilder(...children);
}

export interface RestPatternOptions {
  children?: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression> | (Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression>)[];
}

export namespace rest_pattern {
  export function from(options: RestPatternOptions): RestPatternBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new RestPatternBuilder(..._arr);
    return b;
  }
}

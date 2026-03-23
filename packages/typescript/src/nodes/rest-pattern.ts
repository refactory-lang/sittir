import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, Identifier, MemberExpression, NonNullExpression, ObjectPattern, RestPattern, SubscriptExpression, Undefined } from '../types.js';


class RestPatternBuilder extends Builder<RestPattern> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
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
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as RestPattern;
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

export function rest_pattern(children: Builder): RestPatternBuilder {
  return new RestPatternBuilder(children);
}

export interface RestPatternOptions {
  children: Builder<ArrayPattern | Identifier | MemberExpression | NonNullExpression | ObjectPattern | SubscriptExpression | Undefined> | (Builder<ArrayPattern | Identifier | MemberExpression | NonNullExpression | ObjectPattern | SubscriptExpression | Undefined>)[];
}

export namespace rest_pattern {
  export function from(options: RestPatternOptions): RestPatternBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new RestPatternBuilder(_ctor);
    return b;
  }
}

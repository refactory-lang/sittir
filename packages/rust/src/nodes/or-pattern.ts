import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { OrPattern, Pattern } from '../types.js';


class OrPatternBuilder extends Builder<OrPattern> {
  private _children: Builder<Pattern>[] = [];

  constructor(...children: Builder<Pattern>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('|');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): OrPattern {
    return {
      kind: 'or_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as OrPattern;
  }

  override get nodeKind(): string { return 'or_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '|', type: '|' });
    return parts;
  }
}

export type { OrPatternBuilder };

export function or_pattern(...children: Builder<Pattern>[]): OrPatternBuilder {
  return new OrPatternBuilder(...children);
}

export interface OrPatternOptions {
  children: Builder<Pattern> | (Builder<Pattern>)[];
}

export namespace or_pattern {
  export function from(options: OrPatternOptions): OrPatternBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new OrPatternBuilder(..._arr);
    return b;
  }
}

import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MutableSpecifier, Pattern, ReferencePattern } from '../types.js';


class ReferencePatternBuilder extends Builder<ReferencePattern> {
  private _children: Builder<Pattern | MutableSpecifier>[] = [];

  constructor(...children: Builder<Pattern | MutableSpecifier>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('&');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ReferencePattern {
    return {
      kind: 'reference_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as ReferencePattern;
  }

  override get nodeKind(): string { return 'reference_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '&', type: '&' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ReferencePatternBuilder };

export function reference_pattern(...children: Builder<Pattern | MutableSpecifier>[]): ReferencePatternBuilder {
  return new ReferencePatternBuilder(...children);
}

export interface ReferencePatternOptions {
  children: Builder<Pattern | MutableSpecifier> | (Builder<Pattern | MutableSpecifier>)[];
}

export namespace reference_pattern {
  export function from(options: ReferencePatternOptions): ReferencePatternBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new ReferencePatternBuilder(..._arr);
    return b;
  }
}

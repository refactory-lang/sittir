import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MutPattern, MutableSpecifier, Pattern } from '../types.js';


class MutPatternBuilder extends Builder<MutPattern> {
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MutPattern {
    return {
      kind: 'mut_pattern',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as MutPattern;
  }

  override get nodeKind(): string { return 'mut_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { MutPatternBuilder };

export function mut_pattern(...children: Builder[]): MutPatternBuilder {
  return new MutPatternBuilder(...children);
}

export interface MutPatternOptions {
  children: Builder<Pattern | MutableSpecifier> | (Builder<Pattern | MutableSpecifier>)[];
}

export namespace mut_pattern {
  export function from(options: MutPatternOptions): MutPatternBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new MutPatternBuilder(..._arr);
    return b;
  }
}

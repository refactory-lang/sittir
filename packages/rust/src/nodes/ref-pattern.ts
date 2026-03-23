import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Pattern, RefPattern } from '../types.js';


class RefPatternBuilder extends Builder<RefPattern> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('ref');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RefPattern {
    return {
      kind: 'ref_pattern',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as RefPattern;
  }

  override get nodeKind(): string { return 'ref_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'ref', type: 'ref' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { RefPatternBuilder };

export function ref_pattern(children: Builder): RefPatternBuilder {
  return new RefPatternBuilder(children);
}

export interface RefPatternOptions {
  children: Builder<Pattern> | (Builder<Pattern>)[];
}

export namespace ref_pattern {
  export function from(options: RefPatternOptions): RefPatternBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new RefPatternBuilder(_ctor);
    return b;
  }
}

import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CapturedPattern, Pattern } from '../types.js';


class CapturedPatternBuilder extends Builder<CapturedPattern> {
  private _children: Builder<Pattern>[] = [];

  constructor(...children: Builder<Pattern>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('@');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): CapturedPattern {
    return {
      kind: 'captured_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as CapturedPattern;
  }

  override get nodeKind(): string { return 'captured_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '@', type: '@' });
    return parts;
  }
}

export type { CapturedPatternBuilder };

export function captured_pattern(...children: Builder<Pattern>[]): CapturedPatternBuilder {
  return new CapturedPatternBuilder(...children);
}

export interface CapturedPatternOptions {
  children: Builder<Pattern> | (Builder<Pattern>)[];
}

export namespace captured_pattern {
  export function from(options: CapturedPatternOptions): CapturedPatternBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new CapturedPatternBuilder(..._arr);
    return b;
  }
}

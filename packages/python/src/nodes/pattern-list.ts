import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Pattern, PatternList } from '../types.js';


class PatternListBuilder extends Builder<PatternList> {
  private _children: Builder<Pattern>[] = [];

  constructor(...children: Builder<Pattern>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(',');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): PatternList {
    return {
      kind: 'pattern_list',
      children: this._children.map(c => c.build(ctx)),
    } as PatternList;
  }

  override get nodeKind(): string { return 'pattern_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ',', type: ',' });
    return parts;
  }
}

export type { PatternListBuilder };

export function pattern_list(...children: Builder<Pattern>[]): PatternListBuilder {
  return new PatternListBuilder(...children);
}

export interface PatternListOptions {
  children: Builder<Pattern> | (Builder<Pattern>)[];
}

export namespace pattern_list {
  export function from(options: PatternListOptions): PatternListBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new PatternListBuilder(..._arr);
    return b;
  }
}

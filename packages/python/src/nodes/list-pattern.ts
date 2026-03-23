import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CasePattern, ListPattern, Pattern } from '../types.js';


class ListPatternBuilder extends Builder<ListPattern> {
  private _children: Builder<CasePattern | Pattern>[] = [];

  constructor() { super(); }

  children(...value: Builder<CasePattern | Pattern>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ListPattern {
    return {
      kind: 'list_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as ListPattern;
  }

  override get nodeKind(): string { return 'list_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { ListPatternBuilder };

export function list_pattern(): ListPatternBuilder {
  return new ListPatternBuilder();
}

export interface ListPatternOptions {
  children?: Builder<CasePattern | Pattern> | (Builder<CasePattern | Pattern>)[];
}

export namespace list_pattern {
  export function from(options: ListPatternOptions): ListPatternBuilder {
    const b = new ListPatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}

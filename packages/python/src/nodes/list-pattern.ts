import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ListPattern, Pattern } from '../types.js';


class ListPatternBuilder extends Builder<ListPattern> {
  private _children: Builder<Pattern>[] = [];

  constructor() { super(); }

  children(...value: Builder<Pattern>[]): this {
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

  override get nodeKind(): 'list_pattern' { return 'list_pattern'; }

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
  nodeKind: 'list_pattern';
  children?: Builder<Pattern> | (Builder<Pattern>)[];
}

export namespace list_pattern {
  export function from(input: Omit<ListPatternOptions, 'nodeKind'> | Builder<Pattern> | (Builder<Pattern>)[]): ListPatternBuilder {
    const options: Omit<ListPatternOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ListPatternOptions, 'nodeKind'>
      : { children: input } as Omit<ListPatternOptions, 'nodeKind'>;
    const b = new ListPatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}

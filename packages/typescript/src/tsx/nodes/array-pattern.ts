import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, AssignmentPattern, Pattern } from '../types.js';


class ArrayPatternBuilder extends Builder<ArrayPattern> {
  private _children: Builder<AssignmentPattern | Pattern>[] = [];

  constructor() { super(); }

  children(...value: Builder<AssignmentPattern | Pattern>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ArrayPattern {
    return {
      kind: 'array_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as ArrayPattern;
  }

  override get nodeKind(): string { return 'array_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { ArrayPatternBuilder };

export function array_pattern(): ArrayPatternBuilder {
  return new ArrayPatternBuilder();
}

export interface ArrayPatternOptions {
  children?: Builder<AssignmentPattern | Pattern> | (Builder<AssignmentPattern | Pattern>)[];
}

export namespace array_pattern {
  export function from(options: ArrayPatternOptions): ArrayPatternBuilder {
    const b = new ArrayPatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}

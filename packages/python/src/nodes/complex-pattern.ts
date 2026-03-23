import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ComplexPattern, Float, Integer } from '../types.js';


class ComplexPatternBuilder extends Builder<ComplexPattern> {
  private _children: Builder<Float | Integer>[] = [];

  constructor(...children: Builder<Float | Integer>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('+');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ComplexPattern {
    return {
      kind: 'complex_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as ComplexPattern;
  }

  override get nodeKind(): string { return 'complex_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: '+', type: '+' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { ComplexPatternBuilder };

export function complex_pattern(...children: Builder<Float | Integer>[]): ComplexPatternBuilder {
  return new ComplexPatternBuilder(...children);
}

export interface ComplexPatternOptions {
  children: Builder<Float | Integer> | (Builder<Float | Integer>)[];
}

export namespace complex_pattern {
  export function from(options: ComplexPatternOptions): ComplexPatternBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new ComplexPatternBuilder(..._arr);
    return b;
  }
}

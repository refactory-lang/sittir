import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, AssignmentPattern, Pattern } from '../types.js';
import { assignment_pattern } from './assignment-pattern.js';
import type { AssignmentPatternOptions } from './assignment-pattern.js';


class ArrayPatternBuilder extends Builder<ArrayPattern> {
  private _children: Builder<Pattern | AssignmentPattern>[] = [];

  constructor() { super(); }

  children(...value: Builder<Pattern | AssignmentPattern>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ArrayPattern {
    return {
      kind: 'array_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as ArrayPattern;
  }

  override get nodeKind(): 'array_pattern' { return 'array_pattern'; }

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
  nodeKind: 'array_pattern';
  children?: Builder<Pattern | AssignmentPattern> | Omit<AssignmentPatternOptions, 'nodeKind'> | (Builder<Pattern | AssignmentPattern> | Omit<AssignmentPatternOptions, 'nodeKind'>)[];
}

export namespace array_pattern {
  export function from(input: Omit<ArrayPatternOptions, 'nodeKind'> | Builder<Pattern | AssignmentPattern> | Omit<AssignmentPatternOptions, 'nodeKind'> | (Builder<Pattern | AssignmentPattern> | Omit<AssignmentPatternOptions, 'nodeKind'>)[]): ArrayPatternBuilder {
    const options: Omit<ArrayPatternOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ArrayPatternOptions, 'nodeKind'>
      : { children: input } as Omit<ArrayPatternOptions, 'nodeKind'>;
    const b = new ArrayPatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : assignment_pattern.from(_x)));
    }
    return b;
  }
}

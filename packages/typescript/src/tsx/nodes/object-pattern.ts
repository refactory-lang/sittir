import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ObjectAssignmentPattern, ObjectPattern, PairPattern, RestPattern, ShorthandPropertyIdentifierPattern } from '../types.js';


class ObjectPatternBuilder extends Builder<ObjectPattern> {
  private _children: Builder<ObjectAssignmentPattern | PairPattern | RestPattern | ShorthandPropertyIdentifierPattern>[] = [];

  constructor() { super(); }

  children(...value: Builder<ObjectAssignmentPattern | PairPattern | RestPattern | ShorthandPropertyIdentifierPattern>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ObjectPattern {
    return {
      kind: 'object_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as ObjectPattern;
  }

  override get nodeKind(): string { return 'object_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { ObjectPatternBuilder };

export function object_pattern(): ObjectPatternBuilder {
  return new ObjectPatternBuilder();
}

export interface ObjectPatternOptions {
  children?: Builder<ObjectAssignmentPattern | PairPattern | RestPattern | ShorthandPropertyIdentifierPattern> | (Builder<ObjectAssignmentPattern | PairPattern | RestPattern | ShorthandPropertyIdentifierPattern>)[];
}

export namespace object_pattern {
  export function from(options: ObjectPatternOptions): ObjectPatternBuilder {
    const b = new ObjectPatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}

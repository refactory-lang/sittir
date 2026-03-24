import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ObjectAssignmentPattern, ObjectPattern, PairPattern, RestPattern, ShorthandPropertyIdentifierPattern } from '../types.js';
import { pair_pattern } from './pair-pattern.js';
import type { PairPatternOptions } from './pair-pattern.js';
import { rest_pattern } from './rest-pattern.js';
import type { RestPatternOptions } from './rest-pattern.js';
import { object_assignment_pattern } from './object-assignment-pattern.js';
import type { ObjectAssignmentPatternOptions } from './object-assignment-pattern.js';


class ObjectPatternBuilder extends Builder<ObjectPattern> {
  private _children: Builder<PairPattern | RestPattern | ObjectAssignmentPattern | ShorthandPropertyIdentifierPattern>[] = [];

  constructor() { super(); }

  children(...value: Builder<PairPattern | RestPattern | ObjectAssignmentPattern | ShorthandPropertyIdentifierPattern>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ObjectPattern {
    return {
      kind: 'object_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as ObjectPattern;
  }

  override get nodeKind(): 'object_pattern' { return 'object_pattern'; }

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
  nodeKind: 'object_pattern';
  children?: Builder<PairPattern | RestPattern | ObjectAssignmentPattern | ShorthandPropertyIdentifierPattern> | PairPatternOptions | RestPatternOptions | ObjectAssignmentPatternOptions | (Builder<PairPattern | RestPattern | ObjectAssignmentPattern | ShorthandPropertyIdentifierPattern> | PairPatternOptions | RestPatternOptions | ObjectAssignmentPatternOptions)[];
}

export namespace object_pattern {
  export function from(input: Omit<ObjectPatternOptions, 'nodeKind'> | Builder<PairPattern | RestPattern | ObjectAssignmentPattern | ShorthandPropertyIdentifierPattern> | PairPatternOptions | RestPatternOptions | ObjectAssignmentPatternOptions | (Builder<PairPattern | RestPattern | ObjectAssignmentPattern | ShorthandPropertyIdentifierPattern> | PairPatternOptions | RestPatternOptions | ObjectAssignmentPatternOptions)[]): ObjectPatternBuilder {
    const options: Omit<ObjectPatternOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ObjectPatternOptions, 'nodeKind'>
      : { children: input } as Omit<ObjectPatternOptions, 'nodeKind'>;
    const b = new ObjectPatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'pair_pattern': return pair_pattern.from(_v);   case 'rest_pattern': return rest_pattern.from(_v);   case 'object_assignment_pattern': return object_assignment_pattern.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}

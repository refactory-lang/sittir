import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, Expression, ObjectAssignmentPattern, ObjectPattern, ShorthandPropertyIdentifierPattern } from '../types.js';
import { object_pattern } from './object-pattern.js';
import type { ObjectPatternOptions } from './object-pattern.js';
import { array_pattern } from './array-pattern.js';
import type { ArrayPatternOptions } from './array-pattern.js';


class ObjectAssignmentPatternBuilder extends Builder<ObjectAssignmentPattern> {
  private _left: Builder<ObjectPattern | ArrayPattern | ShorthandPropertyIdentifierPattern>;
  private _right!: Builder<Expression>;

  constructor(left: Builder<ObjectPattern | ArrayPattern | ShorthandPropertyIdentifierPattern>) {
    super();
    this._left = left;
  }

  right(value: Builder<Expression>): this {
    this._right = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    parts.push('=');
    if (this._right) parts.push(this.renderChild(this._right, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ObjectAssignmentPattern {
    return {
      kind: 'object_assignment_pattern',
      left: this._left.build(ctx),
      right: this._right ? this._right.build(ctx) : undefined,
    } as ObjectAssignmentPattern;
  }

  override get nodeKind(): 'object_assignment_pattern' { return 'object_assignment_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export type { ObjectAssignmentPatternBuilder };

export function object_assignment_pattern(left: Builder<ObjectPattern | ArrayPattern | ShorthandPropertyIdentifierPattern>): ObjectAssignmentPatternBuilder {
  return new ObjectAssignmentPatternBuilder(left);
}

export interface ObjectAssignmentPatternOptions {
  nodeKind: 'object_assignment_pattern';
  left: Builder<ObjectPattern | ArrayPattern | ShorthandPropertyIdentifierPattern> | string | ObjectPatternOptions | ArrayPatternOptions;
  right: Builder<Expression>;
}

export namespace object_assignment_pattern {
  export function from(options: Omit<ObjectAssignmentPatternOptions, 'nodeKind'>): ObjectAssignmentPatternBuilder {
    const _raw = options.left;
    let _ctor: Builder<ObjectPattern | ArrayPattern | ShorthandPropertyIdentifierPattern>;
    if (typeof _raw === 'string') {
      _ctor = new LeafBuilder('shorthand_property_identifier_pattern', _raw);
    } else if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'object_pattern': _ctor = object_pattern.from(_raw); break;
        case 'array_pattern': _ctor = array_pattern.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new ObjectAssignmentPatternBuilder(_ctor);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}

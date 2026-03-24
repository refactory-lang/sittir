import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Assignment, AugmentedAssignment, Expression, ExpressionList, Pattern, PatternList, Type, Yield } from '../types.js';
import { pattern_list } from './pattern-list.js';
import type { PatternListOptions } from './pattern-list.js';
import { expression_list } from './expression-list.js';
import type { ExpressionListOptions } from './expression-list.js';
import { augmented_assignment } from './augmented-assignment.js';
import type { AugmentedAssignmentOptions } from './augmented-assignment.js';
import { yield_ } from './yield.js';
import type { YieldOptions } from './yield.js';
import { type_ } from './type.js';
import type { TypeOptions } from './type.js';


class AssignmentBuilder extends Builder<Assignment> {
  private _left: Builder<Pattern | PatternList>;
  private _right?: Builder<Expression | ExpressionList | Assignment | AugmentedAssignment | PatternList | Yield>;
  private _type?: Builder<Type>;

  constructor(left: Builder<Pattern | PatternList>) {
    super();
    this._left = left;
  }

  right(value: Builder<Expression | ExpressionList | Assignment | AugmentedAssignment | PatternList | Yield>): this {
    this._right = value;
    return this;
  }

  type(value: Builder<Type>): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    if (this._type) {
      parts.push(':');
      if (this._type) parts.push(this.renderChild(this._type, ctx));
    }
    if (this._right) {
      parts.push('=');
      if (this._right) parts.push(this.renderChild(this._right, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Assignment {
    return {
      kind: 'assignment',
      left: this._left.build(ctx),
      right: this._right ? this._right.build(ctx) : undefined,
      type: this._type ? this._type.build(ctx) : undefined,
    } as Assignment;
  }

  override get nodeKind(): 'assignment' { return 'assignment'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._type) {
      parts.push({ kind: 'token', text: ':', type: ':' });
      if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    }
    if (this._right) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    }
    return parts;
  }
}

export type { AssignmentBuilder };

export function assignment(left: Builder<Pattern | PatternList>): AssignmentBuilder {
  return new AssignmentBuilder(left);
}

export interface AssignmentOptions {
  nodeKind: 'assignment';
  left: Builder<Pattern | PatternList> | Omit<PatternListOptions, 'nodeKind'>;
  right?: Builder<Expression | ExpressionList | Assignment | AugmentedAssignment | PatternList | Yield> | ExpressionListOptions | AugmentedAssignmentOptions | PatternListOptions | YieldOptions;
  type?: Builder<Type> | Omit<TypeOptions, 'nodeKind'>;
}

export namespace assignment {
  export function from(options: Omit<AssignmentOptions, 'nodeKind'>): AssignmentBuilder {
    const _ctor = options.left;
    const b = new AssignmentBuilder(_ctor instanceof Builder ? _ctor : pattern_list.from(_ctor));
    if (options.right !== undefined) {
      const _v = options.right;
      if (_v instanceof Builder) {
        b.right(_v);
      } else {
        switch (_v.nodeKind) {
          case 'expression_list': b.right(expression_list.from(_v)); break;
          case 'augmented_assignment': b.right(augmented_assignment.from(_v)); break;
          case 'pattern_list': b.right(pattern_list.from(_v)); break;
          case 'yield': b.right(yield_.from(_v)); break;
        }
      }
    }
    if (options.type !== undefined) {
      const _v = options.type;
      b.type(_v instanceof Builder ? _v : type_.from(_v));
    }
    return b;
  }
}

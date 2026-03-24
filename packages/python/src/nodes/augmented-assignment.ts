import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Assignment, AugmentedAssignment, Expression, ExpressionList, Pattern, PatternList, Yield } from '../types.js';
import { pattern_list } from './pattern-list.js';
import type { PatternListOptions } from './pattern-list.js';
import { expression_list } from './expression-list.js';
import type { ExpressionListOptions } from './expression-list.js';
import { assignment } from './assignment.js';
import type { AssignmentOptions } from './assignment.js';
import { yield_ } from './yield.js';
import type { YieldOptions } from './yield.js';


class AugmentedAssignmentBuilder extends Builder<AugmentedAssignment> {
  private _left: Builder<Pattern | PatternList>;
  private _operator!: Builder;
  private _right!: Builder<Expression | ExpressionList | Assignment | AugmentedAssignment | PatternList | Yield>;

  constructor(left: Builder<Pattern | PatternList>) {
    super();
    this._left = left;
  }

  operator(value: Builder): this {
    this._operator = value;
    return this;
  }

  right(value: Builder<Expression | ExpressionList | Assignment | AugmentedAssignment | PatternList | Yield>): this {
    this._right = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    if (this._operator) parts.push(this.renderChild(this._operator, ctx));
    if (this._right) parts.push(this.renderChild(this._right, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AugmentedAssignment {
    return {
      kind: 'augmented_assignment',
      left: this._left.build(ctx),
      operator: this._operator ? this.buildChild(this._operator, ctx) : undefined,
      right: this._right ? this._right.build(ctx) : undefined,
    } as AugmentedAssignment;
  }

  override get nodeKind(): 'augmented_assignment' { return 'augmented_assignment'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export type { AugmentedAssignmentBuilder };

export function augmented_assignment(left: Builder<Pattern | PatternList>): AugmentedAssignmentBuilder {
  return new AugmentedAssignmentBuilder(left);
}

export interface AugmentedAssignmentOptions {
  nodeKind: 'augmented_assignment';
  left: Builder<Pattern | PatternList> | Omit<PatternListOptions, 'nodeKind'>;
  operator: Builder;
  right: Builder<Expression | ExpressionList | Assignment | AugmentedAssignment | PatternList | Yield> | ExpressionListOptions | AssignmentOptions | PatternListOptions | YieldOptions;
}

export namespace augmented_assignment {
  export function from(options: Omit<AugmentedAssignmentOptions, 'nodeKind'>): AugmentedAssignmentBuilder {
    const _ctor = options.left;
    const b = new AugmentedAssignmentBuilder(_ctor instanceof Builder ? _ctor : pattern_list.from(_ctor));
    if (options.operator !== undefined) b.operator(options.operator);
    if (options.right !== undefined) {
      const _v = options.right;
      if (_v instanceof Builder) {
        b.right(_v);
      } else {
        switch (_v.nodeKind) {
          case 'expression_list': b.right(expression_list.from(_v)); break;
          case 'assignment': b.right(assignment.from(_v)); break;
          case 'pattern_list': b.right(pattern_list.from(_v)); break;
          case 'yield': b.right(yield_.from(_v)); break;
        }
      }
    }
    return b;
  }
}

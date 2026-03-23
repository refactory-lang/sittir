import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Assignment, AugmentedAssignment, Expression, ExpressionList, Pattern, PatternList } from '../types.js';


class AssignmentBuilder extends Builder<Assignment> {
  private _left: Builder<Pattern | PatternList>;
  private _right?: Builder<Assignment | AugmentedAssignment | Expression | ExpressionList | PatternList>;
  private _type?: Builder;

  constructor(left: Builder<Pattern | PatternList>) {
    super();
    this._left = left;
  }

  right(value: Builder<Assignment | AugmentedAssignment | Expression | ExpressionList | PatternList>): this {
    this._right = value;
    return this;
  }

  type(value: Builder): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._right) parts.push(this.renderChild(this._right, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Assignment {
    return {
      kind: 'assignment',
      left: this._left.build(ctx),
      right: this._right?.build(ctx),
      type: this._type?.build(ctx),
    } as Assignment;
  }

  override get nodeKind(): string { return 'assignment'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export type { AssignmentBuilder };

export function assignment(left: Builder<Pattern | PatternList>): AssignmentBuilder {
  return new AssignmentBuilder(left);
}

export interface AssignmentOptions {
  left: Builder<Pattern | PatternList>;
  right?: Builder<Assignment | AugmentedAssignment | Expression | ExpressionList | PatternList>;
  type?: Builder;
}

export namespace assignment {
  export function from(options: AssignmentOptions): AssignmentBuilder {
    const b = new AssignmentBuilder(options.left);
    if (options.right !== undefined) b.right(options.right);
    if (options.type !== undefined) b.type(options.type);
    return b;
  }
}

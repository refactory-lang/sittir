import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ObjectAssignmentPattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ObjectAssignmentPatternBuilder extends BaseBuilder<ObjectAssignmentPattern> {
  private _left: Child;
  private _right!: Child;

  constructor(left: Child) {
    super();
    this._left = left;
  }

  right(value: Child): this {
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
      left: this.renderChild(this._left, ctx),
      right: this._right ? this.renderChild(this._right, ctx) : undefined,
    } as unknown as ObjectAssignmentPattern;
  }

  override get nodeKind(): string { return 'object_assignment_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export function object_assignment_pattern(left: Child): ObjectAssignmentPatternBuilder {
  return new ObjectAssignmentPatternBuilder(left);
}

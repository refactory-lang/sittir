import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericPattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class GenericPatternBuilder extends BaseBuilder<GenericPattern> {
  private _typeArguments: Child;
  private _children: Child[] = [];

  constructor(typeArguments: Child) {
    super();
    this._typeArguments = typeArguments;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('generic');
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GenericPattern {
    return {
      kind: 'generic_pattern',
      typeArguments: this.renderChild(this._typeArguments, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as GenericPattern;
  }

  override get nodeKind(): string { return 'generic_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'generic' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function generic_pattern(typeArguments: Child): GenericPatternBuilder {
  return new GenericPatternBuilder(typeArguments);
}
